const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

// POST /api/attendance/checkin
const checkIn = async (req, res) => {
  try {
    const { location } = req.body;
    const existing = await Attendance.findOne({
      employeeId: req.user.employeeId,
      date: { $gte: todayStart(), $lte: todayEnd() },
    });

    if (existing && existing.checkIn) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    const record = existing
      ? await Attendance.findByIdAndUpdate(
          existing._id,
          { checkIn: timeStr, status: "present", location: location || "Office" },
          { new: true }
        )
      : await Attendance.create({
          employeeId: req.user.employeeId,
          companyId: req.user.companyId,
          date: todayStart(),
          checkIn: timeStr,
          status: "present",
          location: location || "Office",
        });

    res.status(200).json({ message: "Checked in successfully", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/attendance/checkout
const checkOut = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      employeeId: req.user.employeeId,
      date: { $gte: todayStart(), $lte: todayEnd() },
    });

    if (!record || !record.checkIn) {
      return res.status(400).json({ message: "No check-in found for today" });
    }
    if (record.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    const [inH, inM] = record.checkIn.split(":").map(Number);
    const [outH, outM] = timeStr.split(":").map(Number);
    const totalHours = parseFloat(((outH * 60 + outM - (inH * 60 + inM)) / 60).toFixed(2));

    record.checkOut = timeStr;
    record.totalHours = totalHours;
    if (totalHours < 4) record.status = "half-day";
    await record.save();

    res.status(200).json({ message: "Checked out successfully", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/attendance/today
const getTodayAttendance = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      employeeId: req.user.employeeId,
      date: { $gte: todayStart(), $lte: todayEnd() },
    });
    res.status(200).json({ record: record || null });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/attendance/my?month=&year=
const getMyAttendance = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const records = await Attendance.find({
      employeeId: req.user.employeeId,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1 });

    res.status(200).json({ records });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/attendance/regularize  — request regularization for a past date
const requestRegularization = async (req, res) => {
  try {
    const { date, checkIn, checkOut, reason } = req.body;

    if (!date || !checkIn || !checkOut || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let record = await Attendance.findOne({
      employeeId: req.user.employeeId,
      date: targetDate,
    });

    if (record) {
      record.regularizationReason = reason;
      record.regularizationStatus = "pending";
      record.isRegularized = true;
      record.checkIn = checkIn;
      record.checkOut = checkOut;
      await record.save();
    } else {
      record = await Attendance.create({
        employeeId: req.user.employeeId,
        companyId: req.user.companyId,
        date: targetDate,
        checkIn,
        checkOut,
        status: "present",
        isRegularized: true,
        regularizationReason: reason,
        regularizationStatus: "pending",
      });
    }

    res.status(200).json({ message: "Regularization request submitted", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/attendance/regularizations  — HR sees all pending regularizations
const getRegularizations = async (req, res) => {
  try {
    const records = await Attendance.find({
      companyId: req.user.companyId,
      regularizationStatus: "pending",
    }).populate("employeeId", "name employeeCode department");

    res.status(200).json({ records });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/attendance/:id/regularize/approve
const approveRegularization = async (req, res) => {
  try {
    const record = await Attendance.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId, regularizationStatus: "pending" },
      {
        regularizationStatus: "approved",
        regularizationApprovedBy: req.user.employeeId,
        status: "present",
      },
      { new: true }
    );

    if (!record) return res.status(404).json({ message: "Record not found" });
    res.status(200).json({ message: "Regularization approved", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/attendance/:id/regularize/reject
const rejectRegularization = async (req, res) => {
  try {
    const record = await Attendance.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId, regularizationStatus: "pending" },
      { regularizationStatus: "rejected" },
      { new: true }
    );

    if (!record) return res.status(404).json({ message: "Record not found" });
    res.status(200).json({ message: "Regularization rejected", record });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/attendance/team  — Team Lead sees today's attendance for all active team members + self
const getTeamAttendance = async (req, res) => {
  try {
    const tlId = req.user.employeeId;
    const cid  = req.user.companyId;

    // Active reportees only
    const team = await Employee.find({
      reportingTo: tlId,
      companyId: cid,
      status: "active",
    }).select("_id name department status");

    // TL themselves
    const tlSelf = await Employee.findOne({ _id: tlId, companyId: cid })
      .select("_id name department status");

    const allMembers = tlSelf ? [tlSelf, ...team] : team;

    const attRecords = await Attendance.find({
      employeeId: { $in: allMembers.map((e) => e._id) },
      date: { $gte: todayStart(), $lte: todayEnd() },
    });

    const attByEmp = {};
    for (const r of attRecords) {
      attByEmp[r.employeeId.toString()] = r;
    }

    // Every member gets a row — "pending" means not yet checked in today
    const records = allMembers.map((emp) => {
      const att = attByEmp[emp._id.toString()];
      return {
        employeeId: { _id: emp._id, name: emp.name, department: emp.department },
        isSelf: emp._id.toString() === tlId.toString(),
        status: att ? att.status : "pending",
        checkIn:  att ? att.checkIn  : null,
        checkOut: att ? att.checkOut : null,
      };
    });

    res.status(200).json({ records, teamSize: allMembers.length });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/attendance/company?month=&year=  — HR/Admin sees all attendance
const getCompanyAttendance = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();
    const { department, employeeId } = req.query;

    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);
    const filter = { companyId: req.user.companyId, date: { $gte: from, $lte: to } };

    if (employeeId) filter.employeeId = employeeId;

    if (department) {
      const empIds = (
        await Employee.find({ companyId: req.user.companyId, department }).select("_id")
      ).map((e) => e._id);
      filter.employeeId = { $in: empIds };
    }

    const records = await Attendance.find(filter)
      .populate("employeeId", "name employeeCode department")
      .sort({ date: -1 });

    res.status(200).json({ records });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  requestRegularization,
  getRegularizations,
  approveRegularization,
  rejectRegularization,
  getTeamAttendance,
  getCompanyAttendance,
};

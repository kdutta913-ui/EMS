const Leave = require("../models/Leave");
const LeaveBalance = require("../models/LeaveBalance");
const Employee = require("../models/Employee");

const leaveTypeKeyMap = {
  "Earned Leave": "earnedLeave",
  "Sick Leave": "sickLeave",
  "Casual Leave": "casualLeave",
  "Work From Home": "workFromHome",
};

// POST /api/leaves/request
const applyLeave = async (req, res) => {
  try {
    const { type, fromDate, toDate, reason } = req.body;

    if (!type || !fromDate || !toDate || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const totalDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    const balanceKey = leaveTypeKeyMap[type];
    if (balanceKey) {
      const balance = await LeaveBalance.findOne({
        employeeId: req.user.employeeId,
        year: from.getFullYear(),
      });
      if (balance && balance[balanceKey].remaining < totalDays) {
        return res.status(400).json({ message: `Insufficient ${type} balance` });
      }
    }

    const leave = await Leave.create({
      employeeId: req.user.employeeId,
      companyId: req.user.companyId,
      type,
      fromDate: from,
      toDate: to,
      totalDays,
      reason,
    });

    res.status(201).json({ message: "Leave request submitted", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/leaves/my  — employee's own leave history
const getMyLeaves = async (req, res) => {
  try {
    const { status, year } = req.query;
    const filter = { employeeId: req.user.employeeId };

    if (status) filter.status = status;
    if (year) {
      filter.fromDate = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`),
      };
    }

    const leaves = await Leave.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ leaves });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/leaves/balance  — employee's leave balance
const getMyLeaveBalance = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    let balance = await LeaveBalance.findOne({
      employeeId: req.user.employeeId,
      year: Number(year),
    });

    if (!balance) {
      balance = await LeaveBalance.create({
        employeeId: req.user.employeeId,
        companyId: req.user.companyId,
        year: Number(year),
      });
    }

    res.status(200).json({ balance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/leaves/pending  — HR / Team Lead / Company Admin sees pending leaves
const getPendingLeaves = async (req, res) => {
  try {
    const filter = { companyId: req.user.companyId, status: "pending" };

    if (req.user.role === "TeamLead") {
      const team = await Employee.find({
        reportingTo: req.user.employeeId,
        companyId: req.user.companyId,
      }).select("_id");
      filter.employeeId = { $in: team.map((e) => e._id) };
    }

    const leaves = await Leave.find(filter)
      .populate("employeeId", "name employeeCode department")
      .sort({ createdAt: -1 });

    res.status(200).json({ leaves });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/leaves  — all leaves with filters (HR/Admin)
const getAllLeaves = async (req, res) => {
  try {
    const { status, department, employeeId, from, to, page = 1, limit = 20 } = req.query;
    const filter = { companyId: req.user.companyId };

    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    if (from || to) {
      filter.fromDate = {};
      if (from) filter.fromDate.$gte = new Date(from);
      if (to) filter.fromDate.$lte = new Date(to);
    }

    let query = Leave.find(filter).populate("employeeId", "name employeeCode department");

    if (department) {
      const empIds = (
        await Employee.find({ companyId: req.user.companyId, department }).select("_id")
      ).map((e) => e._id);
      filter.employeeId = { $in: empIds };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .populate("employeeId", "name employeeCode department")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Leave.countDocuments(filter),
    ]);

    res.status(200).json({ leaves, total });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/leaves/:id/approve
const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Leave already processed" });
    }

    leave.status = "approved";
    leave.approvedBy = req.user.employeeId;
    leave.approvedAt = new Date();
    await leave.save();

    const balanceKey = leaveTypeKeyMap[leave.type];
    if (balanceKey) {
      await LeaveBalance.findOneAndUpdate(
        { employeeId: leave.employeeId, year: new Date(leave.fromDate).getFullYear() },
        {
          $inc: {
            [`${balanceKey}.used`]: leave.totalDays,
            [`${balanceKey}.remaining`]: -leave.totalDays,
          },
        }
      );
    }

    res.status(200).json({ message: "Leave approved", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/leaves/:id/reject
const rejectLeave = async (req, res) => {
  try {
    const { reason } = req.body;
    const leave = await Leave.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!leave) return res.status(404).json({ message: "Leave not found" });
    if (leave.status !== "pending") {
      return res.status(400).json({ message: "Leave already processed" });
    }

    leave.status = "rejected";
    leave.rejectionReason = reason || "Not approved";
    leave.approvedBy = req.user.employeeId;
    leave.approvedAt = new Date();
    await leave.save();

    res.status(200).json({ message: "Leave rejected", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/leaves/:id/cancel  — employee cancels their pending leave
const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne({
      _id: req.params.id,
      employeeId: req.user.employeeId,
      status: "pending",
    });
    if (!leave) return res.status(404).json({ message: "Leave not found or cannot be cancelled" });

    leave.status = "cancelled";
    await leave.save();

    res.status(200).json({ message: "Leave cancelled", leave });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getMyLeaveBalance,
  getPendingLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
};

const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const Payroll = require("../models/Payroll");
const Task = require("../models/Task");
const Performance = require("../models/Performance");

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET /api/dashboard/admin  — Company Admin dashboard stats
const getAdminDashboard = async (req, res) => {
  try {
    const cid = req.user.companyId;
    const { start, end } = todayRange();

    const [
      totalEmployees,
      activeEmployees,
      onLeaveToday,
      presentToday,
      pendingLeaves,
      pendingRegularizations,
      presentAttendance,
      onLeaveList,
    ] = await Promise.all([
      Employee.countDocuments({ companyId: cid }),
      Employee.countDocuments({ companyId: cid, status: "active" }),
      Leave.countDocuments({
        companyId: cid,
        status: "approved",
        fromDate: { $lte: end },
        toDate: { $gte: start },
      }),
      Attendance.countDocuments({
        companyId: cid,
        date: { $gte: start, $lte: end },
        status: { $in: ["present", "wfh"] },
      }),
      Leave.countDocuments({ companyId: cid, status: "pending" }),
      Attendance.countDocuments({ companyId: cid, regularizationStatus: "pending" }),
      Attendance.find({
        companyId: cid,
        date: { $gte: start, $lte: end },
        status: { $in: ["present", "wfh"] },
      })
        .populate("employeeId", "name department designation")
        .select("employeeId checkIn status")
        .limit(100),
      Leave.find({
        companyId: cid,
        status: "approved",
        fromDate: { $lte: end },
        toDate: { $gte: start },
      })
        .populate("employeeId", "name department designation")
        .select("employeeId type")
        .limit(100),
    ]);

    const deptBreakdown = await Employee.aggregate([
      { $match: { companyId: cid, status: "active" } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recentJoinees = await Employee.find({ companyId: cid })
      .sort({ dateOfJoining: -1 })
      .limit(5)
      .select("name department designation dateOfJoining status");

    res.status(200).json({
      stats: {
        totalEmployees,
        activeEmployees,
        onLeaveToday,
        presentToday,
        pendingLeaves,
        pendingRegularizations,
      },
      presentEmployees: presentAttendance.map(a => ({
        name: a.employeeId?.name || "—",
        department: a.employeeId?.department || "—",
        designation: a.employeeId?.designation || "—",
        checkIn: a.checkIn,
        status: a.status,
      })),
      onLeaveEmployees: onLeaveList.map(l => ({
        name: l.employeeId?.name || "—",
        department: l.employeeId?.department || "—",
        designation: l.employeeId?.designation || "—",
        leaveType: l.type,
      })),
      deptBreakdown,
      recentJoinees,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/dashboard/employee  — Employee dashboard stats
const getEmployeeDashboard = async (req, res) => {
  try {
    const empId = req.user.employeeId;
    const cid = req.user.companyId;
    const { start, end } = todayRange();
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const [
      todayAttendance,
      pendingTasks,
      myLeavesPending,
      presentThisMonth,
    ] = await Promise.all([
      Attendance.findOne({ employeeId: empId, date: { $gte: start, $lte: end } }),
      Task.countDocuments({ assignedTo: empId, status: { $ne: "done" } }),
      Leave.countDocuments({ employeeId: empId, status: "pending" }),
      Attendance.countDocuments({
        employeeId: empId,
        date: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) },
        status: { $in: ["present", "wfh"] },
      }),
    ]);

    res.status(200).json({
      stats: {
        todayAttendance: todayAttendance || null,
        pendingTasks,
        myLeavesPending,
        presentThisMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/dashboard/hr
const getHRDashboard = async (req, res) => {
  try {
    const cid = req.user.companyId;
    const { start, end } = todayRange();

    const [totalEmployees, presentToday, onLeave, pendingLeaves, newHires] = await Promise.all([
      Employee.countDocuments({ companyId: cid }),
      Attendance.countDocuments({
        companyId: cid,
        date: { $gte: start, $lte: end },
        status: { $in: ["present", "wfh"] },
      }),
      Leave.countDocuments({
        companyId: cid,
        status: "approved",
        fromDate: { $lte: end },
        toDate: { $gte: start },
      }),
      Leave.countDocuments({ companyId: cid, status: "pending" }),
      Employee.countDocuments({
        companyId: cid,
        dateOfJoining: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ]);

    const statusBreakdown = await Employee.aggregate([
      { $match: { companyId: cid } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      stats: { totalEmployees, presentToday, onLeave, pendingLeaves, newHires },
      statusBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/dashboard/finance
const getFinanceDashboard = async (req, res) => {
  try {
    const cid = req.user.companyId;
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const [currentPayroll, totalEmployees, pendingPayrolls] = await Promise.all([
      Payroll.findOne({ companyId: cid, month, year, department: "All" }),
      Employee.countDocuments({ companyId: cid, status: "active" }),
      Payroll.countDocuments({ companyId: cid, status: "pending" }),
    ]);

    const payrollTrend = await Payroll.find({
      companyId: cid,
      department: "All",
    })
      .sort({ year: -1, month: -1 })
      .limit(6)
      .select("month year netAmount grossAmount");

    res.status(200).json({
      stats: {
        currentPayroll: currentPayroll || null,
        totalEmployees,
        pendingPayrolls,
      },
      payrollTrend,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/dashboard/teamlead
const getTeamLeadDashboard = async (req, res) => {
  try {
    const { start, end } = todayRange();
    const empId = req.user.employeeId;
    const cid = req.user.companyId;

    const team = await Employee.find({
      reportingTo: empId,
      companyId: cid,
    }).select("_id name");

    const teamIds = team.map((e) => e._id);
    // include the TL themselves in attendance + task queries
    const allIds = [empId, ...teamIds];

    const [presentToday, pendingLeaves, openTasks, pendingTasks] = await Promise.all([
      Attendance.countDocuments({
        employeeId: { $in: allIds },
        date: { $gte: start, $lte: end },
        status: { $in: ["present", "wfh"] },
      }),
      Leave.countDocuments({ employeeId: { $in: teamIds }, status: "pending" }),
      Task.countDocuments({ assignedTo: { $in: allIds }, status: { $ne: "done" } }),
      Task.countDocuments({ assignedTo: { $in: allIds }, status: "pending" }),
    ]);

    res.status(200).json({
      stats: {
        teamSize: team.length + 1, // +1 for the TL themselves
        presentToday,
        pendingLeaves,
        openTasks,
        pendingTasks,
      },
      team,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getEmployeeDashboard,
  getHRDashboard,
  getFinanceDashboard,
  getTeamLeadDashboard,
};

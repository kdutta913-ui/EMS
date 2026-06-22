const Payroll = require("../models/Payroll");
const Payslip = require("../models/Payslip");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");

// GET /api/payroll?month=&year=&department=
const getPayrolls = async (req, res) => {
  try {
    const { month, year, department, status } = req.query;
    const filter = { companyId: req.user.companyId };

    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (department) filter.department = department;
    if (status) filter.status = status;

    const payrolls = await Payroll.find(filter)
      .populate("processedBy", "name")
      .sort({ year: -1, month: -1 });

    res.status(200).json({ payrolls });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/payroll/process  — Finance processes payroll for a month/department
const processPayroll = async (req, res) => {
  try {
    const { month, year, department } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const existing = await Payroll.findOne({
      companyId: req.user.companyId,
      month: Number(month),
      year: Number(year),
      department: department || "All",
    });
    if (existing && existing.status === "paid") {
      return res.status(400).json({ message: "Payroll already processed for this period" });
    }

    const empFilter = { companyId: req.user.companyId, status: "active" };
    if (department && department !== "All") empFilter.department = department;

    const employees = await Employee.find(empFilter);

    const workingDays = 26;
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;
    const payslips = [];

    for (const emp of employees) {
      const presentRecords = await Attendance.countDocuments({
        employeeId: emp._id,
        date: { $gte: from, $lte: to },
        status: { $in: ["present", "wfh", "half-day"] },
      });

      const monthlySalary = emp.salary / 12;
      const basicPay = monthlySalary * 0.4;
      const hra = monthlySalary * 0.2;
      const travelAllowance = monthlySalary * 0.1;
      const medicalAllowance = monthlySalary * 0.05;
      const grossPay = basicPay + hra + travelAllowance + medicalAllowance;

      const pf = basicPay * 0.12;
      const professionalTax = 200;
      const tds = grossPay * 0.1;
      const totalDed = pf + professionalTax + tds;
      const netPay = grossPay - totalDed;

      totalGross += grossPay;
      totalNet += netPay;
      totalDeductions += totalDed;

      const existingPayslip = await Payslip.findOne({
        employeeId: emp._id,
        month: Number(month),
        year: Number(year),
      });

      let payslip;
      if (existingPayslip) {
        existingPayslip.earnings = { basicPay, hra, travelAllowance, medicalAllowance };
        existingPayslip.deductions = { pf, professionalTax, tds };
        existingPayslip.grossPay = grossPay;
        existingPayslip.totalDeductions = totalDed;
        existingPayslip.netPay = netPay;
        existingPayslip.presentDays = presentRecords;
        existingPayslip.workingDays = workingDays;
        await existingPayslip.save();
        payslip = existingPayslip;
      } else {
        payslip = await Payslip.create({
          employeeId: emp._id,
          companyId: req.user.companyId,
          payrollId: null,
          month: Number(month),
          year: Number(year),
          earnings: { basicPay, hra, travelAllowance, medicalAllowance },
          deductions: { pf, professionalTax, tds },
          grossPay,
          totalDeductions: totalDed,
          netPay,
          workingDays,
          presentDays: presentRecords,
        });
      }
      payslips.push(payslip._id);
    }

    const payrollData = {
      companyId: req.user.companyId,
      month: Number(month),
      year: Number(year),
      department: department || "All",
      totalEmployees: employees.length,
      grossAmount: totalGross,
      netAmount: totalNet,
      totalDeductions,
      status: "paid",
      processedBy: req.user._id,
      processedAt: new Date(),
      payslips,
    };

    let payroll;
    if (existing) {
      Object.assign(existing, payrollData);
      payroll = await existing.save();
    } else {
      payroll = await Payroll.create(payrollData);
      await Payslip.updateMany({ _id: { $in: payslips } }, { payrollId: payroll._id, status: "paid" });
    }

    res.status(200).json({ message: "Payroll processed successfully", payroll });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/payroll/payslips/my?month=&year=
const getMyPayslips = async (req, res) => {
  try {
    const filter = { employeeId: req.user.employeeId };
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

    const payslips = await Payslip.find(filter).sort({ year: -1, month: -1 });
    res.status(200).json({ payslips });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/payroll/payslips/:employeeId  — HR/Finance views employee payslips
const getEmployeePayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find({
      employeeId: req.params.employeeId,
      companyId: req.user.companyId,
    })
      .populate("employeeId", "name employeeCode department")
      .sort({ year: -1, month: -1 });

    res.status(200).json({ payslips });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/payroll/payslips/:id/detail
const getPayslipDetail = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate("employeeId", "name employeeCode department designation salary bankDetails")
      .populate("companyId", "name address");

    if (!payslip) return res.status(404).json({ message: "Payslip not found" });
    res.status(200).json({ payslip });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getPayrolls,
  processPayroll,
  getMyPayslips,
  getEmployeePayslips,
  getPayslipDetail,
};

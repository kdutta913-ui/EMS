const mongoose = require("mongoose");

const payslipSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    payrollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payroll",
      default: null,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    earnings: {
      basicPay: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      travelAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
    },
    deductions: {
      pf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      loanRecovery: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
    },
    grossPay: {
      type: Number,
      required: true,
    },
    totalDeductions: {
      type: Number,
      required: true,
    },
    netPay: {
      type: Number,
      required: true,
    },
    workingDays: {
      type: Number,
      default: 0,
    },
    presentDays: {
      type: Number,
      default: 0,
    },
    leaveDays: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["generated", "paid"],
      default: "generated",
    },
  },
  { timestamps: true }
);

payslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Payslip", payslipSchema);

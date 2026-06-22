const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    department: {
      type: String,
      default: "All",
    },
    totalEmployees: {
      type: Number,
      default: 0,
    },
    grossAmount: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    payslips: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payslip",
      },
    ],
  },
  { timestamps: true }
);

payrollSchema.index({ companyId: 1, month: 1, year: 1, department: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", payrollSchema);

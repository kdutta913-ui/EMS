const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
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
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    earnedLeave: {
      total: { type: Number, default: 18 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 18 },
    },
    sickLeave: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 12 },
    },
    casualLeave: {
      total: { type: Number, default: 6 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 6 },
    },
    workFromHome: {
      total: { type: Number, default: 24 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 24 },
    },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);

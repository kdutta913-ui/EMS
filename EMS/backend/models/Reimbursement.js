const mongoose = require("mongoose");

const reimbursementSchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company",      required: true },
    employeeId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    claimId:     { type: mongoose.Schema.Types.ObjectId, ref: "ExpenseClaim" },
    title:       { type: String, required: true },
    category: {
      type: String,
      enum: ["travel", "medical", "internet", "mobile", "equipment", "other"],
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "disbursed", "rejected"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", "cheque"],
      default: "bank_transfer",
    },
    notes:       { type: String, default: "" },
    disbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    disbursedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reimbursement", reimbursementSchema);

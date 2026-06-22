const mongoose = require("mongoose");

const expenseClaimSchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company",  required: true },
    employeeId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title:       { type: String, required: true },
    category: {
      type: String,
      enum: ["travel", "equipment", "software", "conference", "entertainment", "medical", "other"],
      required: true,
    },
    amount:      { type: Number, required: true },
    date:        { type: Date,   required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt:  { type: Date },
    reviewNote:  { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExpenseClaim", expenseClaimSchema);

const mongoose = require("mongoose");

const complianceSchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company",  required: true },
    title:       { type: String, required: true },
    category: {
      type: String,
      enum: ["pf_esi", "labour_law", "policy", "contract", "tax", "other"],
      default: "other",
    },
    description: { type: String, default: "" },
    dueDate:     { type: Date },
    status: {
      type: String,
      enum: ["pending", "inprogress", "completed", "overdue"],
      default: "pending",
    },
    assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    completedAt: { type: Date },
    notes:       { type: String, default: "" },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Compliance", complianceSchema);

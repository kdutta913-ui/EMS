const mongoose = require("mongoose");

const hrDocumentSchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company",  required: true },
    employeeId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    name:        { type: String, required: true },
    type: {
      type: String,
      enum: ["contract", "government_id", "certificate", "tax", "hr_policy", "other"],
      default: "other",
    },
    url:         { type: String, default: "" },
    description: { type: String, default: "" },
    uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    expiryDate:  { type: Date },
    status: {
      type: String,
      enum: ["valid", "expired", "expiring_soon"],
      default: "valid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HRDocument", hrDocumentSchema);

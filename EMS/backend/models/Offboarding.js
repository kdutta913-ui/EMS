const mongoose = require("mongoose");

const offboardingSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    companyId:  { type: mongoose.Schema.Types.ObjectId, ref: "Company",  required: true },
    exitDate:   { type: Date },
    reason:     { type: String },
    exitInterviewDate:   { type: Date },
    exitInterviewStatus: {
      type: String,
      enum: ["pending", "scheduled", "completed"],
      default: "pending",
    },
    assets: [
      {
        name:   { type: String },
        status: { type: String, enum: ["pending", "returned"], default: "pending" },
      },
    ],
    accessRevocation: {
      email:    { type: Boolean, default: false },
      vpn:      { type: Boolean, default: false },
      building: { type: Boolean, default: false },
      systems:  { type: Boolean, default: false },
    },
    finalSettlement: {
      status:   { type: String, enum: ["pending", "processing", "completed"], default: "pending" },
      amount:   { type: Number, default: 0 },
      paidDate: { type: Date },
    },
    status: {
      type: String,
      enum: ["initiated", "inprogress", "completed"],
      default: "initiated",
    },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offboarding", offboardingSchema);

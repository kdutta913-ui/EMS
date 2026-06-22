const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema(
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
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    period: {
      quarter: { type: Number, enum: [1, 2, 3, 4] },
      year: { type: Number, required: true },
    },
    metrics: [
      {
        label: { type: String, required: true },
        score: { type: Number, min: 0, max: 100 },
      },
    ],
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    goals: [
      {
        title: String,
        achieved: { type: Boolean, default: false },
      },
    ],
    feedback: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "acknowledged"],
      default: "draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Performance", performanceSchema);

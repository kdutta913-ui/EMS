const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category:    { type: String, default: "General" },
    level:       { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    duration:    { type: Number, default: 1 }, // hours
    instructor:  { type: String, default: "" },
    materials:   { type: String, default: "" }, // URL or description
    isActive:    { type: Boolean, default: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  },
  { timestamps: true }
);

const enrollmentSchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    employeeId:  { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    trainingId:  { type: mongoose.Schema.Types.ObjectId, ref: "Training", required: true },
    progress:    { type: Number, default: 0, min: 0, max: 100 },
    status:      { type: String, enum: ["enrolled", "in_progress", "completed"], default: "enrolled" },
    enrolledAt:  { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

enrollmentSchema.index({ employeeId: 1, trainingId: 1 }, { unique: true });

module.exports = {
  Training:   mongoose.model("Training",   trainingSchema),
  Enrollment: mongoose.model("Enrollment", enrollmentSchema),
};

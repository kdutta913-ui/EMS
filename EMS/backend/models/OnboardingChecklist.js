const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ["documents", "it_setup", "hr_setup", "induction", "other"],
    default: "other",
  },
  status: {
    type: String,
    enum: ["pending", "inprogress", "completed"],
    default: "pending",
  },
  dueDate: { type: Date },
  completedAt: { type: Date },
  notes: { type: String, default: "" },
}, { _id: true });

const onboardingChecklistSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    companyId:  { type: mongoose.Schema.Types.ObjectId, ref: "Company",  required: true },
    tasks: [taskSchema],
    overallStatus: {
      type: String,
      enum: ["pending", "inprogress", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

onboardingChecklistSchema.pre("save", function () {
  if (this.tasks.length === 0) {
    this.overallStatus = "pending";
  } else if (this.tasks.every(t => t.status === "completed")) {
    this.overallStatus = "completed";
  } else if (this.tasks.some(t => t.status === "inprogress" || t.status === "completed")) {
    this.overallStatus = "inprogress";
  } else {
    this.overallStatus = "pending";
  }
});

module.exports = mongoose.model("OnboardingChecklist", onboardingChecklistSchema);

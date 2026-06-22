const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["standup", "sprint_planning", "1on1", "review", "event"],
      default: "event",
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    description: { type: String, default: "" },
    link: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", scheduleSchema);

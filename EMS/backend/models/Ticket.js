const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    category: {
      type: String,
      enum: ["IT", "HR", "Finance", "Admin", "Other"],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ticketSchema.pre("save", async function () {
  if (!this.ticketNumber) {
    const count = await mongoose.model("Ticket").countDocuments({ companyId: this.companyId });
    this.ticketNumber = `TKT${String(count + 1).padStart(4, "0")}`;
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);

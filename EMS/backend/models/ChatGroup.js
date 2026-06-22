const mongoose = require("mongoose");

const chatGroupSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name:      { type: String, required: true, trim: true },
    members:   [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatGroup", chatGroupSchema);

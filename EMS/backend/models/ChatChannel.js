const mongoose = require("mongoose");

const chatChannelSchema = new mongoose.Schema(
  {
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    readOnly:    { type: Boolean, default: false },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatChannel", chatChannelSchema);

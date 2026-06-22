const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: { type: String, required: true },
    text: { type: String, default: "" },
    attachment: {
      name: String,
      url: String,
      meta: String,
    },
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at:     { type: Date, default: Date.now },
      },
    ],
    reactions: [
      {
        emoji: String,
        count: { type: Number, default: 1 },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    replyTo: {
      sender: String,
      text: String,
    },
    pinned: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ["message", "system"],
      default: "message",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");
const { getAvatarColor, getInitials } = require("../utils/chatHelpers");

/* ── Online-presence registry ──────────────────────────────────────────────
   Maps  `${companyId}:${userId}`  →  number of active socket connections.
   When the count drops to 0 the key is deleted (user is offline).          */
const onlineUsers = new Map();

/* ── Parse the non-sender User _id out of a DM chatId ──────────────────── */
const getDMRecipientId = (chatId, senderIdStr) => {
  const m = chatId.match(/^dm-([a-f0-9]{24})-([a-f0-9]{24})$/i);
  if (!m) return null;
  return m[1] === senderIdStr ? m[2] : m[1];
};

module.exports = (io) => {

  /* ── Socket auth middleware ── */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user)          return next(new Error("User not found"));
      if (!user.isActive) return next(new Error("Account deactivated"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const user      = socket.user;
    const companyId = String(user.companyId);
    const userId    = String(user._id);
    const presenceKey = `${companyId}:${userId}`;

    const room      = (chatId) => `${companyId}:${chatId}`;
    const isOnline  = (uid)    => onlineUsers.has(`${companyId}:${uid}`);

    /* ── Register as online ── */
    onlineUsers.set(presenceKey, (onlineUsers.get(presenceKey) || 0) + 1);

    /* ── Helpers ── */
    const roomSize = (chatId) =>
      io.sockets.adapter.rooms.get(room(chatId))?.size || 0;

    const markReadInDB = async (chatId) => {
      const result = await ChatMessage.updateMany(
        {
          chatId,
          companyId:         user.companyId,
          sender:            { $ne: user._id },
          "readBy.userId":   { $ne: user._id },
        },
        { $push: { readBy: { userId: user._id, at: new Date() } } }
      );
      return result.modifiedCount;
    };

    /* ── Join a chat room ── */
    socket.on("join_chat", async (chatId) => {
      socket.join(room(chatId));

      // Auto-mark all unread messages in this chat as read
      try {
        const changed = await markReadInDB(chatId);
        if (changed > 0) {
          socket.to(room(chatId)).emit("messages_read", { chatId, readBy: userId });
        }
      } catch (err) {
        console.error("join_chat mark-read error:", err.message);
      }
    });

    /* ── Leave a chat room ── */
    socket.on("leave_chat", (chatId) => {
      socket.leave(room(chatId));
    });

    /* ── Explicit mark-read (emitted by receiver on each new message) ── */
    socket.on("mark_read", async ({ chatId }) => {
      try {
        const changed = await markReadInDB(chatId);
        if (changed > 0) {
          socket.to(room(chatId)).emit("messages_read", { chatId, readBy: userId });
        }
      } catch (err) {
        console.error("mark_read error:", err.message);
      }
    });

    /* ── Send message ── */
    socket.on("send_message", async ({ chatId, text, replyTo, attachment }, ack) => {
      try {
        if (!text?.trim() && !attachment) {
          return ack?.({ ok: false, error: "Empty message" });
        }

        const msg = await ChatMessage.create({
          chatId,
          companyId:  user.companyId,
          sender:     user._id,
          senderName: user.name,
          text:       text?.trim() || "",
          replyTo:    replyTo    || null,
          attachment: attachment || null,
        });

        /* ── Determine initial delivery status ──────────────────────
           sent      – recipient has no active socket connection
           delivered – recipient is online (connected) but not reading
           read      – recipient is already in this room (viewing it)  */
        let status = "sent";
        const recipientId = getDMRecipientId(chatId, userId);

        if (chatId.startsWith("dm-") && recipientId) {
          if (isOnline(recipientId)) {
            // If recipient also has this room open they'll auto-read instantly;
            // check room size: > 1 means at least one other socket is there.
            status = roomSize(chatId) > 1 ? "read" : "delivered";
          }
        } else {
          // Group / channel: delivered if anyone else is in the room
          if (roomSize(chatId) > 1) status = "delivered";
        }

        // If message is already considered read, persist that in DB
        if (status === "read") {
          await ChatMessage.updateOne(
            { _id: msg._id },
            { $push: { readBy: { userId: user._id, at: new Date() } } }
          );
        }

        const formatted = {
          id:         msg._id,
          senderId:   userId,
          sender:     msg.senderName,
          initials:   getInitials(msg.senderName),
          color:      getAvatarColor(userId),
          text:       msg.text,
          time:       new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          date:       new Date(msg.createdAt).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
          reactions:  [],
          pinned:     false,
          status,
          attachment: msg.attachment || null,
          replyTo:    msg.replyTo   || null,
        };

        // Others in the room see the message without a status tick (it's not their message)
        socket.to(room(chatId)).emit("new_message", {
          chatId,
          message: { ...formatted, status: null },
        });

        // Return server-confirmed message (with status) to sender
        ack?.({ ok: true, message: formatted });
      } catch (err) {
        console.error("send_message error:", err);
        ack?.({ ok: false, error: err.message });
      }
    });

    /* ── Typing indicators ── */
    socket.on("typing_start", ({ chatId }) => {
      socket.to(room(chatId)).emit("user_typing", { chatId, userId, name: user.name });
    });

    socket.on("typing_stop", ({ chatId }) => {
      socket.to(room(chatId)).emit("user_stopped_typing", { chatId, userId, name: user.name });
    });

    /* ── Pin update broadcast ── */
    socket.on("pin_update", ({ chatId, messageId, pinned }) => {
      socket.to(room(chatId)).emit("message_pinned", { chatId, messageId, pinned });
    });

    /* ── Disconnect — release presence slot ── */
    socket.on("disconnect", () => {
      const count = onlineUsers.get(presenceKey) || 0;
      if (count <= 1) onlineUsers.delete(presenceKey);
      else            onlineUsers.set(presenceKey, count - 1);
    });
  });
};

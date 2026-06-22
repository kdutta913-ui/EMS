const express  = require("express");
const mongoose = require("mongoose");
const router   = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Employee = require("../models/Employee");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");
const ChatChannel = require("../models/ChatChannel");
const ChatGroup = require("../models/ChatGroup");
const { getAvatarColor, getInitials } = require("../utils/chatHelpers");

const DEFAULT_CHANNELS = [
  { id: "general",       name: "general",       description: "Company-wide discussion for everyone",     readOnly: false },
  { id: "announcements", name: "announcements",  description: "Important company announcements",          readOnly: true  },
  { id: "hr-updates",    name: "hr-updates",     description: "HR policies, updates and announcements",  readOnly: false },
  { id: "finance",       name: "finance",        description: "Finance and payroll discussions",          readOnly: false },
  { id: "random",        name: "random",         description: "Non-work banter and watercooler chat",    readOnly: false },
];

/* ── GET /api/chat/channels ── */
router.get("/channels", protect, async (req, res) => {
  try {
    const memberCount = await Employee.countDocuments({ companyId: req.user.companyId, status: "active" });
    const defaults = DEFAULT_CHANNELS.map(ch => ({ ...ch, memberCount }));

    const custom = await ChatChannel.find({ companyId: req.user.companyId }).lean();
    const customFormatted = custom.map(ch => ({
      id:          ch._id.toString(),
      _id:         ch._id,
      name:        ch.name,
      description: ch.description || "",
      readOnly:    ch.readOnly    || false,
      memberCount,
    }));

    res.json({ channels: [...defaults, ...customFormatted] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── POST /api/chat/channels ── create a custom channel */
router.post("/channels", protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Channel name is required" });

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
    const channel = await ChatChannel.create({
      companyId:   req.user.companyId,
      name:        slug,
      description: description?.trim() || "",
      createdBy:   req.user._id,
    });

    const memberCount = await Employee.countDocuments({ companyId: req.user.companyId, status: "active" });
    res.status(201).json({
      channel: {
        id:          channel._id.toString(),
        _id:         channel._id,
        name:        channel.name,
        description: channel.description,
        readOnly:    false,
        memberCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── DELETE /api/chat/channels/:channelId ── */
router.delete("/channels/:channelId", protect, async (req, res) => {
  try {
    const channel = await ChatChannel.findOne({
      _id:       req.params.channelId,
      companyId: req.user.companyId,
    });
    if (!channel) return res.status(404).json({ message: "Channel not found" });
    if (req.user.role !== "CompanyAdmin") {
      return res.status(403).json({ message: "Only Company Admin can delete channels" });
    }
    await ChatChannel.deleteOne({ _id: channel._id });
    await ChatMessage.deleteMany({ chatId: req.params.channelId, companyId: req.user.companyId });
    res.json({ message: "Channel deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET /api/chat/dms ── */
router.get("/dms", protect, async (req, res) => {
  try {
    const employees = await Employee.find({ companyId: req.user.companyId, status: "active" })
      .populate("userId", "isActive role")
      .lean();

    const dms = employees
      .filter(emp => emp.userId && emp.userId.isActive && String(emp.userId._id) !== String(req.user._id))
      .map(emp => ({
        id:         `dm-${emp._id}`,
        _id:        emp._id,
        userId:     emp.userId._id.toString(),
        userRole:   emp.userId.role,
        name:       emp.name,
        role:       emp.designation || emp.role || "",
        department: emp.department  || "",
        email:      emp.email       || "",
        phone:      emp.phone       || "",
        joined:     emp.dateOfJoining
          ? new Date(emp.dateOfJoining).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "",
        status:   "offline",
        color:    getAvatarColor(String(emp._id)),
        initials: getInitials(emp.name),
      }));

    // Company Admins only have a User record (no Employee doc), so add them separately.
    // Skip if the current user IS the Company Admin (no need to DM yourself).
    if (req.user.role !== "CompanyAdmin") {
      const admins = await User.find({
        companyId: req.user.companyId,
        role:      "CompanyAdmin",
        isActive:  true,
        _id:       { $ne: req.user._id },
      }).lean();

      for (const admin of admins) {
        dms.push({
          id:         `dm-admin-${admin._id}`,
          _id:        admin._id,
          userId:     admin._id.toString(),
          userRole:   "CompanyAdmin",
          name:       admin.name,
          role:       "Company Admin",
          department: "",
          email:      admin.email || "",
          phone:      admin.phoneNum || "",
          joined:     "",
          status:     "offline",
          color:      getAvatarColor(String(admin._id)),
          initials:   getInitials(admin.name),
        });
      }
    }

    res.json({ dms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET /api/chat/groups ── */
router.get("/groups", protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === "CompanyAdmin";

    // Fetch the current user's Employee document to get their department
    let myEmployee = null;
    if (req.user.employeeId) {
      myEmployee = await Employee.findById(req.user.employeeId).lean();
    } else if (!isAdmin) {
      // Fallback: look up by userId in case employeeId wasn't set on the User
      myEmployee = await Employee.findOne({ userId: req.user._id, companyId: req.user.companyId }).lean();
    }

    // ── Department groups ──────────────────────────────────────────
    let deptGroups = [];
    if (isAdmin) {
      // Company Admin sees all department groups
      const deptCounts = await Employee.aggregate([
        { $match: { companyId: req.user.companyId, status: "active", department: { $exists: true, $ne: null } } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
      ]);
      deptGroups = deptCounts.map(d => ({
        id:          `grp-dept-${d._id.toLowerCase().replace(/\s+/g, "-")}`,
        name:        `${d._id} Team`,
        memberCount: d.count,
        isDept:      true,
      }));
    } else if (myEmployee?.department) {
      // Other roles: only see their own department group
      const count = await Employee.countDocuments({
        companyId:  req.user.companyId,
        department: myEmployee.department,
        status:     "active",
      });
      deptGroups = [{
        id:          `grp-dept-${myEmployee.department.toLowerCase().replace(/\s+/g, "-")}`,
        name:        `${myEmployee.department} Team`,
        memberCount: count,
        isDept:      true,
      }];
    }

    // ── Custom groups ──────────────────────────────────────────────
    // Admins see all; everyone else only sees groups they are a member of
    // (or groups they created, in case they forgot to add themselves)
    const customQuery = { companyId: req.user.companyId };
    if (!isAdmin) {
      const orConditions = [{ createdBy: req.user._id }];
      if (myEmployee?._id) orConditions.push({ members: myEmployee._id });
      customQuery.$or = orConditions;
    }

    const customGroups = await ChatGroup.find(customQuery).lean();
    const customFormatted = customGroups.map(g => ({
      id:          `grp-${g._id.toString()}`,
      _id:         g._id,
      name:        g.name,
      memberCount: g.members?.length || 0,
      memberIds:   (g.members || []).map(id => id.toString()),
      isDept:      false,
    }));

    res.json({ groups: [...deptGroups, ...customFormatted] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── POST /api/chat/groups ── create a custom group */
router.post("/groups", protect, async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Group name is required" });

    // Auto-include the creator in members so they can see the group
    let initialMembers = [...(members || [])];
    if (req.user.employeeId) {
      const creatorId = req.user.employeeId.toString();
      if (!initialMembers.includes(creatorId)) initialMembers.push(creatorId);
    }

    const group = await ChatGroup.create({
      companyId: req.user.companyId,
      name:      name.trim(),
      members:   initialMembers,
      createdBy: req.user._id,
    });

    res.status(201).json({
      group: {
        id:          `grp-${group._id.toString()}`,
        _id:         group._id,
        name:        group.name,
        memberCount: group.members?.length || 0,
        isDept:      false,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT /api/chat/groups/:groupId/members ── add members to a custom group */
router.put("/groups/:groupId/members", protect, async (req, res) => {
  try {
    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "members array is required" });
    }

    const group = await ChatGroup.findOneAndUpdate(
      { _id: req.params.groupId, companyId: req.user.companyId },
      { $addToSet: { members: { $each: members } } },
      { new: true }
    );

    if (!group) return res.status(404).json({ message: "Group not found" });

    res.json({ memberCount: group.members.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET /api/chat/members ── */
router.get("/members", protect, async (req, res) => {
  try {
    const employees = await Employee.find({ companyId: req.user.companyId, status: "active" }).lean();
    const members = employees.map(emp => ({
      _id:      emp._id,
      name:     emp.name,
      role:     emp.designation || emp.role || "",
      status:   "offline",
      color:    getAvatarColor(String(emp._id)),
      initials: getInitials(emp.name),
    }));
    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET /api/chat/notifications ── */
router.get("/notifications", protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hours

    const messages = await ChatMessage.find({
      companyId: req.user.companyId,
      sender:    { $ne: req.user._id },
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Keep only the most recent message per chatId
    const chatMap = {};
    for (const msg of messages) {
      if (!chatMap[msg.chatId]) chatMap[msg.chatId] = msg;
    }

    const notifications = Object.values(chatMap).map(msg => {
      const isDM = msg.chatId.startsWith("dm-");
      return {
        id:        msg._id,
        chatId:    msg.chatId,
        sender:    msg.senderName,
        text:      msg.text?.length > 80 ? msg.text.slice(0, 80) + "…" : (msg.text || "Sent an attachment"),
        time:      new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        createdAt: msg.createdAt,
        type:      isDM ? "dm" : "message",
        source:    isDM ? `DM from ${msg.senderName}` : `#${msg.chatId}`,
      };
    });

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET /api/chat/messages/:chatId ── */
router.get("/messages/:chatId", protect, async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserIdStr = String(req.user._id);

    // For DM chats derive the other participant's User _id from the chatId
    const dmMatch     = chatId.match(/^dm-([a-f0-9]{24})-([a-f0-9]{24})$/i);
    const dmRecipient = dmMatch
      ? (dmMatch[1] === currentUserIdStr ? dmMatch[2] : dmMatch[1])
      : null;

    const messages = await ChatMessage.find({ chatId, companyId: req.user.companyId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = messages.reverse().map(m => {
      const isOwn    = String(m.sender) === currentUserIdStr;
      const readByIds = (m.readBy || []).map(r => String(r.userId));

      // status is only set for the current user's own messages
      let status = null;
      if (isOwn) {
        if (dmRecipient) {
          status = readByIds.includes(dmRecipient) ? "read" : "sent";
        } else {
          // Group / channel: read if anyone else has read it
          status = readByIds.length > 0 ? "read" : "sent";
        }
      }

      return {
        id:         m._id,
        senderId:   String(m.sender),
        sender:     m.senderName,
        initials:   getInitials(m.senderName),
        color:      getAvatarColor(String(m.sender)),
        text:       m.text,
        time:       new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        date:       new Date(m.createdAt).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        reactions:  m.reactions  || [],
        pinned:     m.pinned     || false,
        status,
        attachment: m.attachment || null,
        replyTo:    m.replyTo    || null,
        type:       m.type       || "message",
      };
    });

    res.json({ messages: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET /api/chat/pinned/:chatId ── */
router.get("/pinned/:chatId", protect, async (req, res) => {
  try {
    const pinned = await ChatMessage.find({
      chatId:    req.params.chatId,
      companyId: req.user.companyId,
      pinned:    true,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const formatted = pinned.map(m => ({
      id:       m._id,
      sender:   m.senderName,
      initials: getInitials(m.senderName),
      color:    getAvatarColor(String(m.sender)),
      text:     m.text,
      date:     new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

    res.json({ pinned: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET /api/chat/files/:chatId ── shared files */
router.get("/files/:chatId", protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      chatId:     req.params.chatId,
      companyId:  req.user.companyId,
      attachment: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const files = messages.map(m => ({
      id:     m._id,
      name:   m.attachment?.name || "Unknown file",
      url:    m.attachment?.url  || null,
      meta:   m.attachment?.meta || "",
      sender: m.senderName,
      date:   new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    }));

    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── POST /api/chat/messages/:chatId ── send message */
router.post("/messages/:chatId", protect, async (req, res) => {
  try {
    const { text, replyTo, attachment } = req.body;
    if (!text?.trim() && !attachment) {
      return res.status(400).json({ message: "Message text or attachment is required" });
    }

    const msg = await ChatMessage.create({
      chatId:     req.params.chatId,
      companyId:  req.user.companyId,
      sender:     req.user._id,
      senderName: req.user.name,
      text:       text?.trim() || "",
      replyTo:    replyTo    || null,
      attachment: attachment || null,
    });

    res.status(201).json({
      message: {
        id:         msg._id,
        sender:     msg.senderName,
        initials:   getInitials(msg.senderName),
        color:      getAvatarColor(String(msg.sender)),
        text:       msg.text,
        time:       new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        date:       new Date(msg.createdAt).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        reactions:  [],
        pinned:     false,
        attachment: msg.attachment || null,
        replyTo:    msg.replyTo   || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── PATCH /api/chat/messages/:chatId/:msgId/pin ── toggle pin */
router.patch("/messages/:chatId/:msgId/pin", protect, async (req, res) => {
  try {
    const msg = await ChatMessage.findOne({
      _id:       req.params.msgId,
      chatId:    req.params.chatId,
      companyId: req.user.companyId,
    });
    if (!msg) return res.status(404).json({ message: "Message not found" });

    msg.pinned = !msg.pinned;
    await msg.save();

    res.json({ pinned: msg.pinned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── DELETE /api/chat/messages/:chatId ── clear all messages in a chat */
router.delete("/messages/:chatId", protect, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ chatId: req.params.chatId, companyId: req.user.companyId });
    res.json({ message: "Chat cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── PUT /api/chat/status ── */
router.put("/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["online", "away", "offline"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    res.json({ status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

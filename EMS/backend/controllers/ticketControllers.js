const Ticket = require("../models/Ticket");

// POST /api/tickets
const raiseTicket = async (req, res) => {
  try {
    const { category, subject, description, priority } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({ message: "Category, subject, and description are required" });
    }

    const ticket = await Ticket.create({
      raisedBy: req.user.employeeId,
      companyId: req.user.companyId,
      category,
      subject,
      description,
      priority: priority || "medium",
    });

    res.status(201).json({ message: "Ticket raised successfully", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/tickets/my
const getMyTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { raisedBy: req.user.employeeId };
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ tickets });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/tickets  — HR/Admin sees all tickets
const getAllTickets = async (req, res) => {
  try {
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const filter = { companyId: req.user.companyId };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("raisedBy", "name employeeCode department")
        .populate("assignedTo", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Ticket.countDocuments(filter),
    ]);

    res.status(200).json({ tickets, total });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/tickets/:id/status
const updateTicketStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    const ticket = await Ticket.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    if (status === "resolved") ticket.resolvedAt = new Date();

    await ticket.save();
    res.status(200).json({ message: "Ticket updated", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/tickets/:id/comment
const addComment = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Comment message is required" });

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        $push: {
          comments: { author: req.user.employeeId, message },
        },
      },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ message: "Comment added", ticket });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { raiseTicket, getMyTickets, getAllTickets, updateTicketStatus, addComment };

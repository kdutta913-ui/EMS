const Compliance = require("../models/Compliance");

// GET /api/compliance
const getComplianceItems = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = { companyId: req.user.companyId };
    if (category) filter.category = category;
    if (status)   filter.status   = status;

    // auto-mark overdue
    await Compliance.updateMany(
      {
        companyId: req.user.companyId,
        dueDate: { $lt: new Date() },
        status:  { $in: ["pending", "inprogress"] },
      },
      { $set: { status: "overdue" } }
    );

    const items = await Compliance.find(filter)
      .populate("assignedTo", "name department")
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/compliance
const createComplianceItem = async (req, res) => {
  try {
    const item = await Compliance.create({ ...req.body, companyId: req.user.companyId });
    await item.populate("assignedTo", "name department");
    res.status(201).json({ message: "Compliance item created", item });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/compliance/:id
const updateComplianceItem = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status === "completed" && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    const item = await Compliance.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("assignedTo", "name department");

    if (!item) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Updated", item });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/compliance/:id
const deleteComplianceItem = async (req, res) => {
  try {
    await Compliance.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getComplianceItems, createComplianceItem, updateComplianceItem, deleteComplianceItem };

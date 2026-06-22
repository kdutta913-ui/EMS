const Reimbursement = require("../models/Reimbursement");

// GET /api/reimbursements
const getReimbursements = async (req, res) => {
  try {
    const { status, category, employeeId } = req.query;
    const filter = { companyId: req.user.companyId };
    if (status)     filter.status     = status;
    if (category)   filter.category   = category;
    if (employeeId) filter.employeeId = employeeId;

    const reimbursements = await Reimbursement.find(filter)
      .populate("employeeId",  "name department designation")
      .populate("claimId",     "title date")
      .populate("disbursedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ reimbursements });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/reimbursements
const createReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.create({
      ...req.body,
      companyId: req.user.companyId,
    });
    await reimbursement.populate("employeeId", "name department designation");
    res.status(201).json({ message: "Reimbursement created", reimbursement });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/reimbursements/:id/disburse
const disburseReimbursement = async (req, res) => {
  try {
    const { paymentMethod, notes } = req.body;

    const reimbursement = await Reimbursement.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        $set: {
          status:        "disbursed",
          paymentMethod: paymentMethod || "bank_transfer",
          notes:         notes || "",
          disbursedBy:   req.user._id,
          disbursedAt:   new Date(),
        },
      },
      { new: true }
    ).populate("employeeId", "name department designation");

    if (!reimbursement) return res.status(404).json({ message: "Reimbursement not found" });
    res.status(200).json({ message: "Reimbursement disbursed", reimbursement });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/reimbursements/:id/reject
const rejectReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { $set: { status: "rejected", notes: req.body.notes || "" } },
      { new: true }
    );
    if (!reimbursement) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Reimbursement rejected", reimbursement });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/reimbursements/:id
const deleteReimbursement = async (req, res) => {
  try {
    await Reimbursement.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getReimbursements, createReimbursement, disburseReimbursement, rejectReimbursement, deleteReimbursement };

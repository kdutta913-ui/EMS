const ExpenseClaim = require("../models/ExpenseClaim");
const Reimbursement = require("../models/Reimbursement");

// GET /api/expenses
const getExpenseClaims = async (req, res) => {
  try {
    const { status, category, employeeId } = req.query;
    const filter = { companyId: req.user.companyId };
    if (status)     filter.status     = status;
    if (category)   filter.category   = category;
    if (employeeId) filter.employeeId = employeeId;

    const claims = await ExpenseClaim.find(filter)
      .populate("employeeId",  "name department designation")
      .populate("submittedBy", "name")
      .populate("reviewedBy",  "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ claims });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/expenses
const createExpenseClaim = async (req, res) => {
  try {
    const claim = await ExpenseClaim.create({
      ...req.body,
      companyId:   req.user.companyId,
      submittedBy: req.user._id,
    });
    await claim.populate("employeeId", "name department designation");
    res.status(201).json({ message: "Expense claim created", claim });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PATCH /api/expenses/:id/review
const reviewExpenseClaim = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const claim = await ExpenseClaim.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        $set: {
          status,
          reviewNote:  reviewNote || "",
          reviewedBy:  req.user._id,
          reviewedAt:  new Date(),
        },
      },
      { new: true }
    ).populate("employeeId", "name department designation");

    if (!claim) return res.status(404).json({ message: "Claim not found" });

    // Auto-create a reimbursement record when approved
    if (status === "approved") {
      const existing = await Reimbursement.findOne({ claimId: claim._id });
      if (!existing) {
        await Reimbursement.create({
          companyId:  claim.companyId,
          employeeId: claim.employeeId,
          claimId:    claim._id,
          title:      claim.title,
          category:   claim.category,
          amount:     claim.amount,
          status:     "pending",
        });
      }
    }

    res.status(200).json({ message: "Claim reviewed", claim });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/expenses/:id
const deleteExpenseClaim = async (req, res) => {
  try {
    await ExpenseClaim.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getExpenseClaims, createExpenseClaim, reviewExpenseClaim, deleteExpenseClaim };

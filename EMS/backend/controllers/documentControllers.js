const HRDocument = require("../models/HRDocument");

// GET /api/hrdocuments
const getDocuments = async (req, res) => {
  try {
    const { type, employeeId, search } = req.query;
    const filter = { companyId: req.user.companyId };
    if (type)       filter.type       = type;
    if (employeeId) filter.employeeId = employeeId;
    if (search)     filter.name       = { $regex: search, $options: "i" };

    // auto-update expiry status
    const now = new Date();
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    await HRDocument.updateMany(
      { companyId: req.user.companyId, expiryDate: { $lt: now } },
      { $set: { status: "expired" } }
    );
    await HRDocument.updateMany(
      { companyId: req.user.companyId, expiryDate: { $gte: now, $lte: soon }, status: "valid" },
      { $set: { status: "expiring_soon" } }
    );

    const documents = await HRDocument.find(filter)
      .populate("employeeId",  "name department employeeCode")
      .populate("uploadedBy",  "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/hrdocuments
const createDocument = async (req, res) => {
  try {
    const doc = await HRDocument.create({
      ...req.body,
      companyId:  req.user.companyId,
      uploadedBy: req.user.employeeId || null,
    });
    await doc.populate("employeeId", "name department employeeCode");
    res.status(201).json({ message: "Document added", document: doc });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/hrdocuments/:id
const updateDocument = async (req, res) => {
  try {
    const doc = await HRDocument.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("employeeId", "name department employeeCode");
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Updated", document: doc });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/hrdocuments/:id
const deleteDocument = async (req, res) => {
  try {
    await HRDocument.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getDocuments, createDocument, updateDocument, deleteDocument };

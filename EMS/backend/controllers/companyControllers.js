const Company = require("../models/Company");
const User = require("../models/User");

// GET /api/company
const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId).populate("adminId", "name email phoneNum");
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json({ company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/company
const updateCompany = async (req, res) => {
  try {
    const allowedFields = ["name", "email", "phone", "industry", "address", "logo", "website", "gstin", "pan"];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const company = await Company.findByIdAndUpdate(req.user.companyId, updates, { new: true });
    if (!company) return res.status(404).json({ message: "Company not found" });

    res.status(200).json({ message: "Company profile updated", company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/company/settings
const getSettings = async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId).select("name email phone industry address");
    res.status(200).json({ settings: company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getCompany, updateCompany, getSettings };

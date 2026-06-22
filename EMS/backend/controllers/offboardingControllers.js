const Offboarding = require("../models/Offboarding");
const Employee    = require("../models/Employee");

const POPULATE_EMP = "name department role employeeCode email dateOfJoining salary";

// GET /api/offboarding
const getOffboardings = async (req, res) => {
  try {
    const offboardings = await Offboarding.find({ companyId: req.user.companyId })
      .populate("employeeId",  POPULATE_EMP)
      .populate("initiatedBy", "name")
      .sort({ createdAt: -1 });
    res.status(200).json({ offboardings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/offboarding/:id
const getOffboarding = async (req, res) => {
  try {
    const offboarding = await Offboarding.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate("employeeId",  POPULATE_EMP)
      .populate("initiatedBy", "name");
    if (!offboarding) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ offboarding });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/offboarding
const createOffboarding = async (req, res) => {
  try {
    const { employeeId, exitDate, reason, assets } = req.body;

    const existing = await Offboarding.findOne({
      employeeId,
      companyId: req.user.companyId,
      status: { $ne: "completed" },
    });
    if (existing) return res.status(400).json({ message: "Active offboarding already exists for this employee" });

    const defaultAssets = [
      { name: "Laptop",       status: "pending" },
      { name: "ID Card",      status: "pending" },
      { name: "Access Card",  status: "pending" },
    ];

    const offboarding = await Offboarding.create({
      employeeId,
      companyId:   req.user.companyId,
      exitDate,
      reason,
      assets:      assets || defaultAssets,
      initiatedBy: req.user.employeeId || null,
      status:      "initiated",
    });

    await Employee.findByIdAndUpdate(employeeId, { status: "inactive" });
    await offboarding.populate("employeeId", POPULATE_EMP);
    res.status(201).json({ message: "Offboarding initiated", offboarding });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/offboarding/:id
const updateOffboarding = async (req, res) => {
  try {
    const offboarding = await Offboarding.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate("employeeId",  POPULATE_EMP)
      .populate("initiatedBy", "name");

    if (!offboarding) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Updated", offboarding });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getOffboardings, getOffboarding, createOffboarding, updateOffboarding };

const Company = require("../models/Company");
const User = require("../models/User");
const Employee = require("../models/Employee");
const AuditLog = require("../models/AuditLog");

// GET /api/superadmin/companies
const getAllCompanies = async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) filter.name = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [companies, total] = await Promise.all([
      Company.find(filter)
        .populate("adminId", "name email phoneNum")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Company.countDocuments(filter),
    ]);

    res.status(200).json({ companies, total });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/superadmin/companies/:id/toggle
const toggleCompanyStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    company.isActive = !company.isActive;
    await company.save();

    await User.updateMany({ companyId: company._id }, { isActive: company.isActive });

    await AuditLog.create({
      performedBy: req.user._id,
      action: company.isActive ? "COMPANY_ACTIVATED" : "COMPANY_DEACTIVATED",
      resource: "Company",
      resourceId: company._id.toString(),
    });

    res.status(200).json({ message: `Company ${company.isActive ? "activated" : "deactivated"}`, company });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/superadmin/users
const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .populate("companyId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({ users, total });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/superadmin/stats
const getSystemStats = async (req, res) => {
  try {
    const [totalCompanies, activeCompanies, totalUsers, totalEmployees] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      User.countDocuments(),
      Employee.countDocuments(),
    ]);

    const companiesThisMonth = await Company.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    res.status(200).json({
      stats: {
        totalCompanies,
        activeCompanies,
        inactiveCompanies: totalCompanies - activeCompanies,
        totalUsers,
        totalEmployees,
        companiesThisMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/superadmin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    const filter = {};
    if (action) filter.action = { $regex: action, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("performedBy", "name email role")
        .populate("companyId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({ logs, total });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllCompanies,
  toggleCompanyStatus,
  getAllUsers,
  getSystemStats,
  getAuditLogs,
};

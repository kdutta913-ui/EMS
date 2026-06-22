const Employee = require("../models/Employee");
const User = require("../models/User");
const LeaveBalance = require("../models/LeaveBalance");
const Company = require("../models/Company");
const bcrypt = require("bcrypt");

// GET /api/employees  — list all employees in the company
const getEmployees = async (req, res) => {
  try {
    const { department, status, search, page = 1, limit = 10 } = req.query;
    const filter = { companyId: req.user.companyId };

    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeCode: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate("reportingTo", "name employeeCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({ employees, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/employees/:id
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
    }).populate("reportingTo", "name employeeCode designation");

    if (!employee) return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ employee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/employees/profile/me  — employee views own profile
const getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.employeeId).populate(
      "reportingTo",
      "name designation"
    );
    if (!employee) return res.status(404).json({ message: "Profile not found" });
    res.status(200).json({ employee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const generateUniquePhone = async () => {
  let phoneNum, exists;
  do {
    phoneNum = `9${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`;
    exists = await User.findOne({ phoneNum });
  } while (exists);
  return phoneNum;
};

// POST /api/employees  — Company Admin creates an employee
const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      department,
      role,
      designation,
      salary,
      employmentType,
      status,
      dateOfJoining,
      reportingTo,
      password,
    } = req.body;

    if (!name || !email || !department) {
      return res.status(400).json({ message: "Name, email, and department are required" });
    }

    if (!req.user.companyId) {
      return res.status(400).json({ message: "Your account is not linked to a company. Please re-login." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.employeeId) {
      return res.status(400).json({ message: "Email already registered to an employee" });
    }

    const hashedPassword = await bcrypt.hash(password || "Welcome@123", 10);
    const systemRole = ["HR", "Finance", "TeamLead"].includes(department) ? department : "Employee";

    let newUser;
    if (existingUser) {
      existingUser.name = name;
      existingUser.role = systemRole;
      existingUser.password = hashedPassword;
      existingUser.companyId = req.user.companyId;
      existingUser.isActive = true;
      await existingUser.save();
      newUser = existingUser;
    } else {
      let phoneNum;
      if (phone && /^[0-9]{10}$/.test(phone)) {
        const phoneExists = await User.findOne({ phoneNum: phone });
        phoneNum = phoneExists ? await generateUniquePhone() : phone;
      } else {
        phoneNum = await generateUniquePhone();
      }

      newUser = await User.create({
        role: systemRole,
        name,
        email,
        phoneNum,
        password: hashedPassword,
        companyId: req.user.companyId,
      });
    }

    const employee = await Employee.create({
      userId: newUser._id,
      companyId: req.user.companyId,
      name,
      email,
      phone: phone || null,
      department,
      role,
      designation,
      salary: salary || 0,
      employmentType: employmentType || "Full-Time",
      status: status || "active",
      dateOfJoining: dateOfJoining || new Date(),
      reportingTo: reportingTo || null,
    });

    newUser.employeeId = employee._id;
    await newUser.save();

    await LeaveBalance.create({
      employeeId: employee._id,
      companyId: req.user.companyId,
      year: new Date().getFullYear(),
    });

    await Company.findByIdAndUpdate(req.user.companyId, { $inc: { employeeCount: 1 } });

    res.status(201).json({ message: "Employee created successfully", employee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!employee) return res.status(404).json({ message: "Employee not found" });

    res.status(200).json({ message: "Employee updated", employee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/employees/:id/status  — activate / deactivate
const updateEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { status },
      { new: true }
    );

    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await User.findByIdAndUpdate(employee.userId, {
      isActive: status === "active",
    });

    res.status(200).json({ message: "Status updated", employee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/employees/profile/me  — employee updates their own profile
const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = ["phone", "address", "emergencyContact", "bankDetails"];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const employee = await Employee.findByIdAndUpdate(req.user.employeeId, updates, { new: true });
    if (!employee) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json({ message: "Profile updated", employee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  getMyProfile,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  updateMyProfile,
};

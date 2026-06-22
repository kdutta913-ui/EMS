const Department = require("../models/Department");
const Employee = require("../models/Employee");

// GET /api/departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ companyId: req.user.companyId, isActive: true })
      .populate("managerId", "name employeeCode designation")
      .sort({ name: 1 });

    const depsWithData = await Promise.all(
      departments.map(async (dept) => {
        const assignedEmployees = await Employee.find({
          companyId: req.user.companyId,
          teamId: dept._id,
          status: "active",
        }).select("_id name designation role department");
        return { ...dept.toObject(), employeeCount: assignedEmployees.length, assignedEmployees };
      })
    );

    res.status(200).json({ departments: depsWithData });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/departments
const createDepartment = async (req, res) => {
  try {
    const { name, description, managerId } = req.body;
    if (!name) return res.status(400).json({ message: "Department name is required" });

    const exists = await Department.findOne({ companyId: req.user.companyId, name });
    if (exists) return res.status(400).json({ message: "Department already exists" });

    const dept = await Department.create({
      companyId: req.user.companyId,
      name,
      description,
      managerId: managerId || null,
    });

    res.status(201).json({ message: "Department created", department: dept });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/departments/:id
const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { $set: req.body },
      { new: true }
    );
    if (!dept) return res.status(404).json({ message: "Department not found" });
    res.status(200).json({ message: "Department updated", department: dept });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/departments/:id
const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { isActive: false },
      { new: true }
    );
    if (!dept) return res.status(404).json({ message: "Department not found" });
    res.status(200).json({ message: "Department deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/departments/:id/assign
const assignDepartment = async (req, res) => {
  try {
    const { managerId, employeeIds } = req.body;

    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { managerId: managerId || null },
      { new: true }
    ).populate("managerId", "name designation");
    if (!dept) return res.status(404).json({ message: "Department not found" });

    // Clear existing assignments for this department
    await Employee.updateMany(
      { companyId: req.user.companyId, teamId: req.params.id },
      { $set: { teamId: null } }
    );

    // Assign the selected employees
    if (Array.isArray(employeeIds) && employeeIds.length > 0) {
      await Employee.updateMany(
        { _id: { $in: employeeIds }, companyId: req.user.companyId },
        { $set: { teamId: req.params.id } }
      );
    }

    res.status(200).json({ message: "Department updated successfully", department: dept });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment, assignDepartment };

const Task = require("../models/Task");
const Employee = require("../models/Employee");

// GET /api/tasks?status=&assignedTo=
const getTasks = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.query;
    const filter = { companyId: req.user.companyId };

    if (req.user.role === "Employee") {
      filter.assignedTo = req.user.employeeId;
    } else if (req.user.role === "TeamLead") {
      const team = await Employee.find({
        reportingTo: req.user.employeeId,
        companyId: req.user.companyId,
      }).select("_id");
      filter.$or = [
        { assignedTo: req.user.employeeId },
        { assignedTo: { $in: team.map((e) => e._id) } },
        { assignedBy: req.user.employeeId },
      ];
    }

    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name employeeCode")
      .populate("assignedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority, department } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: "Title and assignee are required" });
    }

    const task = await Task.create({
      companyId: req.user.companyId,
      title,
      description,
      assignedTo,
      assignedBy: req.user.employeeId,
      dueDate,
      priority: priority || "medium",
      department,
    });

    const populated = await task.populate("assignedTo", "name employeeCode");
    res.status(201).json({ message: "Task created", task: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (
      req.user.role === "Employee" &&
      task.assignedTo.toString() !== req.user.employeeId?.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    const allowedUpdates = req.user.role === "Employee"
      ? ["status"]
      : ["title", "description", "assignedTo", "dueDate", "priority", "status", "department"];

    allowedUpdates.forEach((f) => {
      if (req.body[f] !== undefined) task[f] = req.body[f];
    });

    await task.save();
    res.status(200).json({ message: "Task updated", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
      assignedBy: req.user.employeeId,
    });

    if (!task) return res.status(404).json({ message: "Task not found or not authorized" });
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, companyId: req.user.companyId })
      .populate("assignedTo", "name employeeCode department")
      .populate("assignedBy", "name");

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json({ task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getTask };

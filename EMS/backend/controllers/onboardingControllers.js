const OnboardingChecklist = require("../models/OnboardingChecklist");

const DEFAULT_TASKS = [
  { title: "Collect signed offer letter",       category: "documents"  },
  { title: "Collect government ID copies",      category: "documents"  },
  { title: "Bank account details submission",   category: "documents"  },
  { title: "Emergency contact form",            category: "hr_setup"   },
  { title: "Email & system access setup",       category: "it_setup"   },
  { title: "Laptop / equipment provisioning",   category: "it_setup"   },
  { title: "ID card issuance",                  category: "hr_setup"   },
  { title: "Schedule induction session",        category: "induction"  },
  { title: "Team introduction",                 category: "induction"  },
  { title: "Policy acknowledgement sign-off",   category: "hr_setup"   },
];

// GET /api/onboarding
const getChecklists = async (req, res) => {
  try {
    const checklists = await OnboardingChecklist.find({ companyId: req.user.companyId })
      .populate("employeeId", "name department role dateOfJoining status employeeCode")
      .sort({ createdAt: -1 });
    res.status(200).json({ checklists });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/onboarding/employee/:employeeId
const getChecklist = async (req, res) => {
  try {
    const checklist = await OnboardingChecklist.findOne({
      employeeId: req.params.employeeId,
      companyId:  req.user.companyId,
    }).populate("employeeId", "name department role dateOfJoining status employeeCode");
    res.status(200).json({ checklist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/onboarding
const createChecklist = async (req, res) => {
  try {
    const { employeeId, tasks } = req.body;
    const existing = await OnboardingChecklist.findOne({ employeeId, companyId: req.user.companyId });
    if (existing) return res.status(400).json({ message: "Checklist already exists for this employee" });

    const checklist = await OnboardingChecklist.create({
      employeeId,
      companyId: req.user.companyId,
      tasks: tasks || DEFAULT_TASKS.map(t => ({ ...t, status: "pending" })),
    });
    await checklist.populate("employeeId", "name department role dateOfJoining status employeeCode");
    res.status(201).json({ message: "Checklist created", checklist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/onboarding/:id/task/:taskId
const updateTask = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const checklist = await OnboardingChecklist.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!checklist) return res.status(404).json({ message: "Checklist not found" });

    const task = checklist.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (status) task.status = status;
    if (notes !== undefined) task.notes = notes;
    if (status === "completed" && !task.completedAt) task.completedAt = new Date();
    if (status && status !== "completed") task.completedAt = undefined;

    await checklist.save();
    await checklist.populate("employeeId", "name department role dateOfJoining status employeeCode");
    res.status(200).json({ message: "Task updated", checklist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/onboarding/:id/task
const addTask = async (req, res) => {
  try {
    const checklist = await OnboardingChecklist.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!checklist) return res.status(404).json({ message: "Checklist not found" });

    checklist.tasks.push({ ...req.body, status: "pending" });
    await checklist.save();
    await checklist.populate("employeeId", "name department role dateOfJoining status employeeCode");
    res.status(201).json({ message: "Task added", checklist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/onboarding/:id/task/:taskId
const deleteTask = async (req, res) => {
  try {
    const checklist = await OnboardingChecklist.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!checklist) return res.status(404).json({ message: "Checklist not found" });

    checklist.tasks = checklist.tasks.filter(t => t._id.toString() !== req.params.taskId);
    await checklist.save();
    res.status(200).json({ message: "Task removed", checklist });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getChecklists, getChecklist, createChecklist, updateTask, addTask, deleteTask };

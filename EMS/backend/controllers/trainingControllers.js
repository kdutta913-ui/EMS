const { Training, Enrollment } = require("../models/Training");

// GET /api/training — list all active courses + enrollment status for logged-in employee
const getTrainings = async (req, res) => {
  try {
    const trainings = await Training.find({ companyId: req.user.companyId, isActive: true })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    // Fetch this employee's enrollments
    const enrollments = await Enrollment.find({
      companyId:  req.user.companyId,
      employeeId: req.user.employeeId,
    });

    const enrollMap = Object.fromEntries(enrollments.map(e => [e.trainingId.toString(), e]));

    const result = trainings.map(t => ({
      ...t.toObject(),
      enrollment: enrollMap[t._id.toString()] || null,
    }));

    res.json({ trainings: result });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/training/my — only enrolled courses
const getMyTrainings = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      companyId:  req.user.companyId,
      employeeId: req.user.employeeId,
    }).populate("trainingId");

    res.json({ enrollments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/training — create course (admin/hr only)
const createTraining = async (req, res) => {
  try {
    const { title, description, category, level, duration, instructor, materials } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const training = await Training.create({
      companyId: req.user.companyId,
      createdBy: req.user.employeeId,
      title, description, category, level, duration, instructor, materials,
    });

    res.status(201).json({ message: "Training created", training });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/training/:id/enroll — employee enrolls
const enrollTraining = async (req, res) => {
  try {
    const training = await Training.findOne({ _id: req.params.id, companyId: req.user.companyId, isActive: true });
    if (!training) return res.status(404).json({ message: "Training not found" });

    const existing = await Enrollment.findOne({ employeeId: req.user.employeeId, trainingId: training._id });
    if (existing) return res.status(400).json({ message: "Already enrolled" });

    const enrollment = await Enrollment.create({
      companyId:  req.user.companyId,
      employeeId: req.user.employeeId,
      trainingId: training._id,
    });

    res.status(201).json({ message: "Enrolled successfully", enrollment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/training/:id/progress — update progress
const updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    if (progress === undefined) return res.status(400).json({ message: "Progress value required" });

    const enrollment = await Enrollment.findOne({
      employeeId: req.user.employeeId,
      trainingId: req.params.id,
    });

    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    enrollment.progress = Math.min(100, Math.max(0, Number(progress)));
    if (enrollment.progress === 0)   enrollment.status = "enrolled";
    else if (enrollment.progress < 100) enrollment.status = "in_progress";
    else {
      enrollment.status      = "completed";
      enrollment.completedAt = new Date();
    }

    await enrollment.save();
    res.json({ message: "Progress updated", enrollment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/training/:id — deactivate course (admin/hr only)
const deleteTraining = async (req, res) => {
  try {
    const training = await Training.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      { isActive: false },
      { new: true }
    );
    if (!training) return res.status(404).json({ message: "Training not found" });
    res.json({ message: "Training removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getTrainings, getMyTrainings, createTraining, enrollTraining, updateProgress, deleteTraining };

const Performance = require("../models/Performance");
const Employee = require("../models/Employee");

// POST /api/performance  — HR/TeamLead creates a performance review
const createReview = async (req, res) => {
  try {
    const { employeeId, period, metrics, goals, feedback } = req.body;

    if (!employeeId || !period?.year) {
      return res.status(400).json({ message: "Employee ID and review period are required" });
    }

    const overallScore = metrics?.length
      ? Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length)
      : 0;

    const review = await Performance.create({
      employeeId,
      companyId: req.user.companyId,
      reviewerId: req.user.employeeId,
      period,
      metrics: metrics || [],
      goals: goals || [],
      feedback,
      overallScore,
    });

    res.status(201).json({ message: "Performance review created", review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/performance/my  — employee sees own reviews
const getMyPerformance = async (req, res) => {
  try {
    const reviews = await Performance.find({
      employeeId: req.user.employeeId,
      companyId: req.user.companyId,
    })
      .populate("reviewerId", "name designation")
      .sort({ "period.year": -1, "period.quarter": -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/performance/:employeeId  — HR/TeamLead views employee reviews
const getEmployeePerformance = async (req, res) => {
  try {
    const reviews = await Performance.find({
      employeeId: req.params.employeeId,
      companyId: req.user.companyId,
    })
      .populate("reviewerId", "name designation")
      .sort({ "period.year": -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/performance  — HR/Admin sees all reviews
const getAllPerformance = async (req, res) => {
  try {
    const { year, quarter, department } = req.query;
    const filter = { companyId: req.user.companyId };

    if (year) filter["period.year"] = Number(year);
    if (quarter) filter["period.quarter"] = Number(quarter);

    let empFilter = {};
    if (department) {
      const empIds = (
        await Employee.find({ companyId: req.user.companyId, department }).select("_id")
      ).map((e) => e._id);
      filter.employeeId = { $in: empIds };
    }

    const reviews = await Performance.find(filter)
      .populate("employeeId", "name employeeCode department designation")
      .populate("reviewerId", "name")
      .sort({ "period.year": -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/performance/:id  — update a review
const updateReview = async (req, res) => {
  try {
    const review = await Performance.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
      reviewerId: req.user.employeeId,
    });

    if (!review) return res.status(404).json({ message: "Review not found" });

    const { metrics, goals, feedback, status } = req.body;
    if (metrics) {
      review.metrics = metrics;
      review.overallScore = Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length);
    }
    if (goals) review.goals = goals;
    if (feedback) review.feedback = feedback;
    if (status) review.status = status;

    await review.save();
    res.status(200).json({ message: "Review updated", review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/performance/:id/acknowledge  — employee acknowledges review
const acknowledgeReview = async (req, res) => {
  try {
    const review = await Performance.findOneAndUpdate(
      {
        _id: req.params.id,
        employeeId: req.user.employeeId,
        companyId: req.user.companyId,
      },
      { status: "acknowledged" },
      { new: true }
    );

    if (!review) return res.status(404).json({ message: "Review not found" });
    res.status(200).json({ message: "Review acknowledged", review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createReview,
  getMyPerformance,
  getEmployeePerformance,
  getAllPerformance,
  updateReview,
  acknowledgeReview,
};

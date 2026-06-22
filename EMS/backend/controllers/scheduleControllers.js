const Schedule = require("../models/Schedule");

// GET /api/schedule?from=&to=
const getSchedules = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { companyId: req.user.companyId };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }

    const schedules = await Schedule.find(filter)
      .populate("attendees", "name employeeCode")
      .populate("createdBy", "name")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({ schedules });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/schedule
const createSchedule = async (req, res) => {
  try {
    const { title, type, date, startTime, endTime, attendees, description, link } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "Title, date, start time and end time are required" });
    }

    const schedule = await Schedule.create({
      companyId: req.user.companyId,
      title,
      type: type || "event",
      date: new Date(date),
      startTime,
      endTime,
      attendees: attendees || [],
      description: description || "",
      link: link || "",
      createdBy: req.user.employeeId,
    });

    const populated = await schedule.populate([
      { path: "attendees", select: "name employeeCode" },
      { path: "createdBy", select: "name" },
    ]);

    res.status(201).json({ message: "Schedule created", schedule: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// PUT /api/schedule/:id
const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      companyId: req.user.companyId,
      createdBy: req.user.employeeId,
    });

    if (!schedule) return res.status(404).json({ message: "Schedule not found or not authorized" });

    const fields = ["title", "type", "date", "startTime", "endTime", "attendees", "description", "link"];
    fields.forEach(f => { if (req.body[f] !== undefined) schedule[f] = req.body[f]; });
    if (req.body.date) schedule.date = new Date(req.body.date);

    await schedule.save();
    res.status(200).json({ message: "Schedule updated", schedule });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/schedule/:id
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId,
      createdBy: req.user.employeeId,
    });

    if (!schedule) return res.status(404).json({ message: "Schedule not found or not authorized" });
    res.status(200).json({ message: "Schedule deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule };

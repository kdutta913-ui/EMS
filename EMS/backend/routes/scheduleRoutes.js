const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require("../controllers/scheduleControllers");

router.use(protect);

router.get("/",    getSchedules);
router.post("/",   authorize("TeamLead", "CompanyAdmin", "HR"), createSchedule);
router.put("/:id", authorize("TeamLead", "CompanyAdmin", "HR"), updateSchedule);
router.delete("/:id", authorize("TeamLead", "CompanyAdmin", "HR"), deleteSchedule);

module.exports = router;

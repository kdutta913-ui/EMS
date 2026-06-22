const express = require("express");
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  requestRegularization,
  getRegularizations,
  approveRegularization,
  rejectRegularization,
  getTeamAttendance,
  getCompanyAttendance,
} = require("../controllers/attendanceControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/checkin", checkIn);
router.post("/checkout", checkOut);
router.get("/today", getTodayAttendance);
router.get("/my", getMyAttendance);
router.post("/regularize", requestRegularization);

router.get("/team", authorize("TeamLead", "CompanyAdmin", "HR"), getTeamAttendance);
router.get("/regularizations", authorize("CompanyAdmin", "HR", "TeamLead"), getRegularizations);
router.put("/:id/regularize/approve", authorize("CompanyAdmin", "HR", "TeamLead"), approveRegularization);
router.put("/:id/regularize/reject", authorize("CompanyAdmin", "HR", "TeamLead"), rejectRegularization);
router.get("/company", authorize("CompanyAdmin", "HR", "Finance"), getCompanyAttendance);

module.exports = router;

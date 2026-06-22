const express = require("express");
const router = express.Router();
const {
  createReview,
  getMyPerformance,
  getEmployeePerformance,
  getAllPerformance,
  updateReview,
  acknowledgeReview,
} = require("../controllers/performanceControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/my", getMyPerformance);
router.put("/:id/acknowledge", acknowledgeReview);

router.post("/", authorize("CompanyAdmin", "HR", "TeamLead"), createReview);
router.get("/", authorize("CompanyAdmin", "HR", "TeamLead"), getAllPerformance);
router.get("/:employeeId", authorize("CompanyAdmin", "HR", "TeamLead"), getEmployeePerformance);
router.put("/:id", authorize("CompanyAdmin", "HR", "TeamLead"), updateReview);

module.exports = router;

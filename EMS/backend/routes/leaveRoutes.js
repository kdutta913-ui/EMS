const express = require("express");
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getMyLeaveBalance,
  getPendingLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
} = require("../controllers/leaveControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/request", applyLeave);
router.get("/my", getMyLeaves);
router.get("/balance", getMyLeaveBalance);
router.put("/:id/cancel", cancelLeave);

router.get("/pending", authorize("CompanyAdmin", "HR", "TeamLead"), getPendingLeaves);
router.get("/", authorize("CompanyAdmin", "HR", "Finance"), getAllLeaves);
router.put("/:id/approve", authorize("CompanyAdmin", "HR", "TeamLead"), approveLeave);
router.put("/:id/reject", authorize("CompanyAdmin", "HR", "TeamLead"), rejectLeave);

module.exports = router;

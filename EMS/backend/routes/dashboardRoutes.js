const express = require("express");
const router = express.Router();
const {
  getAdminDashboard,
  getEmployeeDashboard,
  getHRDashboard,
  getFinanceDashboard,
  getTeamLeadDashboard,
} = require("../controllers/dashboardControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/admin", authorize("CompanyAdmin"), getAdminDashboard);
router.get("/employee", authorize("Employee"), getEmployeeDashboard);
router.get("/hr", authorize("HR"), getHRDashboard);
router.get("/finance", authorize("Finance"), getFinanceDashboard);
router.get("/teamlead", authorize("TeamLead"), getTeamLeadDashboard);

module.exports = router;

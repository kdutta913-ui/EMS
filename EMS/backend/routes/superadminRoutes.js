const express = require("express");
const router = express.Router();
const {
  getAllCompanies,
  toggleCompanyStatus,
  getAllUsers,
  getSystemStats,
  getAuditLogs,
} = require("../controllers/superadminControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("SuperAdmin"));

router.get("/companies", getAllCompanies);
router.put("/companies/:id/toggle", toggleCompanyStatus);
router.get("/users", getAllUsers);
router.get("/stats", getSystemStats);
router.get("/audit-logs", getAuditLogs);

module.exports = router;

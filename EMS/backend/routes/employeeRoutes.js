const express = require("express");
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  getMyProfile,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  updateMyProfile,
} = require("../controllers/employeeControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/profile/me", getMyProfile);
router.put("/profile/me", updateMyProfile);

router.get("/", authorize("CompanyAdmin", "HR", "TeamLead", "Finance"), getEmployees);
router.post("/", authorize("CompanyAdmin", "HR"), createEmployee);
router.get("/:id", authorize("CompanyAdmin", "HR", "TeamLead", "Finance"), getEmployee);
router.put("/:id", authorize("CompanyAdmin", "HR"), updateEmployee);
router.put("/:id/status", authorize("CompanyAdmin", "HR"), updateEmployeeStatus);

module.exports = router;

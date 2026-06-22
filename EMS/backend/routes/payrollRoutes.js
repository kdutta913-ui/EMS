const express = require("express");
const router = express.Router();
const {
  getPayrolls,
  processPayroll,
  getMyPayslips,
  getEmployeePayslips,
  getPayslipDetail,
} = require("../controllers/payrollControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/payslips/my", getMyPayslips);
router.get("/payslips/:id/detail", getPayslipDetail);

router.get("/", authorize("CompanyAdmin", "Finance", "HR"), getPayrolls);
router.post("/process", authorize("CompanyAdmin", "Finance"), processPayroll);
router.get("/payslips/employee/:employeeId", authorize("CompanyAdmin", "Finance", "HR"), getEmployeePayslips);

module.exports = router;

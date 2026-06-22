const express = require("express");
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignDepartment,
} = require("../controllers/departmentControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getDepartments);
router.post("/", authorize("CompanyAdmin", "HR"), createDepartment);
router.put("/:id/assign", authorize("CompanyAdmin", "HR"), assignDepartment);
router.put("/:id", authorize("CompanyAdmin", "HR"), updateDepartment);
router.delete("/:id", authorize("CompanyAdmin"), deleteDepartment);

module.exports = router;

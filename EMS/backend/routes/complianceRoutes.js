const express = require("express");
const router  = express.Router();
const {
  getComplianceItems, createComplianceItem, updateComplianceItem, deleteComplianceItem,
} = require("../controllers/complianceControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("CompanyAdmin", "HR", "Finance"));

router.get("/",    getComplianceItems);
router.post("/",   createComplianceItem);
router.put("/:id", updateComplianceItem);
router.delete("/:id", deleteComplianceItem);

module.exports = router;

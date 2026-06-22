const express = require("express");
const router = express.Router();
const { getCompany, updateCompany, getSettings } = require("../controllers/companyControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getCompany);
router.put("/", authorize("CompanyAdmin"), updateCompany);
router.get("/settings", getSettings);

module.exports = router;

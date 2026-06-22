const express = require("express");
const router  = express.Router();
const {
  getOffboardings, getOffboarding, createOffboarding, updateOffboarding,
} = require("../controllers/offboardingControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("CompanyAdmin", "HR"));

router.get("/",    getOffboardings);
router.post("/",   createOffboarding);
router.get("/:id", getOffboarding);
router.put("/:id", updateOffboarding);

module.exports = router;

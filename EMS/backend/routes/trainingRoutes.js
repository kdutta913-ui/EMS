const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getTrainings, getMyTrainings, createTraining,
  enrollTraining, updateProgress, deleteTraining,
} = require("../controllers/trainingControllers");

router.use(protect);

router.get("/",        getTrainings);
router.get("/my",      getMyTrainings);
router.post("/",       authorize("CompanyAdmin", "HR"), createTraining);
router.post("/:id/enroll",   enrollTraining);
router.put("/:id/progress",  updateProgress);
router.delete("/:id",  authorize("CompanyAdmin", "HR"), deleteTraining);

module.exports = router;

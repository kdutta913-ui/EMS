const express = require("express");
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask, getTask } = require("../controllers/taskControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getTasks);
router.post("/", authorize("CompanyAdmin", "HR", "TeamLead"), createTask);
router.get("/:id", getTask);
router.put("/:id", updateTask);
router.delete("/:id", authorize("CompanyAdmin", "HR", "TeamLead"), deleteTask);

module.exports = router;

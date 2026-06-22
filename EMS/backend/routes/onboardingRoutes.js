const express = require("express");
const router  = express.Router();
const {
  getChecklists, getChecklist, createChecklist, updateTask, addTask, deleteTask,
} = require("../controllers/onboardingControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("CompanyAdmin", "HR"));

router.get("/",                        getChecklists);
router.post("/",                       createChecklist);
router.get("/employee/:employeeId",    getChecklist);
router.post("/:id/task",              addTask);
router.put("/:id/task/:taskId",       updateTask);
router.delete("/:id/task/:taskId",    deleteTask);

module.exports = router;

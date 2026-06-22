const express = require("express");
const router  = express.Router();
const {
  getExpenseClaims, createExpenseClaim, reviewExpenseClaim, deleteExpenseClaim,
} = require("../controllers/expenseClaimControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("CompanyAdmin", "Finance", "HR"));

router.get("/",             getExpenseClaims);
router.post("/",            createExpenseClaim);
router.patch("/:id/review", reviewExpenseClaim);
router.delete("/:id",       deleteExpenseClaim);

module.exports = router;

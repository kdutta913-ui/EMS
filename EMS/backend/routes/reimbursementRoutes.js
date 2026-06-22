const express = require("express");
const router  = express.Router();
const {
  getReimbursements, createReimbursement, disburseReimbursement, rejectReimbursement, deleteReimbursement,
} = require("../controllers/reimbursementControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("CompanyAdmin", "Finance", "HR"));

router.get("/",                getReimbursements);
router.post("/",               createReimbursement);
router.patch("/:id/disburse",  disburseReimbursement);
router.patch("/:id/reject",    rejectReimbursement);
router.delete("/:id",          deleteReimbursement);

module.exports = router;

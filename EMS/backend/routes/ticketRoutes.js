const express = require("express");
const router = express.Router();
const {
  raiseTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
  addComment,
} = require("../controllers/ticketControllers");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", raiseTicket);
router.get("/my", getMyTickets);
router.post("/:id/comment", addComment);

router.get("/", authorize("CompanyAdmin", "HR"), getAllTickets);
router.put("/:id/status", authorize("CompanyAdmin", "HR"), updateTicketStatus);

module.exports = router;

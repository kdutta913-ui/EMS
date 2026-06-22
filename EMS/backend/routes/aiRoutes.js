const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { chat, getAnalytics } = require("../controllers/aiController");

router.post("/chat", protect, chat);
router.get("/analytics", protect, getAnalytics);

module.exports = router;

const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe, logoutUser, changePassword } = require("../controllers/authControllers");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);
router.put("/change-password", protect, changePassword);

module.exports = router;

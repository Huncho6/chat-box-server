const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware");

// Route to send a private message
router.post("/private", authMiddleware, chatController.sendPrivateMessage);

// Route to fetch private messages between two users
router.get("/private/:recipient", authMiddleware, chatController.getPrivateMessages);

module.exports = router;
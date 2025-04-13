const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware");

// Send a private message
router.post("/private", authMiddleware, chatController.sendPrivateMessage);

// Get private messages between two users
router.get("/private/:recipient", authMiddleware, chatController.getPrivateMessages);

module.exports = router;
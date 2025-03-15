const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// Route to get chat messages
router.get("/messages", chatController.getMessages);

// Route to send a chat message
router.post("/messages", chatController.sendMessage);

module.exports = router;
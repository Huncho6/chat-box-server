const express = require("express");
const router = express.Router();

// Example route to get chat messages
router.get("/messages", (req, res) => {
  // Fetch messages from the database (this is just a placeholder)
  res.json({ messages: [] });
});

module.exports = router;

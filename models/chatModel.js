const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  sender: {
    type: String, // Changed to String for testing purposes
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;

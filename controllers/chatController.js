const Chat = require("../models/chatModel");
const User = require("../models/userModel");

// Send a private message
exports.sendPrivateMessage = async (req, res) => {
  const { recipient, content } = req.body;

  try {
    if (!recipient || !content) {
      return res.status(400).json({ message: "Recipient and content are required" });
    }

    const recipientUser = await User.findOne({ username: recipient });
    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const newMessage = new Chat({
      sender: req.user._id,
      recipient: recipientUser._id,
      content,
    });

    await newMessage.save();

    res.status(201).json({
      message: "Message sent successfully",
      data: {
        _id: newMessage._id,
        sender: req.user.username,
        recipient: recipientUser.username,
        content: newMessage.content,
        timestamp: newMessage.timestamp,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message", error });
  }
};

// Get private messages between two users
exports.getPrivateMessages = async (req, res) => {
  const { recipient } = req.params;

  try {
    const recipientUser = await User.findOne({ username: recipient });
    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const messages = await Chat.find({
      $or: [
        { sender: req.user._id, recipient: recipientUser._id },
        { sender: recipientUser._id, recipient: req.user._id },
      ],
    })
      .sort({ timestamp: 1 }) // Sort messages by timestamp
      .populate("sender", "username")
      .populate("recipient", "username");

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages", error });
  }
};
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

// Send a private message
exports.sendPrivateMessage = async (req, res) => {
  const { recipient, content } = req.body;

  try {
    // Find the recipient by username or email
    const recipientUser = await User.findOne({
      $or: [{ username: recipient }, { email: recipient }],
    });

    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Save the message to the database
    const newMessage = new Chat({
      sender: req.user._id,
      recipient: recipientUser._id,
      content,
    });

    await newMessage.save();

    // Emit the message to the recipient via Socket.IO
    const recipientSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.user && s.user.username === recipient
    );

    if (recipientSocket) {
      recipientSocket.emit("private message", {
        sender: req.user.username,
        content,
      });
    }

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error });
  }
};

// Get private messages between two users
exports.getPrivateMessages = async (req, res) => {
  const { recipient } = req.params;

  try {
    // Find the recipient by username or email
    const recipientUser = await User.findOne({
      $or: [{ username: recipient }, { email: recipient }],
    });

    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Fetch messages between the authenticated user and the recipient
    const messages = await Chat.find({
      $or: [
        { sender: req.user._id, recipient: recipientUser._id },
        { sender: recipientUser._id, recipient: req.user._id },
      ],
    }).sort({ createdAt: 1 }); // Sort messages by creation time

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error });
  }
};
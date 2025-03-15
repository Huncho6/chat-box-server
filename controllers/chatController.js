const Chat = require("../models/chatModel");

exports.getMessages = async (req, res) => {
  try {
    const messages = await Chat.find(); // Fetch messages from the database
    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages", error });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { sender, content } = req.body;

    // Validate the request body
    if (!sender || !content) {
      return res.status(400).json({ message: "Sender and content are required" });
    }

    // Save the message to the database
    const newMessage = new Chat({ sender, content });
    await newMessage.save();

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ message: "Internal Server Error", error });
    console.log("Request Body:", req.body);
  }
};
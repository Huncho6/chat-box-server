const Chat = require("../models/chatModel");

const cleanupMessages = async () => {
  try {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24); // 24 hours ago

    await Chat.deleteMany({ timestamp: { $lt: cutoff } });
    console.log("Old messages cleaned up successfully.");
  } catch (error) {
    console.error("Error cleaning up messages:", error);
  }
};

module.exports = cleanupMessages;
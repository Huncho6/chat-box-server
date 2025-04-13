// Load environment variables
require("dotenv").config();
const db = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Import required modules
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const User = require("./models/userModel");

// Initialize the app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow requests from all origins
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connected to database"));

// Map to track connected users and their socket IDs
const connectedUsers = new Map();

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error("No token provided in handshake");
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.error("Token expired");
      return next(new Error("Authentication error: Token expired"));
    }
    console.error("Error in Socket.IO authentication:", error.message);
    next(new Error("Authentication error: Invalid token"));
  }
});

// Handle socket connections
io.on("connection", (socket) => {
  if (!socket.user) {
    console.error("Socket user is not set");
    return;
  }

  console.log(`User connected: ${socket.user.username}`);
  connectedUsers.set(socket.user.username, socket.id); // Map username to socket ID

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.username}`);
    connectedUsers.delete(socket.user.username); // Remove user from the map
  });

  // Handle private messages
  socket.on("private message", ({ recipient, content }) => {
    console.log(`Message from ${socket.user.username} to ${recipient}: ${content}`);

    const recipientSocketId = connectedUsers.get(recipient); // Get recipient's socket ID
    if (recipientSocketId) {
      // Emit the message to the recipient
      io.to(recipientSocketId).emit("private message", {
        sender: socket.user.username,
        content,
      });
    } else {
      console.log(`Recipient ${recipient} is not connected.`);
    }
  });

  // Handle broadcast messages (optional, for group chats)
  socket.on("chat message", (msg) => {
    const messageWithUser = {
      sender: socket.user.username, // Include the sender's username
      content: msg.content,
    };
    console.log("Broadcasting message:", messageWithUser); // Debugging
    io.emit("chat message", messageWithUser); // Broadcast the message to all connected clients
  });
});

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
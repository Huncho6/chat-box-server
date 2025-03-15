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
const cors = require("cors"); // Import cors

// Initialize the app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174" ],// Allow requests from your frontend
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connected to database"));

// Basic route to test the server
app.get("/", (req, res) => {
  res.send("Server is running...");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  // Listen for "chat message" events from the client
  socket.on("chat message", (msg) => {
    console.log("Message received:", msg); // Debugging
    io.emit("chat message", msg); // Broadcast the message to all connected clients
  });
});

// Start the server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api/v1", userRoutes);
app.use("/api/v1/chat", chatRoutes);
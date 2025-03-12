// Load environment variables
require("dotenv").config();
const db = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

// Import required modules
const express = require("express");
const path = require("path");

// Initialize the app and server
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies

db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connected to database"));

// Basic route to test the server
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use("/api/v1", userRoutes);
app.use("/api/v1/chat", chatRoutes);
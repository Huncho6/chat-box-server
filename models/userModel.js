const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetToken: {
    type: String,
  },
  expireToken: {
    type: Date,
  },
  refreshToken: {
    type: String, // Add this field to store the refresh token
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
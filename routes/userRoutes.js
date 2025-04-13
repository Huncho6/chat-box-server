const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/userModel");

// Authentication routes
router.post("/register", userController.createAccount);
router.post("/login", userController.login);
router.post("/forgot-password", userController.userForgotPassword);
router.post("/reset-password", userController.userResetPassword);

// Protected route to get user profile
// Public route to get all users
router.get("/", authMiddleware, userController.getUsers);
router.post("/refresh-token", userController.refreshToken);

// Public route to get all users

module.exports = router;
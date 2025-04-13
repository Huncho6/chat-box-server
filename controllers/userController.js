const User = require("../models/userModel");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.createAccount = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check for generic or disposable email addresses
    const invalidEmails = [
      "test@example.com",
      "admin@example.com",
      "noreply@example.com",
    ];
    const disposableDomains = ["mailinator.com", "tempmail.com", "example.com"];
    const emailDomain = email.split("@")[1];

    if (
      invalidEmails.includes(email.toLowerCase()) ||
      disposableDomains.includes(emailDomain.toLowerCase())
    ) {
      return res.status(400).json({ message: "Email is not allowed" });
    }

    // Check if the email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Send a welcome email
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Huncho's Chat App",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">Congratulations ${username}!</h2>
          <p>Your account has been created successfully.</p>
          <p>Thank you,<br>The Team</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions);
    res.status(201).json({ message: "Account created successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error creating account", error });
  }
};

exports.login = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    console.log("Login request received:", { username, email }); // Debugging

    // Find the user by username or email
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
      console.error("User not found"); // Debugging
      return res.status(401).json({ message: "Invalid username or email" });
    }

    console.log("User found:", user); // Debugging

    // Check if the password is correct
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      console.error("Invalid password"); // Debugging
      return res.status(401).json({ message: "Invalid password" });
    }

    console.log("Password is correct"); // Debugging

    // Generate an access token (short-lived)
    const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.SECRET_KEY,
      { expiresIn: "1h" } // Access token expires in 1 hour
    );

    console.log("Access token generated:", token); // Debugging

    // Generate a refresh token (long-lived)
    const refreshToken = jwt.sign(
      { id: user._id, role: "user" },
      process.env.REFRESH_SECRET_KEY, // Use a different secret key for refresh tokens
      { expiresIn: "30d" } // Refresh token expires in 30 days
    );

    console.log("Refresh token generated:", refreshToken); // Debugging

    // Save the refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    console.log("Tokens saved to database"); // Debugging

    // Send the response with both tokens
    res.status(200).json({
      data: {
        token, // Access token
        refreshToken, // Refresh token
        userInfo: { _id: user._id, username: user.username, email: user.email },
      },
      message: "User logged in successfully",
    });
  } catch (error) {
    console.error("Error logging in:", error); // Debugging
    res.status(500).json({ message: "Error logging in", error });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token
    const newAccessToken = jwt.sign(
      { id: user._id, role: "user" },
      process.env.SECRET_KEY,
      { expiresIn: "1h" } // Access token expires in 1 hour
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res
      .status(403)
      .json({ message: "Invalid or expired refresh token", error });
  }
};

exports.userForgotPassword = async ({ body: { email } }, res) => {
  const user = await User.findOne({ email });
  const generatedToken = crypto.randomBytes(3).toString("hex");
  user.resetToken = generatedToken;
  user.expireToken = Date.now() + 1800000;
  await user.save();

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: user.email,
    subject: "Password Reset Request",
    text: `This is your password reset token: ${generatedToken}.`,
  };

  transporter.sendMail(mailOptions);
  res
    .status(200)
    .json({ message: "Password reset token has been sent to your email." });
};

exports.userResetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetToken,
      expireToken: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.expireToken = undefined;
    await user.save();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Huncho's chat App",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">${username}!</h2>
          <p>Password has been reset successfully</p>
          <p>Thank you,<br>The Team</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error });
  }
};

exports.getUsers = async (req, res) => {
  try {
    // Fetch only the username and email fields for all users
    const users = await User.find({}, "username email");

    res.status(200).json(users); // Return the users array directly
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};

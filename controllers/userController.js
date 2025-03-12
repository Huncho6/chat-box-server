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
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
  });

  await newUser.save();

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Huncho's chat App",
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
};

exports.login = async (req, res) => {
  const { username, email, password } = req.body;
  const user = await User.findOne({ $or: [{ username }, { email }] });
  const isCorrectPassword = await bcrypt.compare(password, user.password);

  const token = jwt.sign(
    { id: user._id, role: "user" },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.status(200).json({
    data: {
      token,
      userInfo: { _id: user._id, username: user.username, email: user.email },
    },
    message: "User logged in successfully",
  });
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


exports.getUsers = async (req,res) => {
  try {
      const users = await   User.find();
      res.status(201).send({
          status: "success",
          count: users.length,
          data: users,
      })

  }catch (error) {
      res.status(400).json({message: error.message});
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

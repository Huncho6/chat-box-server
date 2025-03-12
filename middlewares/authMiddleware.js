const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const dotenv = require("dotenv");
dotenv.config();

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token provided, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found, authorization denied" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid", error });
  }
};

module.exports = authMiddleware;
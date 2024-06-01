const jwt = require("jsonwebtoken");
const Users = require("../models/Users");
const Blacklist = require("../models/BlackList");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    // Check if the token is blacklisted
    const blacklistedToken = await Blacklist.findOne({ token });
    if (blacklistedToken) {
      return res.status(403).json({ message: "Token is blacklisted" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Users.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Token has expired" });
    }
    return res.status(403).json({ message: "Invalid token" });
  }
}

module.exports = authenticateToken;

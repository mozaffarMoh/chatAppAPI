const jwt = require("jsonwebtoken");
const Blacklist = require("../models/BlackList");
const express = require("express");
const authenticateToken = require("../middleware/isAuth");

async function logout(req, res) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expiresAt = new Date(decoded.exp * 1000); // Convert exp to milliseconds

    const blacklistedToken = new Blacklist({ token, expiresAt });
    await blacklistedToken.save();

    res.send("Logout successful");
  } catch (err) {
    console.log(err);
    res.sendStatus(403); // Invalid token
  }
}


const router = express.Router();

router.get("/", authenticateToken, logout);

module.exports = router;

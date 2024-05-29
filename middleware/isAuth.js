const jwt = require("jsonwebtoken");
const Users = require("../models/Users");
const Blacklist = require("../models/BlackList")

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  try {
    // Check if the token is blacklisted
    const blacklistedToken = await Blacklist.findOne({ token });
    if (blacklistedToken) {
      return res.sendStatus(403); // Forbidden, token is blacklisted
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Users.findById(decoded.userId);
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return res.sendStatus(403); // Invalid token
    }

    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    res.sendStatus(403); // Invalid token
  }
}

module.exports = authenticateToken;

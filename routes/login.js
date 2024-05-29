const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");

const router = express.Router();

/* Login */
router.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).send("Email and password are required");
    }
    const existingUser = await Users.findOne({ email });
    if (!existingUser) {
      return res.status(400).send("Email is not registered");
    }
    const isPasswordMatched = await bcrypt.compare(
      password,
      existingUser.password
    );
    
    if (!isPasswordMatched) {
      return res.status(400).send("Password is incorrect");
    }

    // Create and send JWT token
    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    return res
      .status(200)
      .json({ message: "Login success", token, userId: existingUser._id });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
});

module.exports = router;

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");
const { default: axios } = require("axios");
const router = express.Router();

/* Register new account */
router.post("/", async (req, res) => {
  const { username, email, password, profilePhoto } = req.body;
  try {
    const existingUser = await Users.findOne({ email });
    if (!username || !email || !password) {
      return res.status(400).send("Username, email, and password are required");
    }
    if (existingUser) {
      return res.status(400).send("User already exists !!");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await Users.create({
      username,
      email,
      password: hashedPassword,
      profilePhoto: profilePhoto || "",
    });

    await newUser.save();
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    return res
      .status(201)
      .json({ message: "Registration successful", token, userId: newUser._id }); // Send token in response
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
});

// Google register
router.post("/google", async (req, res) => {
  const { token } = req.body;
  let successMessage = "Successfully logged in with Gmail. Welcome!";

  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );
    const payload = response.data;

    const { sub, email, name, picture } = payload;

    let user = await Users.findOne({ email });
    if (!user) {
      successMessage = "Successfully registered with Gmail. Welcome!";
      user = new Users({
        username: name,
        email,
        password: "",
        profilePhoto: picture,
        googleId: sub,
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    return res.status(201).json({
      message: successMessage,
      token: jwtToken,
      userId: user._id,
    });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    return res.status(400).json({ message: "Invalid Google token" });
  }
});

module.exports = router;

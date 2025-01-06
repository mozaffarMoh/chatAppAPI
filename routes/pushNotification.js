const express = require("express");
const PushTokens = require("../models/PushTokens");

const router = express.Router();

router.post("/", async (req, res, next) => {
  const { receiverId, pushToken } = req.body;

  if (!receiverId || !pushToken) {
    return res.status(400).json({ message: "Receiver ID or token not provided" });
  }

  try {
    // Check if the token already exists for this receiverId
    const existingToken = await PushTokens.findOne({ receiverId });

    if (!existingToken) {
      // Add a new token if it doesn't exist
      await PushTokens.create({ receiverId, pushToken });
    } else {
      // If the token exists, ensure it's up-to-date
      if (existingToken.pushToken !== pushToken) {
        existingToken.pushToken = pushToken;
        await existingToken.save();
      }
    }

    // Fetch all tokens and structure them as { [receiverId]: pushToken }
    const allTokens = await PushTokens.find({});
    const tokensList = {};
    allTokens.forEach((token) => {
      tokensList[token.receiverId] = token.pushToken;
    });

    // Send the full object back to the frontend
    return res.status(200).json({ data: tokensList });
  } catch (err) {
    console.error("Error processing push tokens:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

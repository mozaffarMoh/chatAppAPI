const express = require("express");
const MessageBox = require("../models/MessageBox");
const authenticateToken = require("../middleware/isAuth");

/* Get all Messages with Pagination */
async function getAllMessages(req, res) {
  const userId = req.query.userId;
  const receiverId = req.query.receiverId;
  const page = parseInt(req.query.page) || 1; // Page number, default is 1 if not provided
  const limit = 10; // Number of messages per page

  try {
    if (!userId) {
      return res.send({ message: "userId not found" });
    }
    // Base query to match sender and receiver
    let query = {
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    };

    // Calculate the number of documents to limit
    const limitDocs = page * limit;

    const totalMessages = await MessageBox.countDocuments(query);

    const messages = await MessageBox.find(query)
      .sort({ _id: -1 }) // Sort by _id in descending order
      .limit(limitDocs);

    const reversedMessage = messages.reverse();
    res.json({ messages: reversedMessage, total: totalMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* Send message */
async function sendMessage(req, res) {
  const userId = req.query.userId;
  const receiverId = req.query.receiverId;
  const { message } = req.body;
  try {
    if (!userId) {
      return res.send({ message: "userId not found" });
    }
    const newMessage = new MessageBox({
      message,
      sender: userId,
      receiver: receiverId,
      timestamp: new Date(),
    });
    await newMessage.save();

    res.send("Message send success");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* Edit message */
async function editMessage(req, res) {
  const messageID = req.params.messageID;
  const { message } = req.body;
  try {
    const updatedMessage = await MessageBox.findOneAndUpdate(
      { _id: messageID },
      { message: message },
      { new: true }
    );

    if (updatedMessage) {
      res.send("Update message success");
    } else {
      res.status(404).json({ error: "Message not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* Delete message */
async function deleteMessage(req, res) {
  const messageID = req.params.messageID;
  try {
    const updatedMessage = await MessageBox.findOneAndDelete({
      _id: messageID,
    });

    if (updatedMessage) {
      res.send("Delete message success");
    } else {
      res.status(404).json({ error: "Message not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const router = express.Router();

router.get("/", authenticateToken, getAllMessages);
router.post("/send-message", authenticateToken, sendMessage);
router.put("/edit-message/:messageID", authenticateToken, editMessage);
router.delete("/delete-message/:messageID", authenticateToken, deleteMessage);

module.exports = router;

const express = require("express");
const MessageBox = require("../models/MessageBox");
const authenticateToken = require("../middleware/isAuth");

/* Get all Messages with Pagination */
async function getAllMessages(req, res) {
  const senderID = req.params.senderID;
  const receiverID = req.params.receiverID;
  const page = parseInt(req.query.page) || 1; // Page number, default is 1 if not provided
  const limit = 10; // Number of messages per page

  try {
    // Base query to match sender and receiver
    let query = {
      $or: [
        { sender: senderID, receiver: receiverID },
        { sender: receiverID, receiver: senderID },
      ],
    };

    // Calculate the number of documents to limit
    const limitDocs = page * limit;

    const messages = await MessageBox.find(query)
      .sort({ _id: -1 }) // Sort by _id in descending order
      .limit(limitDocs);

    const reversedMessage = messages.reverse();

    res.json(reversedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

/* Send message */
async function sendMessage(req, res) {
  const { message, sender, receiver } = req.body;
  try {
    const newMessage = new MessageBox({
      message,
      sender,
      receiver,
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

router.get("/:senderID/:receiverID", authenticateToken, getAllMessages);
router.post("/send-message", authenticateToken, sendMessage);
router.put("/edit-message/:messageID", authenticateToken, editMessage);
router.delete("/delete-message/:messageID", authenticateToken, deleteMessage);

module.exports = router;

const mongoose = require("mongoose");

const PushTokensSchema = new mongoose.Schema({
  receiverId: { type: String, required: true, unique: true }, // Receiver ID (unique key)
  pushToken: { type: String, required: true }, // Push token for the receiver
});

const PushTokens = mongoose.model("PushTokens", PushTokensSchema);
module.exports = PushTokens;

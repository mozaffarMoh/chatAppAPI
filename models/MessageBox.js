const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageBoxSchema = new Schema({
  message: String,
  isAudio: Boolean,
  duration: Number,
  sender: String,
  receiver: String,
  timestamp: { type: Date, default: Date.now },
});

const MessageBox = mongoose.model("MessageBox", MessageBoxSchema);

module.exports = MessageBox;

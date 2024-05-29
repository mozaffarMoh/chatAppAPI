const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const usersSchema = new Schema({
  username: String,
  email: String,
  password: String,
  profilePhoto: String,
});

const Users = mongoose.model("Users", usersSchema);

module.exports = Users;

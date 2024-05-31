const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const app = express();
app.use(
  cors({
    origin: process.env.ORIGIN, // Set the origin for CORS
    methods: ["GET", "POST", "PUT", "DELETE"], // HTTP methods to allow
    credentials: true, // to allow cookies
  })
);
const { createServer } = require("http");
const { Server } = require("socket.io");

const bodyParserLimit = "133kb";
app.use(express.json({ limit: bodyParserLimit }));
app.use(express.urlencoded({ limit: bodyParserLimit, extended: true }));
// Error handling middleware for payload too large
app.use((err, req, res, next) => {
  if (err.status === 413) {
    return res
      .status(413)
      .send("Image too large. Please upload an image smaller than 100KB.");
  }
  next(err);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ORIGIN, // frontend origin
    methods: ["GET", "POST", "PUT", "DELETE"], // HTTP methods to allow
    credentials: true, // to allow cookies
  },
});

io.on("connection", (socket) => {
  console.log("socket connected");
  socket.emit("me", socket.id);

  socket.on("sendMessage", (receiverId) => {
    io.emit("receiveMessage", receiverId);
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected");
  });

  socket.on("callUser", (data) => {
    io.emit("callUser", {
      voice: data.voice,
      video: data.video,
      userToCall: data.userToCall,
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("answerCall", (data) => {
    io.emit("callAccepted", data);
  });

  socket.on("leaveCall", () => {
    io.emit("leaveCall");
  });
});

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("success DB");
  })
  .catch((err) => {
    console.log("error DB ");
  });

const registerRoute = require("./routes/register");
const loginRoute = require("./routes/login");
const logoutRoute = require("./routes/logout");
const usersRoute = require("./routes/users");
const messagesRoute = require("./routes/messages");

app.use("/register", registerRoute);
app.use("/login", loginRoute);
app.use("/logout", logoutRoute);
app.use("/users", usersRoute);
app.use("/messages", messagesRoute);

const PORT = process.env.PORT;
httpServer.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});

const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const app = express();
const { createServer } = require("http");
const { Server } = require("socket.io");

// Convert the ORIGINS string to an array
const allowedOrigins = process.env.ORIGINS
  ? process.env.ORIGINS.split(",")
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"], // HTTP methods to allow
  credentials: true, // to allow cookies
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Error handling middleware for payload too large
app.use((req, res, next) => {
  const body = req.body;

  // Check if body contains base64 string
  if (typeof body === "object" && body !== null) {
    const keys = Object.keys(body);
    for (const key of keys) {
      const value = body[key];

      // Check if value is a base64 string
      if (typeof value === "string" && value.startsWith("data:")) {
        // Check if it is an image
        if (value.startsWith("data:image/")) {
          const base64Data = value.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");

          if (buffer.length > 133 * 1024) {
            // 133 KB
            return res
              .status(413)
              .send(
                "Image too large. Please upload an image smaller than 133KB."
              );
          }
        }
      }
    }
  }

  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
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
const checkTokenRoute = require("./routes/checkToken");

app.use("/register", registerRoute);
app.use("/login", loginRoute);
app.use("/logout", logoutRoute);
app.use("/users", usersRoute);
app.use("/messages", messagesRoute);
app.use("/check-token", checkTokenRoute);

const PORT = process.env.PORT;
httpServer.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT}`);
});

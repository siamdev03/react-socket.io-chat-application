const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());

// MongoDB Connection
mongoose.connect("mongodb+srv://12101003ss_db_user:BBvGcU4N2qIWLPf3@cluster0.n8xui1u.mongodb.net/?appName=Cluster0")
  .then(() => console.log("🍃 MongoDB Connected!"))
  .catch(err => console.error("❌ DB Error:", err));

// Models
const Document = mongoose.model("Document", new mongoose.Schema({
  _id: String,
  data: { type: Object, default: "" },
}));

const ChatMessage = mongoose.model("ChatMessage", new mongoose.Schema({
  roomId: String,
  sender: String,
  text: String,
  time: String,
  createdAt: { type: Date, default: Date.now }
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

const usersMap = {}; 

io.on("connection", (socket) => {
  socket.on("join-room", async ({ roomId, avatar }) => {
    socket.join(roomId);
    const userData = {
      id: socket.id,
      name: `User-${socket.id.substring(0, 4)}`,
      avatar: avatar || null
    };

    if (!usersMap[roomId]) usersMap[roomId] = [];
    if (!usersMap[roomId].find(u => u.id === socket.id)) usersMap[roomId].push(userData);
    io.in(roomId).emit("user-list-update", usersMap[roomId]);

    // 1. Load Document from DB
    const doc = await Document.findById(roomId);
    socket.emit("load-document", doc ? doc.data : "");

    // 2. Load Chat History (Last 50 messages) from DB
    const chatHistory = await ChatMessage.find({ roomId }).sort({ createdAt: 1 }).limit(50);
    socket.emit("load-chat-history", chatHistory);
  });

  socket.on("send-message", async (data) => {
    // Save message to DB
    const savedMsg = await ChatMessage.create({
      roomId: data.roomId,
      sender: data.sender,
      text: data.text,
      time: data.time
    });
    // Broadcast to others
    socket.to(data.roomId).emit("receive-message", savedMsg);
  });

  socket.on("send-changes", async (data) => {
    socket.to(data.roomId).emit("receive-changes", data.content);
    await Document.findByIdAndUpdate(data.roomId, { data: data.content }, { upsert: true });
  });

  socket.on("typing", (data) => {
    socket.to(data.roomId).emit("display-typing", { userName: data.userName, isTyping: data.isTyping });
  });

  socket.on("update-avatar", ({ roomId, avatar }) => {
    if (usersMap[roomId]) {
      const user = usersMap[roomId].find(u => u.id === socket.id);
      if (user) { user.avatar = avatar; io.in(roomId).emit("user-list-update", usersMap[roomId]); }
    }
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (usersMap[roomId]) {
        usersMap[roomId] = usersMap[roomId].filter(u => u.id !== socket.id);
        io.in(roomId).emit("user-list-update", usersMap[roomId]);
      }
    }
  });
});

server.listen(3000, () => console.log(` Server running on port 3000`));
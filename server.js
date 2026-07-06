const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/conversations", conversationRoutes);

app.get("/", (req, res) => {
  res.send("CampusKart API is running!");
});

const onlineUsers = new Map(); // userUid -> Set of socket ids

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register_user", (uid) => {
    if (!uid) return;
    socket.userUid = uid;

    if (!onlineUsers.has(uid)) {
      onlineUsers.set(uid, new Set());
    }
    onlineUsers.get(uid).add(socket.id);

    io.emit("user_status_change", { uid, online: true });
  });

  socket.on("get_online_status", (uids) => {
    const statusMap = {};
    (uids || []).forEach((uid) => {
      statusMap[uid] = onlineUsers.has(uid) && onlineUsers.get(uid).size > 0;
    });
    socket.emit("online_status_result", statusMap);
  });

  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      const { conversationId, senderUid, text } = data;

      if (!conversationId || !senderUid || !text || !text.trim()) {
        return;
      }

      const message = await Message.create({
        conversation: conversationId,
        senderUid,
        text: text.trim(),
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          text: message.text,
          senderUid: message.senderUid,
          createdAt: message.createdAt,
        },
      });

      io.to(conversationId).emit("receive_message", message);
    } catch (err) {
      console.error("Socket send_message error:", err.message);
    }
  });

  socket.on("typing", (data) => {
    const { conversationId, senderUid } = data;
    socket.to(conversationId).emit("user_typing", { senderUid });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);

    const uid = socket.userUid;
    if (uid && onlineUsers.has(uid)) {
      onlineUsers.get(uid).delete(socket.id);
      if (onlineUsers.get(uid).size === 0) {
        onlineUsers.delete(uid);
        io.emit("user_status_change", { uid, online: false });
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB Error:", err.message);
    process.exit(1);
  });
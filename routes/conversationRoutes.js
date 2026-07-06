const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    const conversations = await Conversation.find({ participants: uid })
      .populate("product", "title image price")
      .sort({ updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          senderUid: { $ne: uid },
          read: false,
        });
        return { ...conv.toObject(), unreadCount };
      })
    );

    res.json(conversationsWithUnread);
  } catch (err) {
    console.error("Error fetching conversations:", err.message);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      userUid, userName, userEmail,
      otherUid, otherName, otherEmail,
      productId,
    } = req.body;

    if (!userUid || !otherUid) {
      return res.status(400).json({ error: "Both userUid and otherUid are required" });
    }

    if (userUid === otherUid) {
      return res.status(400).json({ error: "Cannot start a conversation with yourself" });
    }

    const query = {
      participants: { $all: [userUid, otherUid] },
    };
    query.product = productId || null;

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userUid, otherUid],
        participantInfo: [
          { uid: userUid, name: userName, email: userEmail },
          { uid: otherUid, name: otherName, email: otherEmail },
        ],
        product: productId || null,
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate("product", "title image price");

    res.json(populated);
  } catch (err) {
    console.error("Error creating/fetching conversation:", err.message);
    res.status(500).json({ error: "Failed to create or fetch conversation" });
  }
});

router.get("/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderUid, text } = req.body;

    if (!senderUid || !text || !text.trim()) {
      return res.status(400).json({ error: "senderUid and text are required" });
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

    res.status(201).json(message);
  } catch (err) {
    console.error("Error sending message:", err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.patch("/:conversationId/read", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { uid } = req.body;

    await Message.updateMany(
      { conversation: conversationId, senderUid: { $ne: uid }, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking as read:", err.message);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

module.exports = router;
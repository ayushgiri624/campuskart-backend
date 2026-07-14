const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const validate = require("../middleware/validate");
const { createConversationSchema } = require("../schemas/conversationSchema");
const { sendMessageSchema, markReadSchema } = require("../schemas/messageSchema");
const { conversationIdParamSchema, uidParamSchema } = require("../schemas/paramsSchema");

router.get("/:uid", validate(uidParamSchema, "params"), async (req, res) => {
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

router.post("/", validate(createConversationSchema), async (req, res) => {
  try {
    const {
      userUid, userName, userEmail,
      otherUid, otherName, otherEmail,
      productId,
    } = req.body;

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

router.get("/:conversationId/messages", validate(conversationIdParamSchema, "params"), async (req, res) => {
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

router.post(
  "/:conversationId/messages",
  validate(conversationIdParamSchema, "params"),
  validate(sendMessageSchema),
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { senderUid, text } = req.body;

      const message = await Message.create({
        conversation: conversationId,
        senderUid,
        text,
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
  }
);

router.patch(
  "/:conversationId/read",
  validate(conversationIdParamSchema, "params"),
  validate(markReadSchema),
  async (req, res) => {
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
  }
);

module.exports = router;
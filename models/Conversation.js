const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  
  participants: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => arr.length === 2,
      message: "A conversation must have exactly 2 participants",
    },
  },

  
  participantInfo: [
    {
      uid: { type: String, required: true },
      name: { type: String },
      email: { type: String },
    },
  ],

  // Optional product context (e.g. "Message Seller" from a listing)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    default: null,
  },


  lastMessage: {
    text: { type: String, default: "" },
    senderUid: { type: String, default: "" },
    createdAt: { type: Date, default: null },
  },
}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ product: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
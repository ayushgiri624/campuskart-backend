const { z } = require("zod");

const sendMessageSchema = z.object({
  senderUid: z.string({ error: "senderUid is required" }).trim().min(1, "senderUid is required"),
  text: z
    .string({ error: "text is required" })
    .trim()
    .min(1, "text is required")
    .max(2000, "text is too long"),
});

const markReadSchema = z.object({
  uid: z.string({ error: "uid is required" }).trim().min(1, "uid is required"),
});

module.exports = { sendMessageSchema, markReadSchema };

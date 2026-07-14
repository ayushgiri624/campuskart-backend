const { z } = require("zod");

const createConversationSchema = z.object({
  userUid: z.string({ error: "userUid is required" }).trim().min(1, "userUid is required"),
  userName: z.string().trim().optional().default(""),
  userEmail: z.string().trim().optional().default(""),
  otherUid: z.string({ error: "otherUid is required" }).trim().min(1, "otherUid is required"),
  otherName: z.string().trim().optional().default(""),
  otherEmail: z.string().trim().optional().default(""),
  productId: z
    .union([z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"), z.literal(""), z.null()])
    .optional(),
});

module.exports = { createConversationSchema };

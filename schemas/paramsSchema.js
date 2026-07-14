const { z } = require("zod");

const objectIdString = z
  .string({ error: "ID is required" })
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID");

const conversationIdParamSchema = z.object({
  conversationId: objectIdString,
});

const uidParamSchema = z.object({
  uid: z.string({ error: "uid is required" }).trim().min(1, "uid is required"),
});

module.exports = { objectIdString, conversationIdParamSchema, uidParamSchema };

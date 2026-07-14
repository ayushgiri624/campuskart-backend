const { z } = require("zod");

const categories = ["Electronics", "Books", "Furniture", "Transport", "Services", "Other"];

const createProductSchema = z.object({
  title: z.string({ error: "Title is required" }).trim().min(1, "Title is required"),
  description: z.string().trim().optional().default(""),
  price: z.coerce.number({ error: "Price is required" }).positive("Price must be a positive number"),
  category: z.enum(categories).optional().default("Other"),
  image: z.union([z.string().url(), z.literal("")]).optional().default(""),
  sellerName: z.string({ error: "Seller name is required" }).trim().min(1, "Seller name is required"),
  sellerEmail: z.string({ error: "Seller email is required" }).trim().email("Seller email is invalid"),
  sellerWhatsapp: z.string().trim().optional().default(""),
  sellerUid: z.string({ error: "Seller UID is required" }).trim().min(1, "Seller UID is required"),
});

module.exports = { createProductSchema, categories };

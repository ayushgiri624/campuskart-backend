const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String, default: "Other" },
  image: { type: String },
  sellerName: { type: String },
  sellerEmail: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
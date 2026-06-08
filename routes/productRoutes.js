const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/seed", async (req, res) => {
  try {
    const products = [
      { title: "MacBook Air", price: 45000, description: "Good condition laptop for coding and study", category: "Electronics", image: "https://cdn.pixabay.com/photo/2020/10/21/18/07/laptop-5673901_1280.jpg", sellerName: "Ayush Giri", sellerEmail: "giriayush624@gmail.com" },
      { title: "Engineering Books", price: 1200, description: "Complete first year books set", category: "Books", image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500", sellerName: "Ayush Giri", sellerEmail: "giriayush624@gmail.com" },
      { title: "Study Table", price: 2500, description: "Wooden table for hostel/study room", category: "Furniture", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500", sellerName: "Ayush Giri", sellerEmail: "giriayush624@gmail.com" },
      { title: "Scientific Calculator", price: 800, description: "Casio fx-991 in perfect condition", category: "Electronics", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500", sellerName: "Ayush Giri", sellerEmail: "giriayush624@gmail.com" },
      { title: "Cycle", price: 3500, description: "Hero cycle for campus commute", category: "Transport", image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500", sellerName: "Ayush Giri", sellerEmail: "giriayush624@gmail.com" },
      { title: "Headphones", price: 1500, description: "Sony headphones with good bass", category: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", sellerName: "Ayush Giri", sellerEmail: "giriayush624@gmail.com" },
    ];
    await Product.insertMany(products);
    res.json({ message: "Products seeded!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
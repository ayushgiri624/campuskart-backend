const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const conversationRoutes = require("./routes/conversationRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/conversations", conversationRoutes);

app.get("/", (req, res) => {
  res.send("CampusKart API is running!");
});

module.exports = app;
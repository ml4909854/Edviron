// index.js
require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db.js");

// Import routes (make sure file name matches)
const userRoutes = require("./routes/user.routes.js");
const orderRoutes = require("./routes/order.routes.js");
const app = express();

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

const port = process.env.PORT || 5000;

// First connect to DB, then start server
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to DB:", err.message);
  });

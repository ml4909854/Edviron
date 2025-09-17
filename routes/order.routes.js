const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const OrderStatus = require("../models/orderStatus.model");
const authMiddleware = require("../middlewares/auth.middleware"); // JWT middleware

//create order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { school_id, trustee_id, student_info, custom_order_id, order_amount, gateway_name } = req.body;

    if (!school_id || !trustee_id || !student_info || !custom_order_id || !order_amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create Order
    const order = await Order.create({
      school_id,
      trustee_id,
      student_info,
      custom_order_id,
      gateway_name,
    });

    // create initial orderstatus
    const orderStatus = await OrderStatus.create({
      collect_id: `COLL_${Date.now()}`, // dummy collect_id
      order_id: order._id,
      custom_order_id,
      order_amount,
      transaction_amount: 0,
      status: "pending",
    });

    res.status(201).json({ order, orderStatus });
  } catch (error) {
    console.error("Create order error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// get all transactions
router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const transactions = await OrderStatus.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "order_id",
          foreignField: "_id",
          as: "order_info",
        },
      },
      { $unwind: "$order_info" },
      {
        $project: {
          collect_id: 1,
          custom_order_id: 1,
          order_amount: 1,
          transaction_amount: 1,
          status: 1,
          payment_mode: 1,
          payment_time: 1,
          school_id: "$order_info.school_id",
          student_info: "$order_info.student_info",
          gateway_name: "$order_info.gateway_name",
        },
      },
      { $sort: { payment_time: -1 } },
    ]);

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Fetch transactions error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// get transactions by school
router.get("/transactions/school/:schoolId", authMiddleware, async (req, res) => {
  try {
    const { schoolId } = req.params;

    const transactions = await OrderStatus.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "order_id",
          foreignField: "_id",
          as: "order_info",
        },
      },
      { $unwind: "$order_info" },
      { $match: { "order_info.school_id": mongoose.Types.ObjectId(schoolId) } },
      {
        $project: {
          collect_id: 1,
          custom_order_id: 1,
          order_amount: 1,
          transaction_amount: 1,
          status: 1,
          payment_mode: 1,
          payment_time: 1,
          school_id: "$order_info.school_id",
          student_info: "$order_info.student_info",
          gateway_name: "$order_info.gateway_name",
        },
      },
    ]);

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Get school transactions error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// check transanction status
router.get("/transaction-status/:custom_order_id", authMiddleware, async (req, res) => {
  try {
    const { custom_order_id } = req.params;

    const transaction = await OrderStatus.findOne({ custom_order_id });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    console.error("Transaction status error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// webhook
router.post("/webhook", async (req, res) => {
  try {
    const { status, order_info } = req.body;

    if (!order_info || !order_info.collect_id) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const { collect_id, custom_order_id, transaction_amount, payment_mode, payment_message, payment_time, error_message } = order_info;

    const updatedTransaction = await OrderStatus.findOneAndUpdate(
      { collect_id },
      {
        status: status === 200 ? "success" : "failed",
        transaction_amount,
        payment_mode,
        payment_message,
        payment_time,
        error_message,
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Webhook processed", updatedTransaction });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// create payment
router.post("/create-payment", authMiddleware, async (req, res) => {
  try {
    const { order_id, amount } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({ message: "order_id and amount required" });
    }

    // Generate JWT payload for payment API
    const payload = jwt.sign(
      { order_id, amount, school_id: "65b0e6293e9f76a9694d84b4" },
      process.env.PG_API_SECRET || "testsecret",
      { expiresIn: "5m" }
    );

    const paymentPageURL = `https://payment-gateway.com/pay?token=${payload}`;
    res.status(200).json({ paymentPageURL, message: "Redirect to payment page" });
  } catch (error) {
    console.error("Create payment error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

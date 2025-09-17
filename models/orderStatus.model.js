const mongoose = require("mongoose");

const orderStatusSchema = new mongoose.Schema(
  {
    collect_id: { type: String, required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    custom_order_id: { type: String, required: true },
    order_amount: { type: Number, required: true },
    transaction_amount: { type: Number, required: true },
    payment_mode: { type: String },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    payment_time: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderStatus", orderStatusSchema);


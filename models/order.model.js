const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    school_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    trustee_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    student_info: {
      name: { type: String, required: true },
      id: { type: String, required: true },
      email: { type: String, required: true },
    },
    gateway_name: { type: String, default: "PhonePe" },
    custom_order_id: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

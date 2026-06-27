const mongoose = require("mongoose");

const adminProductSaleSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    orderObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      default: null,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    qty: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    customerName: {
      type: String,
      default: "",
      trim: true,
    },
    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },
    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    paymentStatus: {
      type: String,
      default: "paid",
      trim: true,
    },
    paymentReference: {
      type: String,
      default: "",
      trim: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

adminProductSaleSchema.index({ productId: 1, createdAt: -1 });
adminProductSaleSchema.index({ orderId: 1 });

module.exports = mongoose.model("AdminProductSale", adminProductSaleSchema);

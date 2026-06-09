const mongoose = require("mongoose");

const referralPurchaseSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    orderObjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      default: null,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReferralAssignment",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    externalVendorId: {
      type: String,
      trim: true,
      default: "",
    },
    assignedProductId: {
      type: String,
      required: true,
      trim: true,
    },
    shareCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    refCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
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
    qty: {
      type: Number,
      default: 1,
      min: 1,
    },
    orderAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    commissionValue: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
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
    source: {
      type: String,
      default: "mwellness",
      trim: true,
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

referralPurchaseSchema.index({ vendorId: 1, createdAt: -1 });
referralPurchaseSchema.index({ externalVendorId: 1, createdAt: -1 });
referralPurchaseSchema.index({ shareCode: 1 });

module.exports = mongoose.model("ReferralPurchase", referralPurchaseSchema);

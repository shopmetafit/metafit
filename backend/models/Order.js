const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    size: String,
    color: String,
    quantity: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the "User" model
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    deliveryCharge: {
      type: Number,
      default: 100,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      default: "Pending",
    },
    status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
    // Blue Dart Shipping
    courier: {
      type: String,
      default: "bluedart",
    },
    awbNo: {
      type: String,
      default: null,
    },
    trackingId: {
      type: String,
      default: null,
    },
    shippingStatus: {
      type: String,
      default: "Pending", // Pending, In-Transit, Delivered, Failed
    },
    shippingError: {
      type: String,
      default: null, // Error message if shipping fails
    },
    bluedartGeneratedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Method to calculate delivery charge based on city
orderSchema.methods.calculateDeliveryCharge = function () {
  const city = this.shippingAddress?.city?.toLowerCase();
  return city === "udaipur" ? 60 : 100;
};

// Pre-save hook to auto-calculate delivery charge
orderSchema.pre("save", function (next) {
  if (!this.deliveryCharge) {
    this.deliveryCharge = this.calculateDeliveryCharge();
  }
  next();
});

module.exports = mongoose.model("order", orderSchema);

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
    orderNumber: {
      type: String,
      unique: true,
      default: () => {
        const d = new Date();
        const dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const randomStr = Math.floor(100000 + Math.random() * 900000).toString();
        return `ORD-${dateStr}-${randomStr}`;
      },
    },
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
    checkoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Checkout",
      default: null,
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
    totalPrice: {
      type: Number,
      required: true,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
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
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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
    referral: {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },
      vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        default: null,
      },
      externalVendorId: {
        type: String,
        default: "",
        trim: true,
      },
      assignedProductId: {
        type: String,
        default: "",
        trim: true,
      },
      shareCode: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },
    },
  },
  {
    timestamps: true,
  }
);



module.exports = mongoose.model("order", orderSchema);

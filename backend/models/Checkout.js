const mongoose = require("mongoose");

const checkoutItemSchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
    },
    size:String,
    color:String,
  },
  { _id: false }
);

const checkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the "User" model
      required: true,
    },
    checkoutItems: [checkoutItemSchema],
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
    paymentStatus: {
      type: String,
      //   enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed, // Can hold an object with transactionId, payer info, etc.
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    finalizedAt: {
      type: Date,
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



module.exports = mongoose.model("Checkout", checkoutSchema);

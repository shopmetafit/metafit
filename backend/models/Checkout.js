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
    totalPrice: {
      type: Number,
      required: true,
    },
    deliveryCharge: {
      type: Number,
      default: 30,
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
  },
  {
    timestamps: true,
  }
);

// Method to calculate delivery charge based on city
checkoutSchema.methods.calculateDeliveryCharge = function () {
  return 30; // Fixed shipping charge for all cities
};

// Pre-save hook to auto-calculate delivery charge
checkoutSchema.pre("save", function (next) {
  if (!this.deliveryCharge) {
    this.deliveryCharge = this.calculateDeliveryCharge();
  }
  next();
});

module.exports = mongoose.model("Checkout", checkoutSchema);

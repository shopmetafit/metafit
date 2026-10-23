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

const pickupAddressSnapshotSchema = new mongoose.Schema(
  {
    vendorName: { type: String, default: "" },
    businessName: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    street: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const vendorFulfillmentItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    name: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    size: String,
    color: String,
    image: String,
  },
  { _id: false }
);

const vendorFulfillmentStatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: String, default: "Vendor" },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const vendorFulfillmentSchema = new mongoose.Schema(
  {
    fulfillmentId: {
      type: String,
      default: null,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    vendorName: {
      type: String,
      default: "",
      trim: true,
    },
    items: [vendorFulfillmentItemSchema],
    status: {
      type: String,
      enum: [
        "Processing",
        "Will be Out for Delivery in 1–2 Days",
        "Will be Out for Delivery in 1-2 Days",
        "Out for Delivery",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Processing",
    },
    statusHistory: [vendorFulfillmentStatusHistorySchema],
    courier: {
      type: String,
      default: "standard",
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
      default: "Pending", // Pending, In-Transit, Delivered, Failed, Cancelled
    },
    shippingError: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    pickupAddressSnapshot: {
      type: pickupAddressSnapshotSchema,
      default: null,
    },
    bluedartGeneratedAt: {
      type: Date,
      default: null,
    },
    dispatchedAt: {
      type: Date,
    },
    willBeOutForDeliveryAt: {
      type: Date,
    },
    outForDeliveryAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
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
        return `MWB-${dateStr}-${randomStr}`;
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the "User" model
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      house: { type: String, default: "" },
      area: { type: String, default: "" },
      landmark: { type: String, default: "" },
      address: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      addressType: { type: String, default: "Home" },
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
    serviceFee: {
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
      enum: [
        "Processing",
        "Will be Out for Delivery in 1–2 Days",
        "Will be Out for Delivery in 1-2 Days",
        "Out for Delivery",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Processing",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: String, default: "Vendor" },
        note: { type: String, default: "" },
      },
    ],
    willBeOutForDeliveryAt: {
      type: Date,
    },
    outForDeliveryAt: {
      type: Date,
    },
    // Standard Shipping
    courier: {
      type: String,
      default: "standard",
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
    vendorFulfillments: {
      type: [vendorFulfillmentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);



const OrderModel = mongoose.model("order", orderSchema);
if (!mongoose.models.Order) {
  try {
    mongoose.model("Order", orderSchema);
  } catch (e) {
    // ignore
  }
}

module.exports = OrderModel;

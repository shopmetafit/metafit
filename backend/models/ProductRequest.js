const mongoose = require("mongoose");

const productRequestSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    vendorEmail: {
      type: String,
      required: true,
    },
    vendorPhone: {
      type: String,
      required: true,
    },
    
    // Product Details
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    countInStock: { type: Number, required: true, default: 0 },
    sku: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    collection: { type: String, required: true },
    material: { type: String },
    videoUrl: { type: String },
    gender: { type: String, enum: ["Men", "Women", "Unisex"] },
    
    // Images
    images: [
      {
        _id: false,
        url: {
          type: String,
          required: true,
        },
        altText: { type: String },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    extraImages: [
      { _id: false, url: { type: String }, altText: { type: String } },
    ],

    // Product Variants
    variants: [
      {
        _id: false,
        label: { type: String, required: true }, // e.g., "1 kg (Pack of 1)"
        weight: { type: Number }, // weight in kg
        quantity: { type: Number }, // pack size
        price: { type: Number, required: true },
        discountPrice: { type: Number },
        stock: { type: Number, default: 0 },
        sku: { type: String },
        pricePerUnit: { type: String }, // e.g., "₹238.00 / kg"
      },
    ],
    hasVariants: { type: Boolean, default: false },

    // Product Details
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    weight: Number,
    tags: [String],

    // Request Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    
    // Admin Actions
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },

    // Product Creation
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    // Meta Information
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    metaKeywords: {
      type: String,
    },

    // Featured and Published
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
    },

    // Ratings and Reviews
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductRequest", productRequestSchema);
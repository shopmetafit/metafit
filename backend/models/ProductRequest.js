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
      default: "",
    },
    vendorPhone: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "create",
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    
    // Product Details
    name: { type: String, required: true, trim: true },
    description: {
      type: String,
      required: function () {
        return !(this.payload && this.payload.description);
      },
    },
    price: {
      type: Number,
      required: function () {
        return !(this.payload && (this.payload.price !== undefined && this.payload.price !== null));
      },
    },
    discountPrice: { type: Number },
    shippingCharge: { type: Number, default: 0 },
    localShippingCharge: { type: Number, default: 0 },
    freeShippingCities: { type: [String], default: [] },
    countInStock: { type: Number, default: 0 },
    sku: {
      type: String,
      required: function () {
        if (this.payload && (this.payload.sku || this.payload.productSku || this.payload.SKU)) return false;
        return this.status === "approved" || this.isNew;
      },
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: function () {
        return !(this.payload && this.payload.category);
      },
    },
    brand: {
      type: String,
      required: function () {
        return !(this.payload && this.payload.brand);
      },
    },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    collection: {
      type: String,
      required: function () {
        return !(this.payload && (this.payload.collection || this.payload.category));
      },
    },
    material: { type: String },
    location: { type: String, trim: true },
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
    platformCommission: {
      type: Number,
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
  { timestamps: true, suppressReservedKeysWarning: true, strict: false }
);

module.exports = mongoose.models.ProductRequest || mongoose.model("ProductRequest", productRequestSchema);
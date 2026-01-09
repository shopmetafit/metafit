const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    countInStock: { type: Number, required: true, default: 0 },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    collection: { type: String, required: true },
    material: { type: String },
    videoUrl: { type: String },
    gender: { type: String, enum: ["Men", "Women", "Unisex"] },
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
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    tags: [String],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metaTile: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    metaKeywords: {
      type: String,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    weight: Number,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

// ll
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    shippingCharge: { type: Number, default: 0 },
    localShippingCharge: { type: Number, default: 0 },
    freeShippingCities: { type: [String], default: [] },
    countInStock: { type: Number, required: true, default: 0 },
    sku: { type: String, required: true, unique: true, index: true, trim: true },
    slug: { type: String, index: true, lowercase: true, trim: true },
    searchName: { type: String, index: true, lowercase: true, trim: true },
    thumbnail: { type: String },
    category: { type: String, required: true },
    subCategory: { type: String, trim: true },
    wellnessGoal: { type: [String], default: [] },
    brand: { type: String, required: true },
    warranty: { type: String },
    certifications: { type: String },
    countryOfOrigin: { type: String },
    manufacturer: { type: String },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    collection: { type: String, required: true },
    material: { type: String },
    location: { type: String, trim: true },
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
        color: { type: String },
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
    priority: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    isAssignedToAll: {
      type: Boolean,
      default: false,
    },
    platformCommission: {
      type: Number,
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
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Populated for vendor products, null for admin-created products
    },
    createdBy: {
      type: String,
      enum: ["ADMIN", "VENDOR"],
      default: "ADMIN",
    },
    productApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Admin user who approved the product
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    metaTitle: {
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
        label: { type: String }, // e.g., "1 kg (Pack of 1)"
        weight: { type: Number }, // weight in kg
        quantity: { type: Number }, // pack size
        price: { type: Number },
        discountPrice: { type: Number },
        stock: { type: Number, default: 0 },
        sku: { type: String },
        pricePerUnit: { type: String }, // e.g., "₹238.00 / kg"
      },
    ],
    hasVariants: { type: Boolean, default: false },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

// Helper for generating collision-free unique slugs
async function generateUniqueSlug(ProductModel, name, docId) {
  let baseSlug = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  if (!baseSlug) baseSlug = "product";

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await ProductModel.findOne({ slug, _id: { $ne: docId } }).lean();
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// Pre-save middleware for new products and document updates
productSchema.pre("save", async function (next) {
  if (this.name) {
    this.searchName = String(this.name).toLowerCase().trim().replace(/\s+/g, " ");
    if (!this.slug || this.isModified("name")) {
      this.slug = await generateUniqueSlug(this.constructor, this.name, this._id);
    }
  }
  next();
});

// Pre-findOneAndUpdate middleware to automatically update searchName and unique slug on edits
productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const fields = update.$set || update;
  if (fields.name) {
    fields.searchName = String(fields.name).toLowerCase().trim().replace(/\s+/g, " ");
    const filter = this.getFilter();
    const doc = await this.model.findOne(filter).lean();
    const docId = doc ? doc._id : null;
    fields.slug = await generateUniqueSlug(this.model, fields.name, docId);
  }
  next();
});

// Database Indexes for High Performance Search & Filtering (Items #2 & #7)
productSchema.index({ priority: -1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ vendorId: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ isPublished: 1, priority: -1 });
productSchema.index({ isPublished: 1, category: 1, priority: -1 });
productSchema.index({ isPublished: 1, name: 1 });
productSchema.index({ isPublished: 1, wellnessGoal: 1 });

productSchema.index(
  {
    name: "text",
    category: "text",
    subCategory: "text",
    brand: "text",
    wellnessGoal: "text",
  },
  {
    weights: {
      name: 20, // Item #7: Increased name weight to 20
      category: 5,
      subCategory: 3,
      brand: 3,
      wellnessGoal: 2,
    },
    name: "ProductSearchTextIndex",
  }
);

module.exports = mongoose.model("Product", productSchema);
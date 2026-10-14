const express = require("express");
const Product = require("../models/Product");
const ProductRequest = require("../models/ProductRequest");
const { protect, admin } = require("../middleware/authMiddleware");
const { getProductReadModel } = require("../utils/productDataAccess");
const {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getVendorProductsAdmin,
  bulkApproveProducts,
  getApprovalStats,
} = require("../controllers/productApprovalController");

const router = express.Router();

//@ GET / api/admin/products
//desc get all products (Admin only)
// access private/Admin
router.get("/", protect, admin, async (req, res) => {
  try {
    const ProductReadModel = await getProductReadModel();
    const products = await ProductReadModel.find({}).lean();
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function generateUniqueSku(name) {
  const cleanName = String(name || "").trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const prefix = cleanName.length >= 2 ? cleanName.substring(0, 4) : "MWB";

  for (let attempt = 0; attempt < 10; attempt++) {
    const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const candidateSku = `MWB-${prefix}-${randomCode}`;

    const existingProduct = await Product.findOne({
      sku: { $regex: new RegExp(`^${escapeRegex(candidateSku)}$`, "i") },
    }).select("_id").lean();

    if (!existingProduct) {
      return candidateSku;
    }
  }

  return `MWB-${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

// to create a new product
router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      shippingCharge,
      localShippingCharge,
      freeShippingCities,
      countInStock,
      sku,
      category,
      brand,
      sizes,
      colors,
      collection,
      location,
      gender,
      images,
      extraImages,
      videoUrl,
      hasVariants,
      variants,
      isBestSeller,
    } = req.body;

    let finalSku = sku && String(sku).trim() ? String(sku).trim() : "";
    if (!finalSku) {
      finalSku = await generateUniqueSku(name);
    } else {
      const existingProduct = await Product.findOne({
        sku: { $regex: new RegExp(`^${escapeRegex(finalSku)}$`, "i") },
      });
      if (existingProduct) {
        return res.status(400).json({
          message: `SKU '${finalSku}' already exists. Please choose a unique SKU or leave blank to auto-generate.`,
          code: "DUPLICATE_SKU",
        });
      }
    }

    const newProducts = await Product.create({
      name,
      description,
      price,
      discountPrice,
      shippingCharge: shippingCharge || 0,
      localShippingCharge: localShippingCharge || 0,
      freeShippingCities: freeShippingCities || [],
      countInStock,
      sku: finalSku,
      category,
      brand,
      sizes,
      colors,
      collection: collection || category || "General",
      location,
      gender,
      images,
      extraImages,
      videoUrl,
      hasVariants: hasVariants || false,
      variants: variants || [],
      isBestSeller: Boolean(isBestSeller),
      user: req.user._id,
    });

    res.status(201).json(newProducts);
  } catch (error) {
    console.error("Error creating product", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "SKU";
      return res.status(400).json({ message: `A product with this ${field} already exists.` });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || "Server error" });
  }
});

// ========================
// Product Approval Routes
// ========================

// Get pending products
router.get("/pending", protect, admin, getPendingProducts);

// Get approval stats
router.get("/approval/stats", protect, admin, getApprovalStats);

// Get vendor's products (admin view)
router.get("/vendor/:vendorId/products", protect, admin, getVendorProductsAdmin);

// Bulk approve products
router.put("/bulk/approve", protect, admin, bulkApproveProducts);

// Approve single product
router.put("/:id/approve", protect, admin, approveProduct);

// Reject single product
router.put("/:id/reject", protect, admin, rejectProduct);

// Get single product details (Admin view / Partner Dashboard modal)
router.get("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("vendorId", "businessName vendorName email phone")
      .populate("user", "name email");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const doc = product.toObject ? product.toObject() : product;
    res.json({
      product: doc,
      ...doc,
    });
  } catch (error) {
    console.error("Error fetching admin product by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Toggle product publish status (Partner Dashboard quick action)
router.patch("/:id/toggle-status", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.body && req.body.isPublished !== undefined) {
      product.isPublished = Boolean(req.body.isPublished);
    } else {
      product.isPublished = !product.isPublished;
    }

    // Safeguard schema required fields
    if (!product.collection) {
      product.collection = product.category || "General";
    }
    if (!product.user) {
      product.user = product.vendorUserId || product.vendorId?._id || product.vendorId || req.user._id;
    }

    const updated = await product.save();
    res.json({
      message: "Product status toggled successfully",
      isPublished: updated.isPublished,
      product: updated,
    });
  } catch (error) {
    console.error("Error toggling product status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Cancel update request for a product
router.post("/:id/cancel-update-request", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await ProductRequest.updateMany(
      { productId: product._id, status: "pending" },
      { $set: { status: "cancelled", rejectionReason: "Cancelled by admin" } }
    );

    res.json({
      message: "Update request cancelled successfully",
      product,
    });
  } catch (error) {
    console.error("Error cancelling update request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// to update an existing product (or approve/reject via status payload)
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const requestedApprovalStatus = req.body && (req.body.productApprovalStatus || req.body.status);
    const isApprovalAction =
      requestedApprovalStatus === "approved" &&
      (product.productApprovalStatus !== "approved" || (!req.body.name && !req.body.description));
    const isRejectionAction =
      requestedApprovalStatus === "rejected" &&
      (product.productApprovalStatus !== "rejected" || (!req.body.name && !req.body.description));

    if (isApprovalAction) {
      return approveProduct(req, res);
    }

    if (isRejectionAction) {
      return rejectProduct(req, res);
    }

    // Normal product edit
    const {
      name,
      description,
      price,
      discountPrice,
      shippingCharge,
      localShippingCharge,
      freeShippingCities,
      countInStock,
      sku,
      category,
      brand,
      sizes,
      colors,
      collection,
      material,
      location,
      videoUrl,
      gender,
      images,
      extraImages,
      hasVariants,
      variants,
      priority,
      isBestSeller,
      isPublished,
      productApprovalStatus,
    } = req.body;

    // Check SKU if provided
    if (sku !== undefined && sku !== null) {
      const trimmedSku = String(sku).trim();
      if (trimmedSku === "") {
        return res.status(400).json({
          message: "SKU cannot be empty",
          code: "SKU_REQUIRED",
        });
      }
      if (trimmedSku !== product.sku) {
        const duplicateProduct = await Product.findOne({
          sku: trimmedSku,
          _id: { $ne: product._id },
        });
        if (duplicateProduct) {
          return res.status(400).json({
            message: `SKU '${trimmedSku}' already exists in products. Please choose a unique SKU.`,
            code: "DUPLICATE_SKU",
          });
        }
        product.sku = trimmedSku;
      }
    }

    // Update product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price ?? product.price;
    product.discountPrice = discountPrice || product.discountPrice;
    product.shippingCharge = shippingCharge ?? product.shippingCharge;
    product.localShippingCharge = localShippingCharge ?? product.localShippingCharge;
    if (freeShippingCities !== undefined) {
      product.freeShippingCities = freeShippingCities;
    }
    product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.sizes = sizes || product.sizes;
    product.colors = colors || product.colors;
    product.collection = collection || product.collection;
    product.material = material || product.material;
    product.location = location !== undefined ? location : product.location;
    product.videoUrl = videoUrl || product.videoUrl;
    product.gender = gender || product.gender;
    product.images = images || product.images;
    product.extraImages = extraImages || product.extraImages;
    product.hasVariants = hasVariants !== undefined ? hasVariants : product.hasVariants;
    product.variants = variants !== undefined ? variants : product.variants;
    product.priority = priority ?? product.priority;

    if (isBestSeller !== undefined) {
      product.isBestSeller = Boolean(isBestSeller);
    }
    if (isPublished !== undefined) {
      product.isPublished = Boolean(isPublished);
    }
    if (productApprovalStatus !== undefined) {
      product.productApprovalStatus = productApprovalStatus;
    }

    // Safeguard schema required fields
    if (!product.collection) {
      product.collection = product.category || "General";
    }
    if (!product.user) {
      product.user = product.vendorUserId || product.vendorId?._id || product.vendorId || req.user._id;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating admin product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// delete admin product
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

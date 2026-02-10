const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
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
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// to create a new product
router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      countInStock,
      sku,
      category,
      brand,
      sizes,
      colors,
      collection,
      gender,
      images,
      extraImages,
      videoUrl,
      hasVariants,
      variants
    } = req.body;
    const newProducts = await Product.create({
      name,
      description,
      price,
      discountPrice,
      countInStock,
      sku,
      category,
      brand,
      sizes,
      colors,
      collection,
      gender,
      images,
      extraImages,
      videoUrl,
      hasVariants: hasVariants || false,
      variants: variants || [],
      user: req.user._id,
    });

    res.status(201).json(newProducts);
  } catch (error) {
    console.error("Error creating product", error);
    res.status(500).json({ message: "Server error" });
  }
});

// to update an existing product
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      countInStock,
      sku,
      category,
      brand,
      sizes,
      colors,
      collection,
      material,
      videoUrl,
      gender,
      images,
      extraImages,
      hasVariants,
      variants,
      priority,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      // update product fields
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price ?? product.price;
      product.discountPrice = discountPrice || product.discountPrice;
      product.countInStock = countInStock || product.countInStock;
      product.category = category || product.category;
      product.brand = brand || product.brand;
      product.sizes = sizes || product.sizes;
      product.colors = colors || product.colors;
      product.collection = collection || product.collection;
      product.material = material || product.material;
      product.videoUrl = videoUrl || product.videoUrl;
      product.gender = gender || product.gender;
      product.images = images || product.images;
      product.extraImages = extraImages || product.extraImages;
      product.sku = sku || product.sku;
      product.hasVariants = hasVariants !== undefined ? hasVariants : product.hasVariants;
      product.variants = variants !== undefined ? variants : product.variants;

      product.priority = priority ?? product.priority; // <-- update priority here

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

// delete admin product

router.delete("/:id", protect, admin, async (req, res) => {
  try {
    // Find the product by ID
    const product = await Product.findById(req.params.id);
    if (product) {
      // Remove the product from DB
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
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

// Approve single product
router.put("/:id/approve", protect, admin, approveProduct);

// Reject single product
router.put("/:id/reject", protect, admin, rejectProduct);

// Bulk approve products
router.put("/bulk/approve", protect, admin, bulkApproveProducts);

module.exports = router;

const Product = require("../models/Product");
const ProductRequest = require("../models/ProductRequest");
const { sellerTransporter } = require("../utils/email");
const { generateVendorApprovalEmail } = require("../utils/emailTemplate");

// @desc    Get all pending/unapproved products (admin only)
// @route   GET /api/admin/products/pending
// @access  Private (admin)
const getPendingProducts = async (req, res) => {
  try {
    const { status } = req.query; // Filter: pending, approved, rejected

    let query = {};
    if (status) {
      query.productApprovalStatus = status;
    } else {
      query.productApprovalStatus = "pending"; // Default to pending
    }

    const products = await Product.find(query)
      .populate("vendorId", "name email vendorName")
      .populate("user", "name email vendorName")
      .sort({ createdAt: -1 });

    res.json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching pending products:", error);
    res.status(500).json({
      message: "Error fetching pending products",
      error: error.message,
    });
  }
};

// @desc    Approve vendor product (admin only)
// @route   PUT /api/admin/products/:id/approve
// @access  Private (admin)
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('vendorId', 'email vendorName phone');

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Only vendor products need approval (accept VENDOR, vendorId, vendorUserId, or pending status)
    const isVendorProduct =
      (product.createdBy && product.createdBy.toUpperCase() === "VENDOR") ||
      Boolean(product.vendorId) ||
      Boolean(product.vendorUserId) ||
      product.productApprovalStatus === "pending";

    if (!isVendorProduct) {
      return res
        .status(400)
        .json({ message: "Only vendor products need approval" });
    }

    // Determine SKU: prioritize admin-provided SKU in req.body, otherwise use existing product.sku
    const rawProvidedSku = req.body && (
      req.body.sku !== undefined ? req.body.sku : (
        req.body.SKU !== undefined ? req.body.SKU : req.body.productSku
      )
    );
    const providedSku = rawProvidedSku !== undefined
      ? (typeof rawProvidedSku === "string" ? rawProvidedSku.trim() : String(rawProvidedSku).trim())
      : undefined;

    const existingProductSku = product.sku
      ? (typeof product.sku === "string" ? product.sku.trim() : String(product.sku).trim())
      : "";

    const effectiveSku = providedSku !== undefined && providedSku !== "" ? providedSku : existingProductSku;

    if (!effectiveSku) {
      return res.status(400).json({
        message: "SKU is required to approve this product. Please provide a valid SKU.",
        code: "SKU_REQUIRED",
        productId: product._id,
      });
    }

    // Check duplicate SKU in products
    const duplicateProduct = await Product.findOne({
      sku: effectiveSku,
      _id: { $ne: product._id },
    });
    if (duplicateProduct) {
      return res.status(400).json({
        message: `SKU '${effectiveSku}' already exists in products. Please choose a unique SKU.`,
        code: "DUPLICATE_SKU",
      });
    }

    product.sku = effectiveSku;
    product.productApprovalStatus = "approved";
    product.approvedBy = req.user ? req.user._id : undefined; // Admin user
    product.approvedAt = new Date();
    product.isPublished = req.body && req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true;

    // Safeguard schema required fields for legacy vendor products
    if (!product.collection) {
      product.collection = product.category || "General";
    }
    if (!product.user) {
      product.user = product.vendorUserId || product.vendorId?._id || product.vendorId || (req.user ? req.user._id : undefined);
    }

    await product.save();

    // Sync any pending ProductRequest records matching productId: product._id
    try {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(product._id)) {
        await ProductRequest.updateMany(
          { productId: product._id, status: "pending" },
          {
            $set: {
              status: "approved",
              approvedBy: req.user ? req.user._id : undefined,
              approvedAt: new Date(),
              isPublished: true,
              sku: effectiveSku,
            },
          }
        );
      }
    } catch (syncErr) {
      console.warn("Failed to sync ProductRequest status during product approval:", syncErr.message);
    }

    // Send vendor approval email notification
    try {
      const vendorEmailHtml = generateVendorApprovalEmail(
        (product.vendorId && product.vendorId.vendorName) || "Vendor",
        (product.vendorId && product.vendorId.businessName) || "Your Company"
      );

      const vendorMailOptions = {
        from: process.env.SELLER_EMAIL,
        to: (product.vendorId && product.vendorId.email) || product.email,
        subject: "Product Approved - MetaFit Vendor Portal",
        html: vendorEmailHtml
      };

      await sellerTransporter.sendMail(vendorMailOptions);
      console.log("✓ Vendor approval email sent successfully");
    } catch (emailErr) {
      console.error("✗ Failed to send vendor approval email:", emailErr.message);
      // Don't throw - continue processing even if email fails
    }

    const productDoc = product.toObject ? product.toObject() : product;
    res.json({
      message: "Product approved successfully",
      product,
      ...productDoc,
    });
  } catch (error) {
    console.error("Error approving product:", error);
    res.status(500).json({
      message: "Error approving product",
      error: error.message,
    });
  }
};

// @desc    Reject vendor product (admin only)
// @route   PUT /api/admin/products/:id/reject
// @access  Private (admin)
const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, reason } = req.body || {};
    const effectiveReason = rejectionReason || reason || "Rejected by administrator";

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const isVendorProduct =
      (product.createdBy && product.createdBy.toUpperCase() === "VENDOR") ||
      Boolean(product.vendorId) ||
      Boolean(product.vendorUserId) ||
      product.productApprovalStatus === "pending";

    if (!isVendorProduct) {
      return res
        .status(400)
        .json({ message: "Only vendor products can be rejected" });
    }

    product.productApprovalStatus = "rejected";
    product.rejectionReason = effectiveReason;
    product.isPublished = false; // Hide from customers

    // Safeguard schema required fields for legacy vendor products
    if (!product.collection) {
      product.collection = product.category || "General";
    }
    if (!product.user) {
      product.user = product.vendorUserId || product.vendorId?._id || product.vendorId || (req.user ? req.user._id : undefined);
    }

    await product.save();

    // Sync any pending ProductRequest records matching productId: product._id
    try {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(product._id)) {
        await ProductRequest.updateMany(
          { productId: product._id, status: "pending" },
          {
            $set: {
              status: "rejected",
              rejectedBy: req.user ? req.user._id : undefined,
              rejectedAt: new Date(),
              rejectionReason: effectiveReason,
              isPublished: false,
            },
          }
        );
      }
    } catch (syncErr) {
      console.warn("Failed to sync ProductRequest status during product rejection:", syncErr.message);
    }

    const productDoc = product.toObject ? product.toObject() : product;
    res.json({
      message: "Product rejected",
      product,
      ...productDoc,
    });
  } catch (error) {
    console.error("Error rejecting product:", error);
    res.status(500).json({
      message: "Error rejecting product",
      error: error.message,
    });
  }
};

// @desc    Get products by vendor (for reporting/analytics)
// @route   GET /api/admin/vendors/:vendorId/products
// @access  Private (admin)
const getVendorProductsAdmin = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { status } = req.query;

    let query = { vendorId };
    if (status) {
      query.productApprovalStatus = status;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    const stats = {
      total: products.length,
      approved: products.filter(
        (p) => p.productApprovalStatus === "approved"
      ).length,
      pending: products.filter(
        (p) => p.productApprovalStatus === "pending"
      ).length,
      rejected: products.filter(
        (p) => p.productApprovalStatus === "rejected"
      ).length,
      products,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    res.status(500).json({
      message: "Error fetching vendor products",
      error: error.message,
    });
  }
};

// @desc    Bulk approve products
// @route   PUT /api/admin/products/bulk/approve
// @access  Private (admin)
const bulkApproveProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid product IDs array" });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds }, createdBy: "VENDOR" },
      {
        productApprovalStatus: "approved",
        approvedBy: req.user._id,
        approvedAt: new Date(),
        isPublished: true,
      }
    );

    res.json({
      message: `${result.modifiedCount} products approved`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error bulk approving products:", error);
    res.status(500).json({
      message: "Error bulk approving products",
      error: error.message,
    });
  }
};

// @desc    Get product approval stats
// @route   GET /api/admin/products/approval/stats
// @access  Private (admin)
const getApprovalStats = async (req, res) => {
  try {
    const stats = {
      totalVendorProducts: await Product.countDocuments({
        createdBy: "VENDOR",
      }),
      pendingApproval: await Product.countDocuments({
        productApprovalStatus: "pending",
      }),
      approvedProducts: await Product.countDocuments({
        productApprovalStatus: "approved",
      }),
      rejectedProducts: await Product.countDocuments({
        productApprovalStatus: "rejected",
      }),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching approval stats:", error);
    res.status(500).json({
      message: "Error fetching approval stats",
      error: error.message,
    });
  }
};

module.exports = {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getVendorProductsAdmin,
  bulkApproveProducts,
  getApprovalStats,
};

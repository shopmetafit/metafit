const Product = require("../models/Product");
const Vendor = require("../models/Vendor");

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

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Only vendor products need approval
    if (product.createdBy !== "VENDOR") {
      return res
        .status(400)
        .json({ message: "Only vendor products need approval" });
    }

    product.productApprovalStatus = "approved";
    product.approvedBy = req.user._id; // Admin user
    product.approvedAt = new Date();
    product.isPublished = true; // Make visible to customers

    await product.save();

    res.json({
      message: "Product approved successfully",
      product,
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
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res
        .status(400)
        .json({ message: "Rejection reason is required" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.createdBy !== "VENDOR") {
      return res
        .status(400)
        .json({ message: "Only vendor products can be rejected" });
    }

    product.productApprovalStatus = "rejected";
    product.rejectionReason = rejectionReason;
    product.isPublished = false; // Hide from customers

    await product.save();

    res.json({
      message: "Product rejected",
      product,
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

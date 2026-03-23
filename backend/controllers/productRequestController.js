const ProductRequest = require("../models/ProductRequest");
const Product = require("../models/Product");
const User = require("../models/User");

// @desc    Create a new product request (vendor only)
// @route   POST /api/vendor/product-requests
// @access  Private (vendor)
const createProductRequest = async (req, res) => {
  try {
    // Check if user is a vendor (handled by middleware, but double-checking)
    if (!req.user || req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor account required." });
    }

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
      variants,
      hasVariants,
      dimensions,
      weight,
      tags,
      metaTitle,
      metaDescription,
      metaKeywords,
      isFeatured,
      priority,
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !countInStock || !sku || !category || !brand || !collection) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    // Check if SKU already exists in product requests
    const existingRequest = await ProductRequest.findOne({ sku });
    if (existingRequest) {
      return res.status(400).json({ message: "SKU already exists in product requests" });
    }

    // Check if SKU already exists in products
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ message: "SKU already exists in products" });
    }

    const productRequest = new ProductRequest({
      vendorId: req.user._id,
      vendorName: req.user.vendorName || req.user.name,
      vendorEmail: req.user.email,
      vendorPhone: req.user.phone,
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      countInStock: Number(countInStock),
      sku,
      category,
      brand,
      sizes: sizes || [],
      colors: colors || [],
      collection,
      material,
      videoUrl,
      gender: gender || "Unisex",
      images: images || [],
      extraImages: extraImages || [],
      variants: hasVariants && variants ? variants : [],
      hasVariants: hasVariants || false,
      dimensions,
      weight,
      tags: tags || [],
      metaTitle,
      metaDescription,
      metaKeywords,
      isFeatured: isFeatured !== false,
      priority: priority || 0,
    });

    const createdRequest = await productRequest.save();
    res.status(201).json({
      message: "Product request created successfully",
      request: createdRequest,
    });
  } catch (error) {
    console.error("Error creating product request:", error);
    res.status(500).json({
      message: "Error creating product request",
      error: error.message,
    });
  }
};

// @desc    Get all product requests for a vendor
// @route   GET /api/vendor/product-requests
// @access  Private (vendor)
const getVendorProductRequests = async (req, res) => {
  try {
    // Check if user is a vendor (handled by middleware, but double-checking)
    if (!req.user || req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor account required." });
    }

    const requests = await ProductRequest.find({ vendorId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching vendor product requests:", error);
    res.status(500).json({
      message: "Error fetching product requests",
      error: error.message,
    });
  }
};

// @desc    Get a single product request by ID
// @route   GET /api/vendor/product-requests/:id
// @access  Private (vendor)
const getProductRequestById = async (req, res) => {
  try {
    // Check if user is a vendor (handled by middleware, but double-checking)
    if (!req.user || req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor account required." });
    }

    const request = await ProductRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    if (request.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. Not your product request." });
    }

    res.json(request);
  } catch (error) {
    console.error("Error fetching product request:", error);
    res.status(500).json({
      message: "Error fetching product request",
      error: error.message,
    });
  }
};

// @desc    Update a product request (vendor only)
// @route   PUT /api/vendor/product-requests/:id
// @access  Private (vendor)
const updateProductRequest = async (req, res) => {
  try {
    // Check if user is a vendor (handled by middleware, but double-checking)
    if (!req.user || req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor account required." });
    }

    const request = await ProductRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    if (request.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. Not your product request." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Cannot update request that is not pending" });
    }

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
      variants,
      hasVariants,
      dimensions,
      weight,
      tags,
      metaTitle,
      metaDescription,
      metaKeywords,
      isFeatured,
      priority,
    } = req.body;

    // Update fields
    request.name = name || request.name;
    request.description = description || request.description;
    request.price = price ? Number(price) : request.price;
    request.discountPrice = discountPrice ? Number(discountPrice) : request.discountPrice;
    request.countInStock = countInStock ? Number(countInStock) : request.countInStock;
    request.sku = sku || request.sku;
    request.category = category || request.category;
    request.brand = brand || request.brand;
    request.sizes = sizes || request.sizes;
    request.colors = colors || request.colors;
    request.collection = collection || request.collection;
    request.material = material || request.material;
    request.videoUrl = videoUrl || request.videoUrl;
    request.gender = gender || request.gender;
    request.images = images || request.images;
    request.extraImages = extraImages || request.extraImages;
    request.variants = hasVariants && variants ? variants : request.variants;
    request.hasVariants = hasVariants !== undefined ? hasVariants : request.hasVariants;
    request.dimensions = dimensions || request.dimensions;
    request.weight = weight || request.weight;
    request.tags = tags || request.tags;
    request.metaTitle = metaTitle || request.metaTitle;
    request.metaDescription = metaDescription || request.metaDescription;
    request.metaKeywords = metaKeywords || request.metaKeywords;
    request.isFeatured = isFeatured !== undefined ? isFeatured : request.isFeatured;
    request.priority = priority || request.priority;

    const updatedRequest = await request.save();
    res.json({
      message: "Product request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating product request:", error);
    res.status(500).json({
      message: "Error updating product request",
      error: error.message,
    });
  }
};

// @desc    Cancel a product request (vendor only)
// @route   PUT /api/vendor/product-requests/:id/cancel
// @access  Private (vendor)
const cancelProductRequest = async (req, res) => {
  try {
    // Check if user is a vendor (handled by middleware, but double-checking)
    if (!req.user || req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor account required." });
    }

    const request = await ProductRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    if (request.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. Not your product request." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Cannot cancel request that is not pending" });
    }

    request.status = "cancelled";
    await request.save();

    res.json({
      message: "Product request cancelled successfully",
      request,
    });
  } catch (error) {
    console.error("Error cancelling product request:", error);
    res.status(500).json({
      message: "Error cancelling product request",
      error: error.message,
    });
  }
};

// @desc    Delete a product request (vendor only)
// @route   DELETE /api/vendor/product-requests/:id
// @access  Private (vendor)
const deleteProductRequest = async (req, res) => {
  try {
    // Check if user is a vendor (handled by middleware, but double-checking)
    if (!req.user || req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendor account required." });
    }

    const request = await ProductRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    if (request.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. Not your product request." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Cannot delete request that is not pending" });
    }

    await request.deleteOne();
    res.json({ message: "Product request deleted successfully" });
  } catch (error) {
    console.error("Error deleting product request:", error);
    res.status(500).json({
      message: "Error deleting product request",
      error: error.message,
    });
  }
};

// Admin Controller Functions

// @desc    Get all product requests (admin only)
// @route   GET /api/admin/product-requests
// @access  Private (admin)
const getAllProductRequests = async (req, res) => {
  try {
    const { status, vendorId } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }
    if (vendorId) {
      query.vendorId = vendorId;
    }

    const requests = await ProductRequest.find(query)
      .populate("vendorId", "businessName vendorName email phone")
      .sort({ createdAt: -1 });

    res.json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Error fetching product requests:", error);
    res.status(500).json({
      message: "Error fetching product requests",
      error: error.message,
    });
  }
};

// @desc    Get a single product request by ID (admin only)
// @route   GET /api/admin/product-requests/:id
// @access  Private (admin)
const getProductRequestByIdAdmin = async (req, res) => {
  try {
    const request = await ProductRequest.findById(req.params.id)
      .populate("vendorId", "businessName vendorName email phone");

    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    res.json(request);
  } catch (error) {
    console.error("Error fetching product request:", error);
    res.status(500).json({
      message: "Error fetching product request",
      error: error.message,
    });
  }
};

// @desc    Approve a product request (admin only)
// @route   PUT /api/admin/product-requests/:id/approve
// @access  Private (admin)
const approveProductRequest = async (req, res) => {
  try {
    const request = await ProductRequest.findById(req.params.id)
      .populate("vendorId", "businessName vendorName email phone");

    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Cannot approve request that is not pending" });
    }

    // Check if SKU already exists in products
    const existingProduct = await Product.findOne({ sku: request.sku });
    if (existingProduct) {
      return res.status(400).json({ message: "SKU already exists in products" });
    }

    // Create the actual product
    const product = new Product({
      name: request.name,
      description: request.description,
      price: request.price,
      discountPrice: request.discountPrice,
      countInStock: request.countInStock,
      sku: request.sku,
      category: request.category,
      brand: request.brand,
      sizes: request.sizes,
      colors: request.colors,
      collection: request.collection,
      material: request.material,
      videoUrl: request.videoUrl,
      gender: request.gender,
      images: request.images,
      extraImages: request.extraImages,
      variants: request.variants,
      hasVariants: request.hasVariants,
      dimensions: request.dimensions,
      weight: request.weight,
      tags: request.tags,
      metaTitle: request.metaTitle,
      metaDescription: request.metaDescription,
      metaKeywords: request.metaKeywords,
      isFeatured: request.isFeatured,
      isPublished: true,
      priority: request.priority,
      rating: 0,
      numReviews: 0,
      user: request.vendorId._id, // Vendor as the user
      vendorId: request.vendorId._id, // Explicit vendor reference
      createdBy: "VENDOR", // Mark as vendor product
      productApprovalStatus: "approved", // Auto-approve since admin approved the request
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    const createdProduct = await product.save();

    // Update the request status
    request.status = "approved";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    request.productId = createdProduct._id;
    request.isPublished = true;

    await request.save();

    res.json({
      message: "Product request approved and product created successfully",
      request,
      product: createdProduct,
    });
  } catch (error) {
    console.error("Error approving product request:", error);
    res.status(500).json({
      message: "Error approving product request",
      error: error.message,
    });
  }
};

// @desc    Reject a product request (admin only)
// @route   PUT /api/admin/product-requests/:id/reject
// @access  Private (admin)
const rejectProductRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const request = await ProductRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Cannot reject request that is not pending" });
    }

    request.status = "rejected";
    request.rejectedBy = req.user._id;
    request.rejectedAt = new Date();
    request.rejectionReason = rejectionReason;
    request.isPublished = false;

    await request.save();

    res.json({
      message: "Product request rejected",
      request,
    });
  } catch (error) {
    console.error("Error rejecting product request:", error);
    res.status(500).json({
      message: "Error rejecting product request",
      error: error.message,
    });
  }
};

// @desc    Get product request stats (admin only)
// @route   GET /api/admin/product-requests/stats
// @access  Private (admin)
const getProductRequestStats = async (req, res) => {
  try {
    const stats = {
      totalRequests: await ProductRequest.countDocuments(),
      pendingRequests: await ProductRequest.countDocuments({ status: "pending" }),
      approvedRequests: await ProductRequest.countDocuments({ status: "approved" }),
      rejectedRequests: await ProductRequest.countDocuments({ status: "rejected" }),
      cancelledRequests: await ProductRequest.countDocuments({ status: "cancelled" }),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching product request stats:", error);
    res.status(500).json({
      message: "Error fetching product request stats",
      error: error.message,
    });
  }
};

module.exports = {
  // Vendor functions
  createProductRequest,
  getVendorProductRequests,
  getProductRequestById,
  updateProductRequest,
  cancelProductRequest,
  deleteProductRequest,
  
  // Admin functions
  getAllProductRequests,
  getProductRequestByIdAdmin,
  approveProductRequest,
  rejectProductRequest,
  getProductRequestStats,
};
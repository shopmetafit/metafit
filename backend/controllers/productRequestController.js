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
      shippingCharge,
      localShippingCharge,
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
      freeShippingCities,
    } = req.body;

    // Normalize SKU
    const rawSku = sku !== undefined && sku !== null ? sku : "";
    const normalizedSku = typeof rawSku === "string" ? rawSku.trim() : String(rawSku).trim();

    // Validate required fields
    if (!name || !description || !price || countInStock === undefined || countInStock === null || !normalizedSku || !category || !brand || !collection) {
      return res.status(400).json({ message: "Please fill in all required fields. SKU is required and cannot be empty." });
    }

    // Check if SKU already exists in product requests
    const existingRequest = await ProductRequest.findOne({ sku: normalizedSku });
    if (existingRequest) {
      return res.status(400).json({ message: "SKU already exists in product requests" });
    }

    // Check if SKU already exists in products
    const existingProduct = await Product.findOne({ sku: normalizedSku });
    if (existingProduct) {
      return res.status(400).json({ message: "SKU already exists in products" });
    }

    const productRequest = new ProductRequest({
      vendorId: req.user._id,
      vendorName: req.user.vendorName || req.user.name,
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      shippingCharge: shippingCharge ? Number(shippingCharge) : 0,
      localShippingCharge: localShippingCharge ? Number(localShippingCharge) : 0,
      countInStock: Number(countInStock),
      sku: normalizedSku,
      category,
      brand,
      sizes: sizes || [],
      colors: colors || [],
      collection,
      material,
      location,
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
      freeShippingCities: freeShippingCities || [],
    });

    const createdRequest = await productRequest.save();
    console.log(`[ProductRequest Create] Created request ID: ${createdRequest._id} with SKU: ${normalizedSku} by vendor: ${req.user._id}`);
    res.status(201).json({
      message: "Product request created successfully",
      request: createdRequest,
    });
  } catch (error) {
    console.error("Error creating product request:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A product request or product with this SKU already exists",
        error: "Duplicate SKU",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
        error: error.message,
      });
    }
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

    res.json({
      request,
      ...(request.toObject ? request.toObject() : request),
    });
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
      shippingCharge,
      localShippingCharge,
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
      freeShippingCities,
    } = req.body;

    // Validate and update SKU if provided
    if (sku !== undefined) {
      const normalizedSku = typeof sku === "string" ? sku.trim() : (sku !== null ? String(sku).trim() : "");
      if (!normalizedSku) {
        return res.status(400).json({ message: "SKU cannot be empty" });
      }

      if (normalizedSku !== request.sku) {
        const existingRequest = await ProductRequest.findOne({
          sku: normalizedSku,
          _id: { $ne: request._id },
        });
        if (existingRequest) {
          return res.status(400).json({ message: "SKU already exists in product requests" });
        }

        const existingProduct = await Product.findOne({ sku: normalizedSku });
        if (existingProduct) {
          return res.status(400).json({ message: "SKU already exists in products" });
        }
      }

      request.sku = normalizedSku;
    } else if (request.sku) {
      request.sku = request.sku.trim();
    }

    // Update fields
    request.name = name || request.name;
    request.description = description || request.description;
    request.price = price ? Number(price) : request.price;
    request.discountPrice = discountPrice ? Number(discountPrice) : request.discountPrice;
    request.shippingCharge = shippingCharge !== undefined ? Number(shippingCharge) : request.shippingCharge;
    request.localShippingCharge = localShippingCharge !== undefined ? Number(localShippingCharge) : request.localShippingCharge;
    if (freeShippingCities !== undefined) request.freeShippingCities = freeShippingCities;
    request.countInStock = countInStock ? Number(countInStock) : request.countInStock;
    request.category = category || request.category;
    request.brand = brand || request.brand;
    request.sizes = sizes || request.sizes;
    request.colors = colors || request.colors;
    request.collection = collection || request.collection;
    request.material = material || request.material;
    request.location = location !== undefined ? location : request.location;
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
    request.freeShippingCities = freeShippingCities || request.freeShippingCities;

    const updatedRequest = await request.save();
    console.log(`[ProductRequest Update] Updated request ID: ${updatedRequest._id} with SKU: ${updatedRequest.sku}`);
    res.json({
      message: "Product request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating product request:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A product request or product with this SKU already exists",
        error: "Duplicate SKU",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
        error: error.message,
      });
    }
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
    const { status, vendorId, productId } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }
    if (vendorId) {
      query.vendorId = vendorId;
    }
    if (productId) {
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(productId)) {
        query.$or = [
          { productId: productId },
          { _id: productId },
        ];
      } else {
        query.productId = productId;
      }
    }

    const requests = await ProductRequest.find(query)
      .populate("vendorId", "businessName vendorName email phone")
      .sort({ createdAt: -1 });

    const normalizedRequests = requests.map((item) => {
      const doc = item.toObject ? item.toObject() : { ...item };
      if (!doc.sku) {
        doc.sku = doc.payload?.sku || doc.productSku || doc.SKU || doc.payload?.productSku || doc.payload?.SKU || doc.sku;
      }
      doc.id = (doc._id || "").toString();
      return doc;
    });

    res.json({
      count: normalizedRequests.length,
      requests: normalizedRequests,
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

    const doc = request.toObject ? request.toObject() : { ...request };
    if (!doc.sku) {
      doc.sku = doc.payload?.sku || doc.productSku || doc.SKU || doc.payload?.productSku || doc.payload?.SKU || doc.sku;
    }

    res.json({
      request: doc,
      ...doc,
    });
  } catch (error) {
    console.error("Error fetching product request:", error);
    res.status(500).json({
      message: "Error fetching product request",
      error: error.message,
    });
  }
};

// @desc    Approve a product request (admin only)
// @route   PUT /api/vendor/product-requests/admin/:id/approve
// @access  Private (admin)
const approveProductRequest = async (req, res) => {
  try {
    let request = await ProductRequest.findById(req.params.id)
      .populate("vendorId", "businessName vendorName email phone");

    // If not found in ProductRequest, check if this ID is a direct Product document
    if (!request) {
      const directProduct = await Product.findById(req.params.id)
        .populate("vendorId", "businessName vendorName email phone");

      if (directProduct) {
        const rawProvidedSku = req.body && (
          req.body.sku !== undefined ? req.body.sku : (
            req.body.SKU !== undefined ? req.body.SKU : req.body.productSku
          )
        );
        const providedSku = rawProvidedSku !== undefined
          ? (typeof rawProvidedSku === "string" ? rawProvidedSku.trim() : String(rawProvidedSku).trim())
          : undefined;

        const prodSku = directProduct.sku
          ? (typeof directProduct.sku === "string" ? directProduct.sku.trim() : String(directProduct.sku).trim())
          : "";

        const effectiveSku = providedSku !== undefined && providedSku !== "" ? providedSku : prodSku;

        if (!effectiveSku) {
          return res.status(400).json({
            message: "SKU is required to approve this product request. Please provide a valid SKU before approval.",
            code: "SKU_REQUIRED",
            productId: directProduct._id,
          });
        }

        const duplicateProduct = await Product.findOne({
          sku: effectiveSku,
          _id: { $ne: directProduct._id },
        });
        if (duplicateProduct) {
          return res.status(400).json({
            message: `SKU '${effectiveSku}' already exists in products. Please choose a unique SKU.`,
            code: "DUPLICATE_SKU",
          });
        }

        directProduct.sku = effectiveSku;
        directProduct.productApprovalStatus = "approved";
        directProduct.approvedBy = req.user._id;
        directProduct.approvedAt = new Date();
        directProduct.isPublished = true;

        if (!directProduct.collection) {
          directProduct.collection = directProduct.category || "General";
        }
        if (!directProduct.user) {
          directProduct.user = directProduct.vendorUserId || directProduct.vendorId?._id || directProduct.vendorId || req.user._id;
        }

        const savedProduct = await directProduct.save();

        return res.json({
          message: "Product request approved and product created successfully",
          request: directProduct,
          product: savedProduct,
        });
      }

      return res.status(404).json({ message: "Product request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Cannot approve request that is not pending" });
    }

    // Determine SKU: prioritize admin-provided SKU in req.body (sku, SKU, productSku), otherwise use request SKU sources
    const rawProvidedSku = req.body && (
      req.body.sku !== undefined ? req.body.sku : (
        req.body.SKU !== undefined ? req.body.SKU : req.body.productSku
      )
    );
    const providedSku = rawProvidedSku !== undefined
      ? (typeof rawProvidedSku === "string" ? rawProvidedSku.trim() : String(rawProvidedSku).trim())
      : undefined;

    const docSkuRaw = request.sku ||
      request.payload?.sku ||
      request.productSku ||
      request.SKU ||
      request.payload?.productSku ||
      request.payload?.SKU ||
      "";
    let requestSku = docSkuRaw
      ? (typeof docSkuRaw === "string" ? docSkuRaw.trim() : String(docSkuRaw).trim())
      : "";

    if (!requestSku && request.productId) {
      const linkedProd = await Product.findById(request.productId);
      if (linkedProd && linkedProd.sku) {
        requestSku = String(linkedProd.sku).trim();
      }
    }

    const effectiveSku = providedSku !== undefined && providedSku !== "" ? providedSku : requestSku;

    // Validate that effective SKU is non-empty
    if (!effectiveSku) {
      console.warn(`[ProductRequest Approval Failed] Request ID ${request._id} has no valid SKU and none was provided`);
      return res.status(400).json({
        message: "SKU is required to approve this product request. Please provide a valid SKU before approval.",
        code: "SKU_REQUIRED",
        requestId: request._id,
      });
    }

    // Check if SKU already exists in other products (excluding request.productId if updating)
    const existingProductQuery = { sku: effectiveSku };
    if (request.productId) {
      existingProductQuery._id = { $ne: request.productId };
    }
    const existingProduct = await Product.findOne(existingProductQuery);
    if (existingProduct) {
      console.warn(`[ProductRequest Approval Failed] SKU '${effectiveSku}' already exists in products (Product ID: ${existingProduct._id})`);
      return res.status(400).json({
        message: `SKU '${effectiveSku}' already exists in products. Please choose a unique SKU.`,
        code: "DUPLICATE_SKU",
      });
    }

    // Check if SKU already exists in other product requests
    const existingRequest = await ProductRequest.findOne({
      sku: effectiveSku,
      _id: { $ne: request._id },
    });
    if (existingRequest) {
      console.warn(`[ProductRequest Approval Failed] SKU '${effectiveSku}' is already used in request ID: ${existingRequest._id}`);
      return res.status(400).json({
        message: `SKU '${effectiveSku}' already exists in another product request`,
        code: "DUPLICATE_SKU",
      });
    }

    console.log(`[ProductRequest Approval] Approving request ID: ${request._id} with SKU: ${effectiveSku}`);

    // Create or update the product (preserving product ID if productId already exists)
    let targetProduct = null;
    if (request.productId) {
      targetProduct = await Product.findById(request.productId);
    }

    if (targetProduct) {
      targetProduct.name = request.name || targetProduct.name;
      targetProduct.description = request.description || targetProduct.description;
      targetProduct.price = request.price ?? targetProduct.price;
      targetProduct.discountPrice = request.discountPrice ?? targetProduct.discountPrice;
      targetProduct.shippingCharge = request.shippingCharge ?? targetProduct.shippingCharge;
      targetProduct.localShippingCharge = request.localShippingCharge ?? targetProduct.localShippingCharge;
      targetProduct.freeShippingCities = request.freeShippingCities || targetProduct.freeShippingCities;
      targetProduct.countInStock = request.countInStock ?? targetProduct.countInStock;
      targetProduct.sku = effectiveSku;
      targetProduct.category = request.category || targetProduct.category;
      targetProduct.brand = request.brand || targetProduct.brand;
      targetProduct.sizes = request.sizes || targetProduct.sizes;
      targetProduct.colors = request.colors || targetProduct.colors;
      targetProduct.collection = request.collection || targetProduct.collection || request.category || "General";
      targetProduct.material = request.material || targetProduct.material;
      targetProduct.location = request.location || targetProduct.location;
      targetProduct.videoUrl = request.videoUrl || targetProduct.videoUrl;
      targetProduct.gender = request.gender || targetProduct.gender;
      if (request.images && request.images.length > 0) targetProduct.images = request.images;
      if (request.extraImages && request.extraImages.length > 0) targetProduct.extraImages = request.extraImages;
      if (request.variants && request.variants.length > 0) targetProduct.variants = request.variants;
      targetProduct.hasVariants = request.hasVariants !== undefined ? request.hasVariants : targetProduct.hasVariants;
      targetProduct.dimensions = request.dimensions || targetProduct.dimensions;
      targetProduct.weight = request.weight ?? targetProduct.weight;
      targetProduct.tags = request.tags || targetProduct.tags;
      targetProduct.metaTitle = request.metaTitle || targetProduct.metaTitle;
      targetProduct.metaDescription = request.metaDescription || targetProduct.metaDescription;
      targetProduct.metaKeywords = request.metaKeywords || targetProduct.metaKeywords;
      targetProduct.isFeatured = request.isFeatured !== false;
      targetProduct.isPublished = true;
      targetProduct.priority = request.priority ?? targetProduct.priority;
      targetProduct.productApprovalStatus = "approved";
      targetProduct.approvedBy = req.user._id;
      targetProduct.approvedAt = new Date();
      if (!targetProduct.collection) {
        targetProduct.collection = request.category || "General";
      }
      if (!targetProduct.user) {
        targetProduct.user = targetProduct.vendorUserId || targetProduct.vendorId || request.vendorId?._id || request.vendorId || req.user._id;
      }
    } else {
      targetProduct = new Product({
        name: request.name,
        description: request.description,
        price: request.price,
        discountPrice: request.discountPrice,
        shippingCharge: request.shippingCharge || 0,
        localShippingCharge: request.localShippingCharge || 0,
        freeShippingCities: request.freeShippingCities || [],
        countInStock: request.countInStock,
        sku: effectiveSku,
        category: request.category,
        brand: request.brand,
        sizes: request.sizes || [],
        colors: request.colors || [],
        collection: request.collection || request.category || "General",
        material: request.material,
        location: request.location,
        videoUrl: request.videoUrl,
        gender: request.gender,
        images: request.images || [],
        extraImages: request.extraImages || [],
        variants: request.variants || [],
        hasVariants: request.hasVariants || false,
        dimensions: request.dimensions,
        weight: request.weight,
        tags: request.tags || [],
        metaTitle: request.metaTitle,
        metaDescription: request.metaDescription,
        metaKeywords: request.metaKeywords,
        isFeatured: request.isFeatured !== false,
        isPublished: true,
        priority: request.priority || 0,
        rating: 0,
        numReviews: 0,
        user: request.vendorId?._id || request.vendorId || req.user._id,
        vendorId: request.vendorId?._id || request.vendorId,
        createdBy: "VENDOR",
        productApprovalStatus: "approved",
        approvedBy: req.user._id,
        approvedAt: new Date(),
      });
    }

    const savedProduct = await targetProduct.save();

    // Update the request status and persist the normalized/updated SKU
    request.sku = effectiveSku;
    request.status = "approved";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    request.productId = savedProduct._id;
    request.isPublished = true;

    await request.save();

    console.log(`[ProductRequest Approval Success] Request ${request._id} approved. Product ID: ${savedProduct._id}`);

    res.json({
      message: "Product request approved and product created successfully",
      request,
      product: savedProduct,
    });
  } catch (error) {
    console.error(`[ProductRequest Approval Error] Request ID: ${req.params?.id}:`, error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A product with this SKU already exists",
        error: "Duplicate SKU",
        code: "DUPLICATE_SKU",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
        error: error.message,
      });
    }
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
    const { rejectionReason, reason } = req.body || {};
    const effectiveReason = rejectionReason || reason || "Rejected by administrator";

    let request = await ProductRequest.findById(req.params.id);

    if (!request) {
      const directProduct = await Product.findById(req.params.id);
      if (directProduct) {
        directProduct.productApprovalStatus = "rejected";
        directProduct.rejectionReason = effectiveReason;
        directProduct.isPublished = false;

        if (!directProduct.collection) {
          directProduct.collection = directProduct.category || "General";
        }
        if (!directProduct.user) {
          directProduct.user = directProduct.vendorUserId || directProduct.vendorId?._id || directProduct.vendorId || (req.user ? req.user._id : undefined);
        }

        await directProduct.save();

        return res.json({
          message: "Product rejected",
          product: directProduct,
        });
      }
      return res.status(404).json({ message: "Product request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Cannot reject request that is not pending" });
    }

    request.status = "rejected";
    request.rejectedBy = req.user ? req.user._id : undefined;
    request.rejectedAt = new Date();
    request.rejectionReason = effectiveReason;
    request.isPublished = false;

    await request.save();

    // If request has a linked productId, also reject that product
    if (request.productId) {
      const linkedProduct = await Product.findById(request.productId);
      if (linkedProduct) {
        linkedProduct.productApprovalStatus = "rejected";
        linkedProduct.rejectionReason = effectiveReason;
        linkedProduct.isPublished = false;
        await linkedProduct.save();
      }
    }

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

// @desc    Update a product request (admin only)
// @route   PUT /api/vendor/product-requests/admin/:id
// @access  Private (admin)
const updateProductRequestAdmin = async (req, res) => {
  try {
    const request = await ProductRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Product request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Cannot update request that is not pending" });
    }

    const {
      name,
      description,
      price,
      discountPrice,
      shippingCharge,
      localShippingCharge,
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
      freeShippingCities,
    } = req.body;

    if (sku !== undefined) {
      const normalizedSku = typeof sku === "string" ? sku.trim() : (sku !== null ? String(sku).trim() : "");
      if (!normalizedSku) {
        return res.status(400).json({ message: "SKU cannot be empty" });
      }

      if (normalizedSku !== request.sku) {
        const existingRequest = await ProductRequest.findOne({
          sku: normalizedSku,
          _id: { $ne: request._id },
        });
        if (existingRequest) {
          return res.status(400).json({ message: "SKU already exists in product requests" });
        }

        const existingProduct = await Product.findOne({ sku: normalizedSku });
        if (existingProduct) {
          return res.status(400).json({ message: "SKU already exists in products" });
        }
      }

      request.sku = normalizedSku;
    } else if (request.sku) {
      request.sku = request.sku.trim();
    }

    request.name = name || request.name;
    request.description = description || request.description;
    request.price = price ? Number(price) : request.price;
    request.discountPrice = discountPrice ? Number(discountPrice) : request.discountPrice;
    request.shippingCharge = shippingCharge !== undefined ? Number(shippingCharge) : request.shippingCharge;
    request.localShippingCharge = localShippingCharge !== undefined ? Number(localShippingCharge) : request.localShippingCharge;
    if (freeShippingCities !== undefined) request.freeShippingCities = freeShippingCities;
    request.countInStock = countInStock ? Number(countInStock) : request.countInStock;
    request.category = category || request.category;
    request.brand = brand || request.brand;
    request.sizes = sizes || request.sizes;
    request.colors = colors || request.colors;
    request.collection = collection || request.collection;
    request.material = material || request.material;
    request.location = location !== undefined ? location : request.location;
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
    console.log(`[ProductRequest Admin Update] Request ${request._id} updated by admin ${req.user._id}`);
    res.json({
      message: "Product request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating product request by admin:", error.message);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A product request or product with this SKU already exists",
        error: "Duplicate SKU",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
        error: error.message,
      });
    }
    res.status(500).json({
      message: "Error updating product request",
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
  updateProductRequestAdmin,
};
const mongoose = require("mongoose");
const ProductRequest = require("../models/ProductRequest");
const Product = require("../models/Product");
const User = require("../models/User");
const Vendor = require("../models/Vendor");

const extractRequestData = (reqDoc) => {
  if (!reqDoc) return null;
  const doc = reqDoc.toObject ? reqDoc.toObject() : { ...reqDoc };
  const rawDoc = reqDoc._doc || {};
  const payload = doc.payload || rawDoc.payload || {};
  const vendorObj = doc.vendorId || {};

  const effectiveSku = String(
    doc.sku || payload.sku || doc.productSku || doc.SKU || payload.productSku || payload.SKU || ""
  ).trim();

  const priceVal = (doc.price !== undefined && doc.price !== null && doc.price !== "")
    ? Number(doc.price)
    : ((payload.price !== undefined && payload.price !== null && payload.price !== "") ? Number(payload.price) : 0);

  const discountPriceVal = (doc.discountPrice !== undefined && doc.discountPrice !== null)
    ? Number(doc.discountPrice)
    : ((payload.discountPrice !== undefined && payload.discountPrice !== null) ? Number(payload.discountPrice) : undefined);

  const countVal = (doc.countInStock !== undefined && doc.countInStock !== null && doc.countInStock > 0)
    ? Number(doc.countInStock)
    : (Number(payload.countInStock) || 0);

  const rawImages = (Array.isArray(doc.images) && doc.images.length > 0)
    ? doc.images
    : (Array.isArray(payload.images) && payload.images.length > 0 ? payload.images : []);

  const rawExtraImages = (Array.isArray(doc.extraImages) && doc.extraImages.length > 0)
    ? doc.extraImages
    : (Array.isArray(payload.extraImages) ? payload.extraImages : []);

  const rawSizes = (Array.isArray(doc.sizes) && doc.sizes.length > 0)
    ? doc.sizes
    : (Array.isArray(payload.sizes) ? payload.sizes : []);

  const rawColors = (Array.isArray(doc.colors) && doc.colors.length > 0)
    ? doc.colors
    : (Array.isArray(payload.colors) ? payload.colors : []);

  const rawVariants = (Array.isArray(doc.variants) && doc.variants.length > 0)
    ? doc.variants
    : (Array.isArray(payload.variants) ? payload.variants : []);

  const rawTags = (Array.isArray(doc.tags) && doc.tags.length > 0)
    ? doc.tags
    : (Array.isArray(payload.tags) ? payload.tags : []);

  const rawWellnessGoal = (Array.isArray(doc.wellnessGoal) && doc.wellnessGoal.length > 0)
    ? doc.wellnessGoal
    : (Array.isArray(payload.wellnessGoal) ? payload.wellnessGoal : []);

  const rawFreeShippingCities = (Array.isArray(doc.freeShippingCities) && doc.freeShippingCities.length > 0)
    ? doc.freeShippingCities
    : (Array.isArray(payload.freeShippingCities) ? payload.freeShippingCities : []);

  const vName =
    doc.vendorName ||
    payload.vendorName ||
    vendorObj.vendorName ||
    vendorObj.businessName ||
    vendorObj.name ||
    "Vendor";
  const vEmail = doc.vendorEmail || payload.vendorEmail || vendorObj.email || "N/A";
  const vPhone = doc.vendorPhone || payload.vendorPhone || vendorObj.phone || "N/A";

  const effectiveCategory = doc.category || payload.category || "General";
  const effectiveBrand = doc.brand || payload.brand || "General";
  const effectiveCollection = doc.collection || payload.collection || effectiveCategory || "General";

  return {
    ...doc,
    payload,
    _id: doc._id,
    id: (doc._id || "").toString(),
    productId: doc.productId || payload.productId,
    name: doc.name || payload.name || "",
    description: doc.description || payload.description || doc.name || "No description",
    price: priceVal,
    discountPrice: discountPriceVal,
    countInStock: countVal,
    sku: effectiveSku,
    category: effectiveCategory,
    subCategory: doc.subCategory || payload.subCategory || "",
    wellnessGoal: rawWellnessGoal,
    brand: effectiveBrand,
    collection: effectiveCollection,
    material: doc.material || payload.material || "",
    location: doc.location || payload.location || "",
    videoUrl: doc.videoUrl || payload.videoUrl || "",
    gender: doc.gender || payload.gender || "Unisex",
    images: rawImages,
    extraImages: rawExtraImages,
    variants: rawVariants,
    hasVariants: doc.hasVariants ?? payload.hasVariants ?? (rawVariants.length > 0),
    sizes: rawSizes,
    colors: rawColors,
    dimensions: doc.dimensions || payload.dimensions || { length: "", width: "", height: "" },
    weight: doc.weight ?? payload.weight ?? 0,
    tags: rawTags,
    shippingCharge: doc.shippingCharge ?? payload.shippingCharge ?? 0,
    localShippingCharge: doc.localShippingCharge ?? payload.localShippingCharge ?? 0,
    freeShippingCities: rawFreeShippingCities,
    warranty: doc.warranty || payload.warranty || "",
    certifications: doc.certifications || payload.certifications || "",
    countryOfOrigin: doc.countryOfOrigin || payload.countryOfOrigin || "",
    manufacturer: doc.manufacturer || payload.manufacturer || "",
    couponCodes: doc.couponCodes || payload.couponCodes || [],
    metaTitle: doc.metaTitle || payload.metaTitle || "",
    metaDescription: doc.metaDescription || payload.metaDescription || "",
    metaKeywords: doc.metaKeywords || payload.metaKeywords || "",
    isFeatured: doc.isFeatured ?? payload.isFeatured ?? false,
    priority: doc.priority ?? payload.priority ?? 0,
    platformCommission: doc.platformCommission ?? payload.platformCommission,
    isReferralEnabled: doc.isReferralEnabled ?? payload.isReferralEnabled,
    referralCommissionPercentage: doc.referralCommissionPercentage ?? payload.referralCommissionPercentage,
    status: doc.status || "pending",
    vendorId: doc.vendorId?._id || doc.vendorId,
    vendorName: vName,
    vendorEmail: vEmail,
    vendorPhone: vPhone,
  };
};

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
      vendorName: req.user.vendorName || req.user.name || "Vendor",
      vendorEmail: req.user.email || req.body.vendorEmail || "",
      vendorPhone: req.user.phone || req.body.vendorPhone || "",
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

    const normalizedRequests = requests.map((item) => extractRequestData(item));

    res.json({
      count: normalizedRequests.length,
      requests: normalizedRequests,
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

    const normalized = extractRequestData(request);

    res.json({
      request: normalized,
      ...normalized,
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
      .populate("vendorId", "businessName vendorName email phone name")
      .sort({ createdAt: -1 });

    const normalizedRequests = requests.map((item) => extractRequestData(item));

    // Also include direct Product documents needing approval or matching status
    let normalizedDirectProducts = [];
    if (mongoose.connection.readyState === 1) {
      try {
        const linkedProductIds = await ProductRequest.distinct("productId", {
          productId: { $exists: true, $ne: null },
        });

        let productQuery = {};
        if (status) {
          productQuery.productApprovalStatus = status;
        } else {
          productQuery.productApprovalStatus = { $in: ["pending", "approved", "rejected"] };
        }

        if (linkedProductIds && linkedProductIds.length > 0) {
          productQuery._id = { $nin: linkedProductIds };
        }

        if (vendorId) {
          productQuery.$or = [
            { vendorId: vendorId },
            { user: vendorId },
            { vendorUserId: vendorId },
          ];
        }

        if (productId) {
          if (mongoose.Types.ObjectId.isValid(productId)) {
            productQuery._id = productId;
          }
        }

        const directProducts = await Product.find(productQuery)
          .populate("vendorId", "businessName vendorName email phone name")
          .populate("user", "businessName vendorName email phone name")
          .sort({ createdAt: -1 });

        normalizedDirectProducts = directProducts.map((p) => {
          const doc = p.toObject ? p.toObject() : { ...p };
          const vendorObj = doc.vendorId || doc.user || {};
          const vName =
            doc.vendorName ||
            vendorObj.vendorName ||
            vendorObj.businessName ||
            vendorObj.name ||
            (doc.createdBy === "VENDOR" ? "Vendor Partner" : "Admin");
          const vEmail = doc.vendorEmail || vendorObj.email || "N/A";
          const vPhone = doc.vendorPhone || vendorObj.phone || "N/A";

          const effectiveSku = doc.sku || doc.productSku || doc.SKU || doc.payload?.sku || "";

          return {
            ...doc,
            _id: doc._id,
            id: (doc._id || "").toString(),
            productId: doc._id,
            name: doc.name || "",
            description: doc.description || "",
            status: doc.productApprovalStatus || "pending",
            sku: effectiveSku,
            category: doc.category || "",
            brand: doc.brand || "",
            collection: doc.collection || doc.category || "General",
            vendorId: doc.vendorId?._id || doc.vendorId || doc.user?._id || doc.user,
            vendorName: vName,
            vendorEmail: vEmail,
            vendorPhone: vPhone,
            images: Array.isArray(doc.images) ? doc.images : [],
            price: doc.price || 0,
            discountPrice: doc.discountPrice,
            countInStock: doc.countInStock ?? 0,
            createdAt: doc.createdAt || new Date(),
            rejectionReason: doc.rejectionReason || "",
            material: doc.material || "",
            weight: doc.weight || 0,
            videoUrl: doc.videoUrl || "",
            sizes: Array.isArray(doc.sizes) ? doc.sizes : [],
            colors: Array.isArray(doc.colors) ? doc.colors : [],
            tags: Array.isArray(doc.tags) ? doc.tags : [],
            isFeatured: Boolean(doc.isFeatured),
            priority: doc.priority || 0,
            variants: Array.isArray(doc.variants) ? doc.variants : [],
            dimensions: doc.dimensions || { length: "", width: "", height: "" },
            metaTitle: doc.metaTitle || "",
            metaDescription: doc.metaDescription || "",
            metaKeywords: doc.metaKeywords || "",
            isDirectProduct: true,
          };
        });
      } catch (directErr) {
        console.warn("Direct product lookup skipped:", directErr.message);
      }
    }

    const allRequests = [...normalizedRequests, ...normalizedDirectProducts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      count: allRequests.length,
      requests: allRequests,
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
    let request = await ProductRequest.findById(req.params.id)
      .populate("vendorId", "businessName vendorName email phone name");

    if (!request) {
      // Check direct Product document
      const directProduct = await Product.findById(req.params.id)
        .populate("vendorId", "businessName vendorName email phone name")
        .populate("user", "businessName vendorName email phone name");

      if (directProduct) {
        const doc = directProduct.toObject ? directProduct.toObject() : { ...directProduct };
        const vendorObj = doc.vendorId || doc.user || {};
        const vName =
          doc.vendorName ||
          vendorObj.vendorName ||
          vendorObj.businessName ||
          vendorObj.name ||
          (doc.createdBy === "VENDOR" ? "Vendor Partner" : "Admin");
        const vEmail = doc.vendorEmail || vendorObj.email || "N/A";
        const vPhone = doc.vendorPhone || vendorObj.phone || "N/A";
        const effectiveSku = doc.sku || doc.productSku || doc.SKU || "";

        const normalized = {
          ...doc,
          _id: doc._id,
          id: (doc._id || "").toString(),
          productId: doc._id,
          name: doc.name || "",
          description: doc.description || "",
          status: doc.productApprovalStatus || "pending",
          sku: effectiveSku,
          category: doc.category || "",
          brand: doc.brand || "",
          collection: doc.collection || doc.category || "General",
          vendorId: doc.vendorId?._id || doc.vendorId || doc.user?._id || doc.user,
          vendorName: vName,
          vendorEmail: vEmail,
          vendorPhone: vPhone,
          images: Array.isArray(doc.images) ? doc.images : [],
          price: doc.price || 0,
          discountPrice: doc.discountPrice,
          countInStock: doc.countInStock ?? 0,
          createdAt: doc.createdAt || new Date(),
          rejectionReason: doc.rejectionReason || "",
          material: doc.material || "",
          weight: doc.weight || 0,
          videoUrl: doc.videoUrl || "",
          sizes: Array.isArray(doc.sizes) ? doc.sizes : [],
          colors: Array.isArray(doc.colors) ? doc.colors : [],
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          isFeatured: Boolean(doc.isFeatured),
          priority: doc.priority || 0,
          variants: Array.isArray(doc.variants) ? doc.variants : [],
          dimensions: doc.dimensions || { length: "", width: "", height: "" },
          metaTitle: doc.metaTitle || "",
          metaDescription: doc.metaDescription || "",
          metaKeywords: doc.metaKeywords || "",
          isDirectProduct: true,
        };

        return res.json({
          request: normalized,
          ...normalized,
        });
      }

      return res.status(404).json({ message: "Product request not found" });
    }

    const normalized = extractRequestData(request);

    res.json({
      request: normalized,
      ...normalized,
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

    const reqData = extractRequestData(request);

    // Determine SKU: prioritize admin-provided SKU in req.body (sku, SKU, productSku), otherwise use request SKU sources
    const rawProvidedSku = req.body && (
      req.body.sku !== undefined ? req.body.sku : (
        req.body.SKU !== undefined ? req.body.SKU : req.body.productSku
      )
    );
    const providedSku = rawProvidedSku !== undefined
      ? (typeof rawProvidedSku === "string" ? rawProvidedSku.trim() : String(rawProvidedSku).trim())
      : undefined;

    const docSkuRaw = reqData.sku || "";
    let requestSku = docSkuRaw ? String(docSkuRaw).trim() : "";

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
      targetProduct.name = reqData.name || targetProduct.name;
      targetProduct.description = reqData.description || targetProduct.description;
      targetProduct.price = reqData.price !== undefined ? reqData.price : targetProduct.price;
      targetProduct.discountPrice = reqData.discountPrice !== undefined ? reqData.discountPrice : targetProduct.discountPrice;
      targetProduct.shippingCharge = reqData.shippingCharge ?? targetProduct.shippingCharge;
      targetProduct.localShippingCharge = reqData.localShippingCharge ?? targetProduct.localShippingCharge;
      targetProduct.freeShippingCities = reqData.freeShippingCities || targetProduct.freeShippingCities;
      targetProduct.countInStock = reqData.countInStock ?? targetProduct.countInStock;
      targetProduct.sku = effectiveSku;
      targetProduct.category = reqData.category || targetProduct.category;
      targetProduct.subCategory = reqData.subCategory || targetProduct.subCategory;
      targetProduct.wellnessGoal = (reqData.wellnessGoal && reqData.wellnessGoal.length > 0) ? reqData.wellnessGoal : targetProduct.wellnessGoal;
      targetProduct.brand = reqData.brand || targetProduct.brand;
      targetProduct.sizes = reqData.sizes || targetProduct.sizes;
      targetProduct.colors = reqData.colors || targetProduct.colors;
      targetProduct.collection = reqData.collection || targetProduct.collection || reqData.category || "General";
      targetProduct.material = reqData.material || targetProduct.material;
      targetProduct.location = reqData.location || targetProduct.location;
      targetProduct.videoUrl = reqData.videoUrl || targetProduct.videoUrl;
      targetProduct.gender = reqData.gender || targetProduct.gender;
      if (reqData.images && reqData.images.length > 0) targetProduct.images = reqData.images;
      if (reqData.extraImages && reqData.extraImages.length > 0) targetProduct.extraImages = reqData.extraImages;
      if (reqData.variants && reqData.variants.length > 0) targetProduct.variants = reqData.variants;
      targetProduct.hasVariants = reqData.hasVariants !== undefined ? reqData.hasVariants : targetProduct.hasVariants;
      targetProduct.dimensions = reqData.dimensions || targetProduct.dimensions;
      targetProduct.weight = reqData.weight ?? targetProduct.weight;
      targetProduct.tags = reqData.tags || targetProduct.tags;
      targetProduct.metaTitle = reqData.metaTitle || targetProduct.metaTitle;
      targetProduct.metaDescription = reqData.metaDescription || targetProduct.metaDescription;
      targetProduct.metaKeywords = reqData.metaKeywords || targetProduct.metaKeywords;
      targetProduct.isFeatured = reqData.isFeatured !== false;
      targetProduct.isPublished = true;
      targetProduct.priority = reqData.priority ?? targetProduct.priority;
      targetProduct.productApprovalStatus = "approved";
      targetProduct.approvedBy = req.user._id;
      targetProduct.approvedAt = new Date();
      if (!targetProduct.collection) {
        targetProduct.collection = reqData.category || "General";
      }
      if (!targetProduct.user) {
        targetProduct.user = targetProduct.vendorUserId || targetProduct.vendorId || request.vendorId?._id || request.vendorId || req.user._id;
      }
    } else {
      targetProduct = new Product({
        name: reqData.name,
        description: reqData.description,
        price: reqData.price,
        discountPrice: reqData.discountPrice,
        shippingCharge: reqData.shippingCharge || 0,
        localShippingCharge: reqData.localShippingCharge || 0,
        freeShippingCities: reqData.freeShippingCities || [],
        countInStock: reqData.countInStock,
        sku: effectiveSku,
        category: reqData.category,
        subCategory: reqData.subCategory,
        wellnessGoal: reqData.wellnessGoal || [],
        brand: reqData.brand,
        sizes: reqData.sizes || [],
        colors: reqData.colors || [],
        collection: reqData.collection || reqData.category || "General",
        material: reqData.material,
        location: reqData.location,
        videoUrl: reqData.videoUrl,
        gender: reqData.gender,
        images: reqData.images || [],
        extraImages: reqData.extraImages || [],
        variants: reqData.variants || [],
        hasVariants: reqData.hasVariants || false,
        dimensions: reqData.dimensions,
        weight: reqData.weight,
        tags: reqData.tags || [],
        metaTitle: reqData.metaTitle,
        metaDescription: reqData.metaDescription,
        metaKeywords: reqData.metaKeywords,
        isFeatured: reqData.isFeatured !== false,
        isPublished: true,
        priority: reqData.priority || 0,
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
    if (!request.name) request.name = reqData.name;
    if (!request.description) request.description = reqData.description;
    if (request.price === undefined || request.price === null) request.price = reqData.price;
    if (!request.category) request.category = reqData.category;
    if (!request.brand) request.brand = reqData.brand;
    if (!request.collection) request.collection = reqData.collection;
    if (request.countInStock === undefined || request.countInStock === null) request.countInStock = reqData.countInStock;
    if (!request.images || request.images.length === 0) request.images = reqData.images;

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
    const linkedProductIds = await ProductRequest.distinct("productId", {
      productId: { $exists: true, $ne: null },
    });

    const directProductPending = await Product.countDocuments({
      productApprovalStatus: "pending",
      _id: { $nin: linkedProductIds },
    });
    const directProductApproved = await Product.countDocuments({
      productApprovalStatus: "approved",
      _id: { $nin: linkedProductIds },
    });
    const directProductRejected = await Product.countDocuments({
      productApprovalStatus: "rejected",
      _id: { $nin: linkedProductIds },
    });

    const stats = {
      totalRequests: (await ProductRequest.countDocuments()) + directProductPending + directProductApproved + directProductRejected,
      pendingRequests: (await ProductRequest.countDocuments({ status: "pending" })) + directProductPending,
      approvedRequests: (await ProductRequest.countDocuments({ status: "approved" })) + directProductApproved,
      rejectedRequests: (await ProductRequest.countDocuments({ status: "rejected" })) + directProductRejected,
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
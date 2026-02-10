const Product = require("../models/Product");
const Vendor = require("../models/Vendor");

// Check if vendor is approved before allowing product operations
const checkVendorApproval = async (userId) => {
  const vendor = await Vendor.findOne({ userId });

  if (!vendor) {
    throw new Error("Vendor profile not found");
  }

  if (!vendor.isApproved) {
    throw new Error(
      "Your vendor account is not approved yet. Please wait for admin approval."
    );
  }

  return vendor;
};

// @desc    Create product (vendor only)
// @route   POST /api/vendor/products
// @access  Private (vendor)
const createVendorProduct = async (req, res) => {
  try {
    // Check if vendor is approved
    const vendor = await checkVendorApproval(req.user._id);

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
      variants,
      material,
      metaTile,
      metaDescription,
      metaKeywords,
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !sku || !category || !brand) {
      return res
        .status(400)
        .json({ message: "Missing required product fields" });
    }

    const newProduct = await Product.create({
      name,
      description,
      price,
      discountPrice,
      countInStock: countInStock || 0,
      sku,
      category,
      brand,
      sizes: sizes || [],
      colors: colors || [],
      collection,
      gender,
      images: images || [],
      extraImages: extraImages || [],
      videoUrl,
      hasVariants: hasVariants || false,
      variants: variants || [],
      material,
      metaTile,
      metaDescription,
      metaKeywords,
      user: req.user._id, // Link to vendor user
      vendorId: req.user._id, // Explicit vendor reference
      createdBy: "VENDOR", // Track that vendor created it
      productApprovalStatus: "pending", // Needs admin approval
      isPublished: false, // Hidden until approved
    });

    res.status(201).json({
      message:
        "Product created. Awaiting admin approval for publishing.",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error creating vendor product:", error);
    res.status(error.message.includes("not approved") ? 403 : 500).json({
      message: error.message || "Error creating product",
    });
  }
};

// @desc    Get vendor's own products
// @route   GET /api/vendor/products
// @access  Private (vendor)
const getVendorProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// @desc    Update vendor's own product
// @route   PUT /api/vendor/products/:productId
// @access  Private (vendor)
const updateVendorProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    // Check if product belongs to vendor
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to update this product",
      });
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
      hasVariants,
      variants,
      metaTile,
      metaDescription,
      metaKeywords,
    } = req.body;

    // Update fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = price;
    if (discountPrice) product.discountPrice = discountPrice;
    if (countInStock !== undefined) product.countInStock = countInStock;
    if (sku) product.sku = sku;
    if (category) product.category = category;
    if (brand) product.brand = brand;
    if (sizes) product.sizes = sizes;
    if (colors) product.colors = colors;
    if (collection) product.collection = collection;
    if (material) product.material = material;
    if (videoUrl) product.videoUrl = videoUrl;
    if (gender) product.gender = gender;
    if (images) product.images = images;
    if (extraImages) product.extraImages = extraImages;
    if (hasVariants !== undefined) product.hasVariants = hasVariants;
    if (variants) product.variants = variants;
    if (metaTile) product.metaTile = metaTile;
    if (metaDescription) product.metaDescription = metaDescription;
    if (metaKeywords) product.metaKeywords = metaKeywords;

    const updatedProduct = await product.save();

    res.json({
      message: "Product updated",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating vendor product:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
};

// @desc    Delete vendor's own product
// @route   DELETE /api/vendor/products/:productId
// @access  Private (vendor)
const deleteVendorProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product belongs to vendor
    if (product.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to delete this product",
      });
    }

    await product.deleteOne();

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting vendor product:", error);
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// @desc    Get product stats for vendor dashboard
// @route   GET /api/vendor/products/stats
// @access  Private (vendor)
const getVendorProductStats = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id });

    const stats = {
      totalProducts: products.length,
      publishedProducts: products.filter((p) => p.isPublished).length,
      draftProducts: products.filter((p) => !p.isPublished).length,
      totalStock: products.reduce((sum, p) => sum + p.countInStock, 0),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    res.status(500).json({
      message: "Error fetching stats",
      error: error.message,
    });
  }
};

module.exports = {
  createVendorProduct,
  getVendorProducts,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorProductStats,
  checkVendorApproval,
};

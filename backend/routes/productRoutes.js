const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const { getProductReadModel } = require("../utils/productDataAccess");
const router = express.Router();

// @route GET /api/products/all
// @desc Get all products without filters (for sidebar min/max price)
// @access Public
router.get("/all", async (req, res) => {
  try {
    const ProductReadModel = await getProductReadModel();
    const products = await ProductReadModel.find({ isPublished: true }).lean();
    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/products/categories
// @desc Get all distinct product categories
// @access Public
router.get("/categories", async (req, res) => {
  try {
    const Category = require("../models/Category");
    const categories = await Category.distinct("name");
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/products/categories-full
// @desc Get all categories with their subcategories
// @access Public
router.get("/categories-full", async (req, res) => {
  try {
    const Category = require("../models/Category");
    const categories = await Category.find({}).lean();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/products/subcategories
// @desc Get subcategories based on a category
// @access Public
router.get("/subcategories", async (req, res) => {
  try {
    const categoryName = String(req.query.category || "").trim();
    if (!categoryName) {
      return res.status(400).json({ message: "Category is required" });
    }
    const Category = require("../models/Category");
    const categoryDoc = await Category.findOne({ name: categoryName });
    if (!categoryDoc) return res.json([]);
    res.json(categoryDoc.subCategories || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});




// @route POST / api/ products
// @desc Create a new Product
// @access Private/admin

router.post("/", protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collection,
      material,
      location,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
    } = req.body;

    const product = new Product({
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collection,
      material,
      location,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
      user: req.user._id, //Refrence to the admin user who created it
    });

    const createProduct = await product.save();
    res.status(201).json(createProduct);
  } catch (error) {
    res.status(500).send("Server Error", error);
    // console.log("err", error)
  }
});

// @route POST /api/products/admin/add-for-vendor/:vendorId
// @desc Create a new Product for a specific vendor (admin only)
// @access Private/admin

router.post("/admin/add-for-vendor/:vendorId", protect, admin, async (req, res) => {
  try {
    let { vendorId } = req.params;
    
    // Ensure vendorId is a string and valid
    if (typeof vendorId === "object") {
      vendorId = String(vendorId);
    }
    
    const {
      name,
      description,
      price,
      discountPrice,
      countInStock,
      category,
      brand,
      sizes,
      colors,
      collection,
      material,
      location,
      gender,
      images,
      isFeatured,
      isPublished,
      tags,
      dimensions,
      weight,
      sku,
      variants,
      hasVariants,
    } = req.body;

    console.log(`📦 Creating product for vendor: ${vendorId}`);
    console.log(`🔍 VendorId type: ${typeof vendorId}, value: ${vendorId}`);

    const product = new Product({
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      countInStock: Number(countInStock),
      category,
      brand,
      sizes: sizes || [],
      colors: colors || [],
      collection,
      material,
      location,
      gender: gender || "Unisex",
      images: images || [],
      isFeatured: isFeatured !== false,
      isPublished: isPublished !== false,
      tags: tags || [],
      dimensions,
      weight,
      sku,
      user: vendorId, // Vendor as the user
      vendorId: vendorId, // Explicit vendor reference
      createdBy: "VENDOR", // Mark as vendor product
      productApprovalStatus: "approved", // Auto-approve admin-created vendor products
      approvedBy: req.user._id,
      approvedAt: new Date(),
      ...(hasVariants && variants && { 
        variants: variants,
        hasVariants: true 
      }),
    });

    const createProduct = await product.save();
    console.log(`✅ Product created successfully for vendor: ${vendorId}`);
    res.status(201).json(createProduct);
  } catch (error) {
    console.error(`❌ Error creating product for vendor:`, error);
    res.status(500).json({ 
      message: "Server Error", 
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`) : []
    });
  }
});

// @route PUT/api/products/:id
// @desc Update an existing product ID
// @access Private

router.put("/:id", protect, admin, async (req, res) => {
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
      category,
      brand,
      sizes,
      colors,
      collection,
      material,
      location,
      gender,
      images,
      isFeatured,
      isPublished,
      videoUrl,
      tags,
      dimensions,
      weight,
      sku,
    } = req.body;
    const product = await Product.findById(req.params.id);
    // console.log("pr92",product)
    if (product) {
      // update product fields
      product.name = name ?? product.name;
      product.description = description ?? product.description;
      product.price = price ?? product.price;
      product.discountPrice = discountPrice ?? product.discountPrice;
      if (shippingCharge !== undefined) product.shippingCharge = shippingCharge;
      if (localShippingCharge !== undefined) product.localShippingCharge = localShippingCharge;
      if (freeShippingCities !== undefined) product.freeShippingCities = freeShippingCities;
      product.countInStock = countInStock ?? product.countInStock;
      product.category = category ?? product.category;
      product.brand = brand ?? product.brand;
      product.sizes = sizes ?? product.sizes;
      product.colors = colors ?? product.colors;
      product.collection = collection ?? product.collection;
      product.material = material ?? product.material;
      product.location = location ?? product.location;
      product.gender = gender ?? product.gender;
      product.images = images ?? product.images;
      product.videoUrl = videoUrl ?? product.videoUrl;
      product.isFeatured =
        isFeatured !== undefined ? isFeatured : product.isFeatured;
      product.isPublished =
        isPublished !== undefined ? isPublished : product.isPublished;
      product.tags = tags ?? product.tags;
      product.dimensions = dimensions ?? product.dimensions;
      product.weight = weight ?? product.weight;
      product.sku = sku ?? product.sku;

      //   save the  updated product
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

// @route delete/api/products/:id
// @desc delete an existing product ID
// @access Private

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

// @route get/api/products
// @desc get all products with optional query filter
// @access Public

router.get("/", async (req, res) => {
  try {
    const {
      collection,
      size,
      color,
      gender,
      minPrice,
      maxPrice,
      sortBy,
      search,
      category,
      subCategory,
      material,
      location,
      brand,
      limit,
      videoUrl
    } = req.query;

    let query = { isPublished: true };
    // Filter logic
    if (collection && collection.toLowerCase() !== "all") query.collection = collection;
    if (category && category.toLowerCase() !== "all") query.category = { $regex: category, $options: "i" };
    if (subCategory && subCategory.toLowerCase() !== "all") query.subCategory = { $regex: subCategory, $options: "i" };
    if (brand) query.brand = { $in: brand.split(",").map(b => new RegExp(b, "i")) };
    if (material) query.material = { $in: material.split(",") };
    if (location) query.location = { $regex: location, $options: "i" };
    if (size) query.sizes = { $in: size.split(",") };
    if (color) query.colors = { $in: [color] };
    if (gender) query.gender = gender;
    if (minPrice || maxPrice) {
      query.discountPrice = {};
      if (minPrice) query.discountPrice.$gte = Number(minPrice);
      if (maxPrice) query.discountPrice.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // sort logic
    let sort = { priority: -1 }; // <-- default: higher priority first

    if (sortBy) {
      switch (sortBy) {
        case "priceAsc":
          sort = { price: 1 };
          break;
        case "priceDesc":
          sort = { price: -1 };
          break;
        case "popularity":
          sort = { rating: -1 };
          break;
        case "priority":
          sort = { priority: -1 }; // explicitly sort by priority
          break;
        default:
          break;
      }
    }

    // Fetch products, apply sorting & limit
    const ProductReadModel = await getProductReadModel();
    let products = await ProductReadModel.find(query)
      .sort(sort)
      .limit(Number(limit) || 0)
      .lean();

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});


// @route get/api/products/best-seller
// @desc Retrieve the products with higher rating
// @access Public
router.get("/best-seller", async (req, res) => {
  try {
    const ProductReadModel = await getProductReadModel();
    const bestSeller = await ProductReadModel.findOne({ isPublished: true }).sort({ rating: -1 }).lean();
    if (bestSeller) {
      res.json(bestSeller);
    } else {
      res.status(404).json({ message: " No best seller found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route get/api/products/new-arrivals
// @desc Retrieve latest 8 products - Creation date
// @access Public

router.get("/new-arrivals", async (req, res) => {
  try {
    const ProductReadModel = await getProductReadModel();
    const newArrivals = await ProductReadModel.find({ isPublished: true }).sort({ createdAt: -1 }).limit(8).lean();
    res.json(newArrivals);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route get/api/products/:id
// @desc get single product by ID
// @access Public

router.get("/:id", async (req, res) => {
  try {
    const ProductReadModel = await getProductReadModel();
    const product = await ProductReadModel.findOne({ _id: req.params.id, isPublished: true }).lean();
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: " Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route get/api/products/similar/:id
// @desc Retrieve similar products based on the current products gender and category
// @access Public

router.get("/similar/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const ProductReadModel = await getProductReadModel();
    const product = await ProductReadModel.findById(id).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const similarProduct = await ProductReadModel.find({
      _id: { $ne: id },
      gender: product.gender,
      category: product.category,
      isPublished: true,
    }).limit(4).lean();
    res.json(similarProduct);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;

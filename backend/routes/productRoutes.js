const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const { getProductReadModel } = require("../utils/productDataAccess");
const router = express.Router();

// ─── 1. Bounded LRU Cache & Expired Entry Purger (Items #2 & #6) ───
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000; // 5-min TTL
const MAX_CACHE_SIZE = 500; // Item #6: Max 500 entries
const memorySearchCache = new Map(); // key -> { timestamp, data, etag }

// Item #2: Periodic cleanup of expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memorySearchCache.entries()) {
    if (now - entry.timestamp >= SEARCH_CACHE_TTL_MS) {
      memorySearchCache.delete(key);
    }
  }
}, 60 * 1000);

function getFromNodeCache(key) {
  const entry = memorySearchCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp >= SEARCH_CACHE_TTL_MS) {
    memorySearchCache.delete(key);
    return null;
  }
  return entry;
}

function setInNodeCache(key, data, etag) {
  // LRU Eviction: Remove oldest key when cache reaches 500 entries
  if (memorySearchCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = memorySearchCache.keys().next().value;
    if (oldestKey) memorySearchCache.delete(oldestKey);
  }
  memorySearchCache.set(key, { timestamp: Date.now(), data, etag });
}

function normalizeSearchQuery(input) {
  return String(input || "").trim().toLowerCase().replace(/\s+/g, " ");
}

const rateLimit = require("express-rate-limit");
const SearchAnalytics = require("../models/SearchAnalytics");

// ─── 2. Express Rate Limiter Middleware (100 req/min) ───
const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { suggestions: [], message: "Too many search requests. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});

// MongoDB Persistent Analytics Helper
async function persistSearchAnalytics(query, resultCount) {
  try {
    await SearchAnalytics.findOneAndUpdate(
      { query },
      {
        $inc: { searchCount: 1, ...(resultCount === 0 ? { zeroResultCount: 1 } : {}) },
        $set: { lastSearchedAt: new Date() }
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Error persisting search analytics:", err);
  }
}

// Item #8: Cloudinary Thumbnail URL Transformer (200x200 image)
function getThumbnailUrl(rawImage) {
  if (!rawImage) return null;
  const urlStr = typeof rawImage === "string" ? rawImage : rawImage.url || "";
  if (!urlStr) return null;
  if (urlStr.includes("cloudinary.com") && urlStr.includes("/upload/")) {
    return urlStr.replace("/upload/", "/upload/w_200,h_200,c_fill,f_auto,q_auto/");
  }
  return urlStr;
}

// ─── 4. Search Execution Engine with Tokenized Multi-Field Matching (Items #1 & #4) ───
async function executeSearch(normalizedQ) {
  const ProductModel = require("../models/Product");

  const words = normalizedQ.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // Item #1: Try MongoDB Atlas Search ($search with tokenized compound autocomplete)
  try {
    const atlasPipeline = [
      {
        $search: {
          index: "default",
          compound: {
            should: words.flatMap((w) => [
              { autocomplete: { query: w, path: "name", score: { boost: { value: 5 } } } },
              { autocomplete: { query: w, path: "searchName", score: { boost: { value: 4 } } } },
              { autocomplete: { query: w, path: "brand", score: { boost: { value: 4 } } } },
              { autocomplete: { query: w, path: "category", score: { boost: { value: 3 } } } },
              { autocomplete: { query: w, path: "subCategory", score: { boost: { value: 2 } } } },
              { autocomplete: { query: w, path: "wellnessGoal", score: { boost: { value: 1.5 } } } }
            ])
          }
        }
      },
      { $match: { isPublished: { $ne: false } } },
      { $limit: 10 },
      { $project: { _id: 1, name: 1, category: 1, subCategory: 1, brand: 1, price: 1, discountedPrice: 1, images: 1, thumbnail: 1, wellnessGoal: 1 } }
    ];
    const atlasResults = await ProductModel.aggregate(atlasPipeline);
    if (Array.isArray(atlasResults) && atlasResults.length > 0) {
      return atlasResults;
    }
  } catch (atlasErr) {
    // Atlas Search index not enabled on this environment; fallback to tokenized indexed query
  }

  // Tokenized Cross-Field Fallback Query (Matches query words across name, brand, category, wellnessGoal)
  const tokenConditions = words.map((w) => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    return {
      $or: [
        { name: regex },
        { searchName: regex },
        { brand: regex },
        { category: regex },
        { subCategory: regex },
        { wellnessGoal: regex },
        { tags: regex }
      ]
    };
  });

  const products = await ProductModel.find({
    isPublished: { $ne: false },
    $and: tokenConditions
  })
    .select("_id name category subCategory brand price discountedPrice images thumbnail wellnessGoal")
    .limit(30)
    .lean();

  // Relevance Scoring & Ranking
  const ranked = products.sort((a, b) => {
    const scoreProduct = (p) => {
      let score = 0;
      const nameLower = (p.name || "").toLowerCase();
      const brandLower = (p.brand || "").toLowerCase();
      const categoryLower = (p.category || "").toLowerCase();
      const combined = `${brandLower} ${nameLower} ${categoryLower}`.trim();

      if (nameLower.startsWith(normalizedQ)) score += 100;
      if (combined.startsWith(normalizedQ)) score += 80;
      if (nameLower.includes(normalizedQ)) score += 50;
      if (combined.includes(normalizedQ)) score += 40;

      words.forEach((w) => {
        if (nameLower.includes(w)) score += 20;
        if (brandLower.includes(w)) score += 15;
        if (categoryLower.includes(w)) score += 10;
      });
      return score;
    };

    return scoreProduct(b) - scoreProduct(a);
  });

  return ranked.slice(0, 10);
}

// @route GET /api/products/search-suggestions
// @desc Hyper-optimized live search suggestions (Atlas Search, express-rate-limit, ETag, MongoDB Analytics)
// @access Public
router.get("/search-suggestions", searchRateLimiter, async (req, res) => {
  try {
    // Query Normalization
    const query = normalizeSearchQuery(req.query.q);

    // Minimum 3 Characters Guard
    if (query.length < 3) {
      return res.json({ suggestions: [] });
    }

    const cacheKey = query;
    const cached = getFromNodeCache(cacheKey);

    if (cached) {
      // ETag & 304 Validation
      if (req.headers["if-none-match"] === cached.etag) {
        return res.status(304).end();
      }
      res.setHeader("Cache-Control", "public, max-age=300");
      res.setHeader("ETag", cached.etag);
      return res.json(cached.data);
    }

    const rawProducts = await executeSearch(query);

    // Persist analytics to MongoDB
    persistSearchAnalytics(query, rawProducts.length);

    // Map thumbnail & compact fields
    const suggestions = rawProducts.map((p) => {
      const firstImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
      const thumbnailUrl = p.thumbnail || getThumbnailUrl(firstImage);
      return {
        _id: p._id,
        name: p.name,
        category: p.category || "",
        subCategory: p.subCategory || "",
        brand: p.brand || "",
        price: p.price || 0,
        discountedPrice: p.discountedPrice || p.price || 0,
        image: thumbnailUrl,
        wellnessGoal: p.wellnessGoal || "",
      };
    });

    const responseData = { suggestions };
    const etag = `W/"${Buffer.from(JSON.stringify(responseData)).toString("base64").substring(0, 16)}"`;

    setInNodeCache(cacheKey, responseData, etag);

    // HTTP Cache + ETag
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("ETag", etag);
    return res.json(responseData);
  } catch (error) {
    console.error("SEARCH SUGGESTIONS ERROR 👉", error);
    return res.status(500).json({ suggestions: [], message: "Server Error" });
  }
});

// @route POST /api/products/search-analytics/click
// @desc Record click on search suggestion for MongoDB analytics
router.post("/search-analytics/click", async (req, res) => {
  try {
    const { productId, query } = req.body;
    if (productId && query) {
      const normQ = normalizeSearchQuery(query);
      const analyticsDoc = await SearchAnalytics.findOne({ query: normQ });
      if (analyticsDoc) {
        const clickIndex = analyticsDoc.clicks.findIndex((c) => String(c.productId) === String(productId));
        if (clickIndex >= 0) {
          analyticsDoc.clicks[clickIndex].clickCount += 1;
        } else {
          analyticsDoc.clicks.push({ productId, clickCount: 1 });
        }
        await analyticsDoc.save();
      }
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("Error recording click analytics:", err);
    return res.status(500).json({ message: "Analytics Error" });
  }
});

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
// @desc Get all distinct product categories that have published products
// @access Public
router.get("/categories", async (req, res) => {
  try {
    const Product = require("../models/Product");
    const activeCategories = await Product.distinct("category", { isPublished: { $ne: false } });
    const cleaned = activeCategories.map((c) => String(c).trim()).filter(Boolean);
    res.json(cleaned);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Curated Core Health & Wellness Categories with Subcategories for Top Filter Bar (Strict & 100% Relevant)
const CORE_WELLNESS_FILTERS = [
  {
    id: "hair-care",
    name: "Hair Care",
    emoji: "💇‍♀️",
    buildQuery: () => ({
      $and: [
        {
          $or: [
            { category: { $regex: /hair/i } },
            { subCategory: { $regex: /hair/i } },
            { name: { $regex: /hair|shampoo|scalp|dandruff|shikakai|bhringraj|henna|heena|indigo powder|rosemary|kalonji/i } },
          ],
        },
        { name: { $not: { $regex: /orange peel|beetroot powder|baby soap|baby cream/i } } },
      ],
    }),
    subCategories: [
      { id: "hair-oils-tonics", name: "Hair Oils & Tonics", emoji: "💧", buildQuery: () => ({ name: { $regex: /oil|tonic|scalp serum|solution|badam|kalonji|methi|rosemary|bhringraj/i } }) },
      { id: "shampoos-cleansers", name: "Shampoos & Cleansers", emoji: "🧴", buildQuery: () => ({ name: { $regex: /shampoo|cleanser|shikakai|reetha/i } }) },
      { id: "hair-masks-colors", name: "Hair Packs, Masks & Colors", emoji: "🌿", buildQuery: () => ({ name: { $regex: /mask|henna|heena|indigo|conditioner|hair pack|hair spa/i } }) },
    ],
  },
  {
    id: "skin-care",
    name: "Skin Care",
    emoji: "✨",
    buildQuery: () => ({
      $and: [
        {
          $or: [
            { category: { $regex: /skin|face|ubtan|personal care/i } },
            { subCategory: { $regex: /skin|face|body care|oral care/i } },
            { name: { $regex: /face|skin|ubtan|cream|serum|gel|rose water|gulab|kajal|lip|scrub|multani|sandalwood|saffron|soap|lotion|body polisher|body wash|d-tan|dtan|kumkumadi/i } },
          ],
        },
        {
          name: {
            $not: {
              $regex: /hair oil|shampoo|hair mask|hair spray|hair solution|hair tonic|hair regrowth|hair protein|ice gel|hair conditioner|hair color|heena|henna|badam methi oil|kalonji oil|coconut oil/i,
            },
          },
        },
      ],
    }),
    subCategories: [
      { id: "face-wash-cleansers", name: "Face Wash & Cleansers", emoji: "🫧", buildQuery: () => ({ name: { $regex: /face wash|cleanser|scrub|exfoliat/i } }) },
      { id: "ubtan-face-packs", name: "Ubtan & Face Packs", emoji: "✨", buildQuery: () => ({ name: { $regex: /ubtan|face pack|face mask|multani|sandalwood/i } }) },
      { id: "creams-serums-gels", name: "Creams, Serums & Gels", emoji: "💧", buildQuery: () => ({ name: { $regex: /cream|serum|gel|rose water|gulab|lotion|kumkumadi/i } }) },
      { id: "soaps-body-care", name: "Soaps & Body Care", emoji: "🧼", buildQuery: () => ({ name: { $regex: /soap|body wash|body polisher|kajal|lip|d-tan|dtan/i } }) },
    ],
  },
  {
    id: "health-devices",
    name: "Health Devices & Gadgets",
    emoji: "🩺",
    buildQuery: () => ({
      $or: [
        { category: { $regex: /monitoring|device|tools|panchakarma equipment/i } },
        { name: { $regex: /cooler bag|cooler bottle|cooling wallet|glucometer|steamer|eye cup|yantra|tarangini|respyr|jalneti/i } },
      ],
    }),
    subCategories: [
      { id: "insulin-coolers", name: "Insulin Coolers & Cases", emoji: "❄️", buildQuery: () => ({ name: { $regex: /cooler|cooling|bottle|wallet/i } }) },
      { id: "steamers-therapy", name: "Steamers & Therapy Equipment", emoji: "💨", buildQuery: () => ({ name: { $regex: /steamer|yantra|tarangini/i } }) },
      { id: "diagnostic-wellness", name: "Diagnostic & Wellness Tools", emoji: "🩺", buildQuery: () => ({ name: { $regex: /glucometer|eye cup|respyr|jalneti/i } }) },
    ],
  },
  {
    id: "nutrition-supplements",
    name: "Nutrition & Protein",
    emoji: "🥗",
    buildQuery: () => ({
      $and: [
        {
          $or: [
            { category: { $regex: /nutrition|suppliment|supplement|food|snack|protein/i } },
            { subCategory: { $regex: /protein|snack/i } },
            { name: { $regex: /protein bite|chips|cookies|sugar|sweetener|jaggery|garlic|millet/i } },
          ],
        },
        { name: { $not: { $regex: /hair protein/i } } },
      ],
    }),
    subCategories: [
      { id: "protein-energy", name: "Protein Bites & Energy", emoji: "⚡", buildQuery: () => ({ name: { $regex: /protein|bites/i } }) },
      { id: "millet-snacks", name: "Millet Chips & Healthy Snacks", emoji: "🍪", buildQuery: () => ({ name: { $regex: /chips|cookies|snack|millet/i } }) },
      { id: "sweeteners-jaggery", name: "Natural Sweeteners & Jaggery", emoji: "🍯", buildQuery: () => ({ name: { $regex: /sugar|sweetener|jaggery/i } }) },
    ],
  },
  {
    id: "ayurveda-panchakarma",
    name: "Ayurveda & Panchakarma",
    emoji: "🌿",
    buildQuery: () => ({
      $or: [
        { category: { $regex: /ayurved|panchakarma|plant|herb|spices/i } },
        { name: { $regex: /ayurved|shilajit|potli|microgreens|shuddhi|moringa|neem|panchakarma|yantra|jalneti/i } },
      ],
    }),
    subCategories: [
      { id: "microgreens", name: "Fresh Microgreens & Live Greens", emoji: "🌱", buildQuery: () => ({ name: { $regex: /microgreens/i } }) },
      { id: "ayurvedic-herbs", name: "Ayurvedic Herbs & Supplements", emoji: "🌿", buildQuery: () => ({ name: { $regex: /shilajit|shuddhi|moringa|neem|powder|herb/i } }) },
      { id: "panchakarma-therapy", name: "Therapy & Panchakarma Kits", emoji: "🏺", buildQuery: () => ({ name: { $regex: /panchakarma|yantra|jalneti|potli/i } }) },
    ],
  },
  {
    id: "pain-relief",
    name: "Pain Relief & Therapy",
    emoji: "💆",
    buildQuery: () => ({
      $or: [
        { category: { $regex: /pain|therapy/i } },
        { name: { $regex: /pidanashak|potli|ice gel/i } },
      ],
    }),
    subCategories: [],
  },
  {
    id: "baby-kids",
    name: "Baby & Kids Care",
    emoji: "👶",
    buildQuery: () => ({
      $or: [
        { category: { $regex: /baby|kids/i } },
        { subCategory: { $regex: /baby/i } },
        { name: { $regex: /baby|bal sparsh|vatsalya/i } },
      ],
    }),
    subCategories: [],
  },
  {
    id: "womens-care",
    name: "Women's Wellness",
    emoji: "🌸",
    buildQuery: () => ({
      $or: [
        { category: { $regex: /women/i } },
        { subCategory: { $regex: /menstrual/i } },
        { name: { $regex: /bio pads|menstrual/i } },
      ],
    }),
    subCategories: [],
  },
];

// @route GET /api/products/wellness-goals
// @desc Get clean, curated core wellness categories with subcategories and real active product counts
// @access Public
router.get("/wellness-goals", async (req, res) => {
  try {
    const ProductReadModel = await getProductReadModel();
    const totalPublished = await ProductReadModel.countDocuments({ isPublished: { $ne: false } });

    const formatted = [];
    for (const f of CORE_WELLNESS_FILTERS) {
      const parentQuery = f.buildQuery();
      const count = await ProductReadModel.countDocuments({
        isPublished: { $ne: false },
        ...parentQuery,
      });
      if (count > 0) {
        const subCategories = [];
        for (const sub of (f.subCategories || [])) {
          const subQuery = sub.buildQuery();
          const subCount = await ProductReadModel.countDocuments({
            isPublished: { $ne: false },
            $and: [parentQuery, subQuery],
          });
          if (subCount > 0) {
            subCategories.push({
              id: sub.id,
              name: sub.name,
              emoji: sub.emoji,
              count: subCount,
            });
          }
        }

        formatted.push({
          id: f.id,
          name: f.name,
          emoji: f.emoji,
          count: count,
          subCategories,
        });
      }
    }

    res.json({
      totalAllProducts: totalPublished,
      goals: formatted,
    });
  } catch (error) {
    console.error("Error fetching wellness goals:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/products/categories-full
// @desc Get all categories with subcategories that have published products
// @access Public
router.get("/categories-full", async (req, res) => {
  try {
    const Category = require("../models/Category");
    const Product = require("../models/Product");

    // Fetch published products to discover active categories and subcategories
    const activeProducts = await Product.find(
      { isPublished: { $ne: false } },
      { category: 1, subCategory: 1 }
    ).lean();

    const categoryMap = new Map();
    activeProducts.forEach((prod) => {
      const catName = String(prod.category || "").trim();
      if (!catName) return;
      const normalizedCat = catName.toLowerCase();
      if (!categoryMap.has(normalizedCat)) {
        categoryMap.set(normalizedCat, { originalName: catName, subCategories: new Set() });
      }
      const subCat = String(prod.subCategory || "").trim();
      if (subCat) {
        categoryMap.get(normalizedCat).subCategories.add(subCat);
      }
    });

    const dbCategories = await Category.find({}).lean();

    const result = [];
    dbCategories.forEach((dbCat) => {
      const dbNormName = String(dbCat.name || "").trim().toLowerCase();
      if (categoryMap.has(dbNormName)) {
        const catInfo = categoryMap.get(dbNormName);
        const validSubCats = (dbCat.subCategories || []).filter((sub) =>
          catInfo.subCategories.has(String(sub).trim())
        );

        result.push({
          ...dbCat,
          subCategories: validSubCats,
        });
        categoryMap.delete(dbNormName);
      }
    });

    categoryMap.forEach((catInfo, normName) => {
      result.push({
        _id: normName,
        name: catInfo.originalName,
        subCategories: Array.from(catInfo.subCategories),
      });
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/products/subcategories
// @desc Get subcategories based on a category for published products
// @access Public
router.get("/subcategories", async (req, res) => {
  try {
    const categoryName = String(req.query.category || "").trim();
    if (!categoryName) {
      return res.status(400).json({ message: "Category is required" });
    }
    const Product = require("../models/Product");
    const subCategories = await Product.distinct("subCategory", {
      category: { $regex: new RegExp(`^${categoryName}$`, "i") },
      isPublished: { $ne: false },
    });
    const cleaned = subCategories.map((s) => String(s).trim()).filter(Boolean);
    res.json(cleaned);
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
      videoUrl,
      goal,
      wellnessGoal,
      subGoal,
    } = req.query;

    let query = { isPublished: true };
    // Filter logic
    if (collection && collection.toLowerCase() !== "all") query.collection = collection;
    if (category && category.toLowerCase() !== "all") query.category = { $regex: category, $options: "i" };
    if (subCategory && subCategory.toLowerCase() !== "all") query.subCategory = { $regex: subCategory, $options: "i" };
    if (brand) query.brand = { $in: brand.split(",").map(b => new RegExp(b, "i")) };
    if (material) query.material = { $in: material.split(",") };
    if (location) query.location = { $regex: location, $options: "i" };
    const targetGoal = goal || wellnessGoal;
    if (targetGoal && targetGoal.toLowerCase() !== "all") {
      const matchedFilter = CORE_WELLNESS_FILTERS.find(
        (f) =>
          f.id.toLowerCase() === targetGoal.toLowerCase() ||
          f.name.toLowerCase() === targetGoal.toLowerCase()
      );
      if (matchedFilter) {
        const filterQuery = matchedFilter.buildQuery();
        query.$and = query.$and || [];
        query.$and.push(filterQuery);

        if (subGoal && subGoal.toLowerCase() !== "all") {
          const matchedSub = matchedFilter.subCategories?.find(
            (s) =>
              s.id.toLowerCase() === subGoal.toLowerCase() ||
              s.name.toLowerCase() === subGoal.toLowerCase()
          );
          if (matchedSub) {
            query.$and.push(matchedSub.buildQuery());
          }
        }
      } else {
        query.wellnessGoal = { $in: [new RegExp(`^${targetGoal}$`, "i")] };
      }
    }
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
    const pageNum = parseInt(req.query.page, 10);
    const limitNum = parseInt(req.query.limit, 10);

    if (pageNum && limitNum > 0) {
      const skip = (pageNum - 1) * limitNum;
      const totalProducts = await ProductReadModel.countDocuments(query);
      const products = await ProductReadModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();

      return res.json({
        products,
        page: pageNum,
        totalPages: Math.ceil(totalProducts / limitNum) || 1,
        totalProducts,
        hasMore: skip + products.length < totalProducts,
      });
    }

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
// @route get/api/products/:id
// @desc get single product by ID or Slug
// @access Public

const slugify = (name) => {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

router.get("/:id", async (req, res) => {
  try {
    const ProductReadModel = await getProductReadModel();
    const mongoose = require("mongoose");
    const param = req.params.id;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(param) && String(new mongoose.Types.ObjectId(param)) === param) {
      product = await ProductReadModel.findOne({ _id: param, isPublished: true }).lean();
    }

    if (!product) {
      product = await ProductReadModel.findOne({ slug: param.toLowerCase(), isPublished: true }).lean();
    }

    if (!product) {
      const nameSearch = param.toLowerCase().replace(/-/g, " ");
      product = await ProductReadModel.findOne({ searchName: nameSearch, isPublished: true }).lean();
    }

    if (!product) {
      const allProducts = await ProductReadModel.find({ isPublished: true }).lean();
      product = allProducts.find((p) => slugify(p.name) === param.toLowerCase());
    }

    if (product) {
      if (!product.slug) {
        product.slug = slugify(product.name);
      }
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// @route get/api/products/similar/:id
// @desc Retrieve similar products based on the current products gender and category
router.get("/similar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ProductReadModel = await getProductReadModel();
    const mongoose = require("mongoose");
    let product = null;

    if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
      product = await ProductReadModel.findById(id).lean();
    }

    if (!product) {
      product = await ProductReadModel.findOne({ slug: id.toLowerCase() }).lean();
    }

    if (!product) {
      const nameSearch = id.toLowerCase().replace(/-/g, " ");
      product = await ProductReadModel.findOne({ searchName: nameSearch }).lean();
    }

    if (!product) {
      const allProducts = await ProductReadModel.find({}).lean();
      product = allProducts.find((p) => (p.slug || slugify(p.name)) === id.toLowerCase());
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentIdStr = product._id.toString();
    const seenIds = new Set([currentIdStr]);
    const relatedProducts = [];
    const MAX_RELATED = 8;

    const getObjectIdArray = () => {
      return Array.from(seenIds)
        .filter((i) => mongoose.Types.ObjectId.isValid(i))
        .map((i) => new mongoose.Types.ObjectId(i));
    };

    // Priority 1: Same subCategory
    if (product.subCategory && typeof product.subCategory === "string" && product.subCategory.trim()) {
      const subCatProducts = await ProductReadModel.find({
        _id: { $nin: getObjectIdArray() },
        subCategory: product.subCategory,
        isPublished: true,
      })
        .limit(MAX_RELATED)
        .lean();

      for (const p of subCatProducts) {
        const pid = p._id.toString();
        if (!seenIds.has(pid)) {
          seenIds.add(pid);
          relatedProducts.push(p);
        }
      }
    }

    // Priority 2: Same Category
    if (relatedProducts.length < MAX_RELATED && product.category) {
      const remainingLimit = MAX_RELATED - relatedProducts.length;
      const catProducts = await ProductReadModel.find({
        _id: { $nin: getObjectIdArray() },
        category: product.category,
        isPublished: true,
      })
        .limit(remainingLimit)
        .lean();

      for (const p of catProducts) {
        const pid = p._id.toString();
        if (!seenIds.has(pid)) {
          seenIds.add(pid);
          relatedProducts.push(p);
        }
      }
    }

    // Priority 3: Tags / WellnessGoal / Collection
    if (relatedProducts.length < MAX_RELATED) {
      const tagQueryConditions = [];
      if (Array.isArray(product.tags) && product.tags.length > 0) {
        tagQueryConditions.push({ tags: { $in: product.tags } });
      }
      if (Array.isArray(product.wellnessGoal) && product.wellnessGoal.length > 0) {
        tagQueryConditions.push({ wellnessGoal: { $in: product.wellnessGoal } });
      }
      if (product.collection) {
        tagQueryConditions.push({ collection: product.collection });
      }

      if (tagQueryConditions.length > 0) {
        const remainingLimit = MAX_RELATED - relatedProducts.length;
        const tagProducts = await ProductReadModel.find({
          _id: { $nin: getObjectIdArray() },
          isPublished: true,
          $or: tagQueryConditions,
        })
          .limit(remainingLimit)
          .lean();

        for (const p of tagProducts) {
          const pid = p._id.toString();
          if (!seenIds.has(pid)) {
            seenIds.add(pid);
            relatedProducts.push(p);
          }
        }
      }
    }

    // Priority 4: Fallback - any published products
    if (relatedProducts.length < 4) {
      const remainingLimit = 4 - relatedProducts.length;
      const fallbackProducts = await ProductReadModel.find({
        _id: { $nin: getObjectIdArray() },
        isPublished: true,
      })
        .limit(remainingLimit)
        .lean();

      for (const p of fallbackProducts) {
        const pid = p._id.toString();
        if (!seenIds.has(pid)) {
          seenIds.add(pid);
          relatedProducts.push(p);
        }
      }
    }

    // Ensure slug is present on all returned products for frontend navigation
    for (const p of relatedProducts) {
      if (!p.slug && p.name) {
        p.slug = slugify(p.name);
      }
    }

    res.json(relatedProducts);
  } catch (error) {
    console.error("Error in /api/products/similar/:id:", error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;

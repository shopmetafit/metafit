const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createVendorProduct,
  getVendorProducts,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorProductStats,
} = require("../controllers/vendorProductController");

const router = express.Router();

// All routes require vendor authentication
router.use(protect, authorize("vendor"));

// Get vendor stats
router.get("/stats", getVendorProductStats);

// Get vendor's products
router.get("/", getVendorProducts);

// Create new product
router.post("/", createVendorProduct);

// Update product
router.put("/:productId", updateVendorProduct);

// Delete product
router.delete("/:productId", deleteVendorProduct);

module.exports = router;

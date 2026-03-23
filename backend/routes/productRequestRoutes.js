const express = require("express");
const {
  createProductRequest,
  getVendorProductRequests,
  getProductRequestById,
  updateProductRequest,
  cancelProductRequest,
  deleteProductRequest,
  getAllProductRequests,
  getProductRequestByIdAdmin,
  approveProductRequest,
  rejectProductRequest,
  getProductRequestStats,
} = require("../controllers/productRequestController");
const { protect, admin } = require("../middleware/authMiddleware");
const { protectVendor, vendorApproved } = require("../middleware/vendorAuthMiddleware");
const router = express.Router();

// Vendor Routes (Protected - Vendor Only)
router.post("/", protectVendor, vendorApproved, createProductRequest);
router.get("/", protectVendor, vendorApproved, getVendorProductRequests);
router.get("/:id", protectVendor, vendorApproved, getProductRequestById);
router.put("/:id", protectVendor, vendorApproved, updateProductRequest);
router.put("/:id/cancel", protectVendor, vendorApproved, cancelProductRequest);
router.delete("/:id", protectVendor, vendorApproved, deleteProductRequest);

// Admin Routes (Protected - Admin Only)
router.get("/admin/all", protect, admin, getAllProductRequests);
router.get("/admin/:id", protect, admin, getProductRequestByIdAdmin);
router.put("/admin/:id/approve", protect, admin, approveProductRequest);
router.put("/admin/:id/reject", protect, admin, rejectProductRequest);
router.get("/admin/stats", protect, admin, getProductRequestStats);

module.exports = router;
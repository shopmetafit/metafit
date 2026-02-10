const express = require("express");
const { protect, admin, vendor, authorize } = require("../middleware/authMiddleware");
const {
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
  getAllVendors,
  approveVendor,
  rejectVendor,
  getVendorDetails,
} = require("../controllers/vendorController");

const router = express.Router();

// Public routes
router.get("/details/:vendorId", getVendorDetails);

// Protected vendor routes
router.post("/register", protect, registerVendor);
router.get("/profile", protect, authorize("vendor"), getVendorProfile);
router.put("/profile", protect, authorize("vendor"), updateVendorProfile);

// Admin routes
router.get("/", protect, admin, getAllVendors);
router.put("/:vendorId/approve", protect, admin, approveVendor);
router.put("/:vendorId/reject", protect, admin, rejectVendor);

module.exports = router;

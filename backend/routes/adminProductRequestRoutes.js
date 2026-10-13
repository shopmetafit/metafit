const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getAllProductRequests,
  getProductRequestByIdAdmin,
  approveProductRequest,
  rejectProductRequest,
  getProductRequestStats,
} = require("../controllers/productRequestController");

const router = express.Router();

// GET /api/admin/product-requests - list product requests (filters: productId, status, vendorId)
router.get("/", protect, admin, getAllProductRequests);

// GET /api/admin/product-requests/stats - statistics
router.get("/stats", protect, admin, getProductRequestStats);

// GET /api/admin/product-requests/:id - get single product request
router.get("/:id", protect, admin, getProductRequestByIdAdmin);

// PATCH /api/admin/product-requests/:id/status - status change from Partner Dashboard
router.patch("/:id/status", protect, admin, async (req, res) => {
  const { status } = req.body || {};
  if (status === "approved") {
    return approveProductRequest(req, res);
  } else if (status === "rejected") {
    if (!req.body.rejectionReason && !req.body.reason) {
      req.body.rejectionReason = "Rejected by administrator";
    }
    return rejectProductRequest(req, res);
  } else {
    return res.status(400).json({ message: `Invalid status: ${status}. Must be 'approved' or 'rejected'.` });
  }
});

// PUT /api/admin/product-requests/:id/approve - direct approve endpoint
router.put("/:id/approve", protect, admin, approveProductRequest);

// PUT /api/admin/product-requests/:id/reject - direct reject endpoint
router.put("/:id/reject", protect, admin, (req, res) => {
  if (req.body && !req.body.rejectionReason && !req.body.reason) {
    req.body.rejectionReason = "Rejected by administrator";
  }
  return rejectProductRequest(req, res);
});

module.exports = router;

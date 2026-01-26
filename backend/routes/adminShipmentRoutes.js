const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  generateAWB,
  getShippingInfo,
  trackOrder,
  cancelShipment,
  listPendingShipments,
  retryShipmentGeneration,
  updateShippingAddress,
  getShippingError,
} = require("../controllers/bluedart.controller");

const router = express.Router();

/**
 * ========================================
 * ADMIN-ONLY SHIPMENT ROUTES
 * ========================================
 * All routes require:
 * - User authentication (protect middleware)
 * - Admin role (admin middleware)
 */

/**
 * @route GET /api/admin/shipment/pending
 * @desc List all orders pending shipment
 * @access Admin only
 * @returns Paginated list of orders with status "Processing"
 */
router.get("/pending", protect, admin, listPendingShipments);

/**
 * @route POST /api/admin/shipment/:orderId/generate-awb
 * @desc Admin trigger to generate AWB for an order
 * @access Admin only
 * @body {
 *   consigneeName: string (required),
 *   consigneePhone: string (required),
 *   consigneeEmail: string (optional),
 *   weight: string (optional, default: "1")
 * }
 */
router.post("/:orderId/generate-awb", protect, admin, generateAWB);

/**
 * @route POST /api/admin/shipment/:orderId/retry
 * @desc Retry generating AWB for a failed shipment
 * @access Admin only
 * @body {
 *   consigneeName: string (optional - uses existing if not provided),
 *   consigneePhone: string (optional - uses existing if not provided),
 *   consigneeEmail: string (optional - uses existing if not provided),
 *   weight: string (optional)
 * }
 */
router.post("/:orderId/retry", protect, admin, retryShipmentGeneration);

/**
 * @route GET /api/admin/shipment/:orderId
 * @desc Get detailed shipping information for an order
 * @access Admin only
 * @returns Complete shipping details including AWB, status, and errors
 */
router.get("/:orderId", protect, admin, getShippingInfo);

/**
 * @route GET /api/admin/shipment/:orderId/track
 * @desc Get live tracking status from Blue Dart
 * @access Admin only
 */
router.get("/:orderId/track", protect, admin, trackOrder);

/**
 * @route GET /api/admin/shipment/:orderId/error
 * @desc Get shipping error details for troubleshooting
 * @access Admin only
 */
router.get("/:orderId/error", protect, admin, getShippingError);

/**
 * @route PUT /api/admin/shipment/:orderId/address
 * @desc Update shipping address (before AWB generation)
 * @access Admin only
 * @body {
 *   address: string,
 *   city: string,
 *   postalCode: string,
 *   state: string (optional),
 *   country: string (optional, default: "IN")
 * }
 */
router.put("/:orderId/address", protect, admin, updateShippingAddress);

/**
 * @route POST /api/admin/shipment/:orderId/cancel
 * @desc Cancel a shipment (AWB)
 * @access Admin only
 */
router.post("/:orderId/cancel", protect, admin, cancelShipment);

module.exports = router;

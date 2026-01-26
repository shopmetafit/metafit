const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  generateAWB,
  trackOrder,
  cancelShipment,
  getShippingInfo,
} = require("../controllers/bluedart.controller");

const router = express.Router();

/**
 * @route POST /api/shipment/:orderId/generate-awb
 * @desc Generate AWB (Waybill) for an order
 * @access Private (User must own the order)
 */
router.post("/:orderId/generate-awb", protect, generateAWB);

/**
 * @route GET /api/shipment/:orderId/track
 * @desc Get tracking status for an order
 * @access Private
 */
router.get("/:orderId/track", protect, trackOrder);

/**
 * @route GET /api/shipment/:orderId
 * @desc Get shipping information for an order
 * @access Private
 */
router.get("/:orderId", protect, getShippingInfo);

/**
 * @route POST /api/shipment/:orderId/cancel
 * @desc Cancel a shipment
 * @access Private
 */
router.post("/:orderId/cancel", protect, cancelShipment);

module.exports = router;

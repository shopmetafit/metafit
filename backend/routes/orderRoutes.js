const express = require("express");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const { generateInvoicePdfBuffer } = require("../utils/invoiceGenerator");

const router = express.Router();

// @route GET /api/orders/my-orders
// @desc Get logged-in user's orders
// @access Private
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching my-orders:", error);
    res.status(500).json({ message: "Server error fetching orders" });
  }
});

// @route GET /api/orders/:id/invoice
// @desc Download order PDF invoice
// @access Private
router.get("/:id/invoice", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Security ownership check: verify authenticated user owns order (or is admin)
    const isOwner = order.user && order.user._id
      ? order.user._id.toString() === req.user._id.toString()
      : order.user
      ? order.user.toString() === req.user._id.toString()
      : false;

    const isAdmin = req.user && String(req.user.role).toLowerCase() === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this invoice" });
    }

    const pdfBuffer = generateInvoicePdfBuffer(order);
    const fileName = `M-Wellness-Bazaar-Invoice-${order.orderNumber || order._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ message: "Unable to generate invoice. Please try again." });
  }
});

// @route GET /api/orders/:id
// @desc Get order details by ID
// @access Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner = order.user && order.user._id
      ? order.user._id.toString() === req.user._id.toString()
      : order.user
      ? order.user.toString() === req.user._id.toString()
      : false;

    const isAdmin = req.user && String(req.user.role).toLowerCase() === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Server error fetching order details" });
  }
});

module.exports = router;

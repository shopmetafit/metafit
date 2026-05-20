const express = require("express");
const ReferralAssignment = require("../models/ReferralAssignment");
const ReferralPurchase = require("../models/ReferralPurchase");
const { protectVendor, vendorApproved } = require("../middleware/vendorAuthMiddleware");
const { processReferralPurchase } = require("../utils/referralUtils");

const router = express.Router();

router.post("/purchases", async (req, res) => {
  try {
    const result = await processReferralPurchase(req.body || {});

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(result.duplicate ? 200 : 201).json({
      success: true,
      duplicate: result.duplicate,
      purchase: result.purchase,
    });
  } catch (error) {
    console.error("Error receiving referral purchase", error);
    res.status(500).json({ success: false, message: "Failed to process referral purchase" });
  }
});

router.get("/vendor/dashboard", protectVendor, vendorApproved, async (req, res) => {
  try {
    const vendorId = req.user._id;

    const [summaryRows, recentSales, activeLinks] = await Promise.all([
      ReferralPurchase.aggregate([
        { $match: { vendorId } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$orderAmount" },
            totalCommission: { $sum: "$commissionAmount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
      ReferralPurchase.find({ vendorId })
        .populate("productId", "name sku")
        .sort({ createdAt: -1 })
        .limit(10),
      ReferralAssignment.countDocuments({ vendorId, isActive: true }),
    ]);

    res.json({
      success: true,
      summary: summaryRows[0] || {
        totalSales: 0,
        totalCommission: 0,
        totalOrders: 0,
      },
      activeLinks,
      recentSales,
    });
  } catch (error) {
    console.error("Error fetching vendor referral dashboard", error);
    res.status(500).json({ success: false, message: "Failed to fetch referral dashboard" });
  }
});

router.get("/vendor/shared-products", protectVendor, vendorApproved, async (req, res) => {
  try {
    const assignments = await ReferralAssignment.find({ vendorId: req.user._id })
      .populate("productId", "name sku discountPrice price")
      .sort({ createdAt: -1 });

    res.json({ success: true, assignments });
  } catch (error) {
    console.error("Error fetching shared products", error);
    res.status(500).json({ success: false, message: "Failed to fetch shared products" });
  }
});

module.exports = router;

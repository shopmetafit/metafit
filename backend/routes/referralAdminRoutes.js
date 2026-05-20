const express = require("express");
const ReferralAssignment = require("../models/ReferralAssignment");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/referral-assignments", protect, admin, async (req, res) => {
  try {
    const {
      productId,
      vendorId,
      assignedProductId,
      shareCode,
      refCode,
      commissionType,
      commissionValue,
      isActive,
    } = req.body;

    const assignment = await ReferralAssignment.findOneAndUpdate(
      {
        productId,
        vendorId,
        assignedProductId: String(assignedProductId || "").trim(),
      },
      {
        productId,
        vendorId,
        assignedProductId: String(assignedProductId || "").trim(),
        shareCode: String(shareCode || "").trim().toUpperCase(),
        refCode: refCode ? String(refCode).trim().toUpperCase() : undefined,
        commissionType,
        commissionValue: Number(commissionValue),
        isActive: isActive !== false,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json(assignment);
  } catch (error) {
    console.error("Error creating referral assignment", error);
    res.status(500).json({
      message: error.code === 11000
        ? "Share code, ref code, or assignment already exists"
        : "Failed to create referral assignment",
    });
  }
});

router.get("/referral-assignments", protect, admin, async (req, res) => {
  try {
    const { productId, vendorId } = req.query;
    const query = {};

    if (productId) query.productId = productId;
    if (vendorId) query.vendorId = vendorId;

    const assignments = await ReferralAssignment.find(query)
      .populate("productId", "name sku discountPrice price")
      .populate("vendorId", "vendorName businessName email phone")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching referral assignments", error);
    res.status(500).json({ message: "Failed to fetch referral assignments" });
  }
});

module.exports = router;

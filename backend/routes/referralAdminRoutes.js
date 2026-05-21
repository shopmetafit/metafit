const express = require("express");
const ReferralAssignment = require("../models/ReferralAssignment");
const ReferralPurchase = require("../models/ReferralPurchase");
const Vendor = require("../models/Vendor");
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

router.patch("/referral-assignments/:id/status", protect, admin, async (req, res) => {
  try {
    const { isActive } = req.body;

    const assignment = await ReferralAssignment.findByIdAndUpdate(
      req.params.id,
      { isActive: isActive !== false },
      { new: true }
    )
      .populate("productId", "name sku discountPrice price")
      .populate("vendorId", "vendorName businessName email phone");

    if (!assignment) {
      return res.status(404).json({ message: "Referral assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    console.error("Error updating referral assignment status", error);
    res.status(500).json({ message: "Failed to update referral assignment status" });
  }
});

router.get("/vendors", protect, admin, async (req, res) => {
  try {
    const vendors = await Vendor.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors", error);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
});

router.get("/referrals/purchases", protect, admin, async (req, res) => {
  try {
    const { vendorId, productId, shareCode } = req.query;
    const query = {};

    if (vendorId) query.vendorId = vendorId;
    if (productId) query.productId = productId;
    if (shareCode) query.shareCode = String(shareCode).trim().toUpperCase();

    const purchases = await ReferralPurchase.find(query)
      .populate("vendorId", "vendorName businessName email phone")
      .populate("productId", "name sku")
      .populate("assignmentId", "assignedProductId shareCode commissionType commissionValue")
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (error) {
    console.error("Error fetching referral purchases", error);
    res.status(500).json({ message: "Failed to fetch referral purchases" });
  }
});

router.get("/vendor-commissions", protect, admin, async (req, res) => {
  try {
    const commissions = await ReferralPurchase.aggregate([
      {
        $group: {
          _id: "$vendorId",
          totalOrders: { $sum: 1 },
          totalSales: { $sum: "$orderAmount" },
          totalCommission: { $sum: "$commissionAmount" },
        },
      },
      {
        $lookup: {
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      {
        $unwind: {
          path: "$vendor",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          vendorId: "$_id",
          vendorName: "$vendor.vendorName",
          businessName: "$vendor.businessName",
          email: "$vendor.email",
          phone: "$vendor.phone",
          totalOrders: 1,
          totalSales: 1,
          totalCommission: 1,
        },
      },
      { $sort: { totalCommission: -1, totalSales: -1 } },
    ]);

    res.json(commissions);
  } catch (error) {
    console.error("Error fetching vendor commissions", error);
    res.status(500).json({ message: "Failed to fetch vendor commissions" });
  }
});

router.get("/referral-sales", protect, admin, async (req, res) => {
  try {
    const summary = await ReferralPurchase.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: "$orderAmount" },
          totalCommission: { $sum: "$commissionAmount" },
        },
      },
    ]);

    const latestSales = await ReferralPurchase.find({})
      .populate("vendorId", "vendorName businessName")
      .populate("productId", "name sku")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      summary: summary[0] || {
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0,
      },
      sales: latestSales,
    });
  } catch (error) {
    console.error("Error fetching referral sales", error);
    res.status(500).json({ message: "Failed to fetch referral sales" });
  }
});

module.exports = router;

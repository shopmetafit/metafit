const express = require("express");
const mongoose = require("mongoose");
const ReferralAssignment = require("../models/ReferralAssignment");
const ReferralPurchase = require("../models/ReferralPurchase");
const { protectVendor, vendorApproved } = require("../middleware/vendorAuthMiddleware");
const { processReferralPurchase } = require("../utils/referralUtils");

const { fetchProductsByIds } = require("../utils/productDataAccess");

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
    const vendorId = req.user.vendorId || req.user.mentorId || req.user._id;
    const vendorIdStr = String(vendorId);
    const isMongoId = mongoose.Types.ObjectId.isValid(vendorIdStr);

    const vendorMatch = isMongoId
      ? { $or: [{ vendorId: new mongoose.Types.ObjectId(vendorIdStr) }, { externalVendorId: vendorIdStr }] }
      : { externalVendorId: vendorIdStr };

    const vendorQuery = isMongoId
      ? { $or: [{ vendorId: vendorIdStr }, { externalVendorId: vendorIdStr }] }
      : { externalVendorId: vendorIdStr };

    const activeLinksQuery = isMongoId
      ? { $or: [{ vendorId: vendorIdStr }, { externalVendorId: vendorIdStr }], isActive: true }
      : { externalVendorId: vendorIdStr, isActive: true };

    const [summaryRows, recentSales, activeLinks] = await Promise.all([
      ReferralPurchase.aggregate([
        { $match: vendorMatch },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$orderAmount" },
            totalCommission: { $sum: "$commissionAmount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
      ReferralPurchase.find(vendorQuery)
        .populate("productId", "name sku")
        .sort({ createdAt: -1 })
        .limit(10),
      ReferralAssignment.countDocuments(activeLinksQuery),
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
    const vendorId = req.user.vendorId || req.user.mentorId || req.user._id;
    const vendorIdStr = String(vendorId);
    const isMongoId = mongoose.Types.ObjectId.isValid(vendorIdStr);

    const vendorQuery = isMongoId
      ? { $or: [{ vendorId: vendorIdStr }, { externalVendorId: vendorIdStr }] }
      : { externalVendorId: vendorIdStr };

    const assignments = await ReferralAssignment.find(vendorQuery)
      .populate("productId", "name sku discountPrice price")
      .sort({ createdAt: -1 });

    const globalAssignments = await ReferralAssignment.find({
      $or: [{ isAssignedToAll: true }, { isAssignToAll: true }],
      isActive: true,
    }).lean();

    const existingProductIds = new Set(assignments.map(a => String(a.productId?._id || a.productId)));

    for (const globalAssign of globalAssignments) {
      const pIdStr = String(globalAssign.productId);
      if (pIdStr && !existingProductIds.has(pIdStr)) {
        const vendorIdSuffix = vendorIdStr.slice(-6).toUpperCase();
        const prodIdSuffix = pIdStr.slice(-6).toUpperCase();
        const newAssignedProductId = `VP-${vendorIdSuffix}-${prodIdSuffix}`;
        const newShareCode = `REF-${vendorIdSuffix}-${prodIdSuffix}`;

        try {
          const created = await ReferralAssignment.findOneAndUpdate(
            {
              productId: globalAssign.productId,
              ...(isMongoId ? { vendorId: new mongoose.Types.ObjectId(vendorIdStr) } : { externalVendorId: vendorIdStr }),
            },
            {
              $set: {
                assignedProductId: newAssignedProductId,
                shareCode: newShareCode,
                commissionType: globalAssign.commissionType || "percentage",
                commissionValue: globalAssign.commissionValue || 10,
                isActive: true,
                isAssignedToAll: true,
                isAssignToAll: true,
                assignmentStatus: "assigned",
              }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).populate("productId", "name sku discountPrice price");

          if (created && created.productId) {
            assignments.push(created);
            existingProductIds.add(pIdStr);
          }
        } catch (e) {
          // Ignore duplicate key race conditions
        }
      }
    }

    res.json({ success: true, assignments });
  } catch (error) {
    console.error("Error fetching shared products", error);
    res.status(500).json({ success: false, message: "Failed to fetch shared products" });
  }
});

router.get("/vendor/purchases", protectVendor, vendorApproved, async (req, res) => {
  try {
    const vendorId = req.user.vendorId || req.user.mentorId || req.user._id;
    const vendorIdStr = String(vendorId);
    const isMongoId = mongoose.Types.ObjectId.isValid(vendorIdStr);

    const query = isMongoId
      ? { $or: [{ vendorId: vendorIdStr }, { externalVendorId: vendorIdStr }] }
      : { externalVendorId: vendorIdStr };

    const purchases = await ReferralPurchase.find(query)
      .populate("assignmentId", "assignedProductId shareCode commissionType commissionValue")
      .sort({ createdAt: -1 });

    const productMap = await fetchProductsByIds(purchases.map((purchase) => purchase.productId));
    const hydratedPurchases = purchases.map((purchase) => {
      const purchaseObject = purchase.toObject();
      purchaseObject.productId = productMap.get(String(purchase.productId)) || purchase.productId;
      return purchaseObject;
    });

    res.json({ success: true, purchases: hydratedPurchases });
  } catch (error) {
    console.error("Error fetching vendor referral purchases", error);
    res.status(500).json({ success: false, message: "Failed to fetch referral purchases" });
  }
});

module.exports = router;

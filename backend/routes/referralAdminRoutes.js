const express = require("express");
const axios = require("axios");
const ReferralAssignment = require("../models/ReferralAssignment");
const ReferralPurchase = require("../models/ReferralPurchase");
const Vendor = require("../models/Vendor");
const { protect, admin } = require("../middleware/authMiddleware");
const { fetchProductsByIds } = require("../utils/productDataAccess");
const mongoose = require("mongoose");

const router = express.Router();

const normalizeCodeSegment = (value, fallback) => {
  const normalized = String(value || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  return normalized || fallback;
};

const buildBulkCode = (prefix, vendorId, productId) => {
  const vendorPart = normalizeCodeSegment(vendorId, "VEND").slice(-4);
  const productPart = normalizeCodeSegment(productId, "PROD").slice(-4);
  return `${prefix}-${vendorPart}-${productPart}`;
};

const buildVendorSnapshot = (payload = {}) => ({
  mentorId: String(payload.vendorId || payload.mentorId || "").trim(),
  name: String(payload.vendorName || payload.name || "").trim(),
  email: String(payload.vendorEmail || payload.email || "")
    .trim()
    .toLowerCase(),
  phone: String(payload.vendorPhone || payload.phone || "").trim(),
  role: String(payload.vendorRole || payload.role || "").trim(),
});

const DEFAULT_METAFIT_ADMIN_API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://metafit-services.vercel.app/admin/api/v1"
    : "http://localhost:5001/admin/api/v2";

const METAFIT_ADMIN_API_BASE_URL =
  (process.env.METAFIT_ADMIN_API_BASE_URL || DEFAULT_METAFIT_ADMIN_API_BASE_URL).replace(/\/+$/, "");

const allowedExternalVendorRoles = new Set([
  "yoga instructor",
  "ayurvedic doctor",
  "lab test",
  "treatment and retreat",
  "treatment & retreat",
  "naturopathy and wellness",
  "naturopathy doctor",
  "naturopathy",
]);

const normalizeExternalVendor = (vendor = {}) => {
  const vendorId = String(vendor.mentorId || vendor._id || vendor.id || "").trim();
  const role = String(vendor.role || vendor.vendorRole || "").trim();

  return {
    id: vendorId,
    vendorId,
    mentorId: vendorId,
    name:
      String(
        vendor.vendorName ||
          vendor.businessName ||
          `${vendor.firstname || ""} ${vendor.lastname || ""}`.trim() ||
          vendor.name ||
          "Unnamed Vendor"
      ).trim(),
    email: String(vendor.useremail || vendor.email || "").trim().toLowerCase(),
    phone: String(vendor.phone || vendor.phoneNo || vendor.mobile || "").trim(),
    role,
    status: String(vendor.status || (vendor.isApproved === false ? "pending" : "approved")).trim(),
  };
};

const extractExternalRecords = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    return (
      payload.data ||
      payload.vendors ||
      payload.records ||
      payload.items ||
      []
    );
  }

  return [];
};

const fetchMetafitVendors = async (authorizationHeader = "") => {
  const requestConfig = {
    headers: authorizationHeader ? { Authorization: authorizationHeader } : {},
    timeout: 5000,
  };

  const [instructorsResponse, naturopathyResponse] = await Promise.allSettled([
    axios.get(`${METAFIT_ADMIN_API_BASE_URL}/all-instructor`, requestConfig),
    axios.get(`${METAFIT_ADMIN_API_BASE_URL}/admin/naturopathy-vendors`, requestConfig),
  ]);

  const records = [];

  if (instructorsResponse.status === "fulfilled") {
    const instructors = extractExternalRecords(instructorsResponse.value.data);
    if (Array.isArray(instructors)) {
      records.push(...instructors);
    }
  }

  if (naturopathyResponse.status === "fulfilled") {
    const vendors = extractExternalRecords(naturopathyResponse.value.data);

    if (Array.isArray(vendors)) {
      records.push(...vendors);
    }
  }

  const seen = new Set();

  return records
    .map(normalizeExternalVendor)
    .filter((vendor) => vendor.vendorId && allowedExternalVendorRoles.has(vendor.role.toLowerCase()))
    .filter((vendor) => {
      const key = vendor.vendorId.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
};

const resolveAssignmentVendorFields = (payload = {}) => {
  const rawVendorId = String(payload.vendorId || "").trim();
  const snapshot = buildVendorSnapshot(payload);

  if (mongoose.Types.ObjectId.isValid(rawVendorId)) {
    return {
      vendorId: rawVendorId,
      externalVendorId: snapshot.mentorId || "",
      vendorSnapshot: snapshot,
    };
  }

  return {
    vendorId: null,
    externalVendorId: rawVendorId,
    vendorSnapshot: {
      ...snapshot,
      mentorId: snapshot.mentorId || rawVendorId,
    },
  };
};

const buildAssignmentLookup = ({ productId, vendorId, externalVendorId, assignedProductId }) => {
  const lookup = {
    productId,
    assignedProductId: String(assignedProductId || "").trim(),
  };

  if (vendorId) {
    lookup.vendorId = vendorId;
  } else {
    lookup.externalVendorId = externalVendorId;
  }

  return lookup;
};

const hydrateAssignmentVendor = (assignmentObject) => {
  const populatedVendor =
    assignmentObject.vendorId && typeof assignmentObject.vendorId === "object"
      ? assignmentObject.vendorId
      : null;
  const snapshot = assignmentObject.vendorSnapshot || {};

  assignmentObject.vendor = {
    id:
      assignmentObject.externalVendorId ||
      populatedVendor?._id ||
      assignmentObject.vendorId ||
      snapshot.mentorId ||
      "",
    vendorId:
      assignmentObject.externalVendorId ||
      snapshot.mentorId ||
      populatedVendor?._id ||
      assignmentObject.vendorId ||
      "",
    mentorId: snapshot.mentorId || assignmentObject.externalVendorId || "",
    name:
      snapshot.name ||
      populatedVendor?.vendorName ||
      populatedVendor?.businessName ||
      "Unnamed Vendor",
    email: snapshot.email || populatedVendor?.email || "",
    phone: snapshot.phone || populatedVendor?.phone || "",
    role: snapshot.role || "",
  };

  assignmentObject.vendorId =
    assignmentObject.externalVendorId ||
    snapshot.mentorId ||
    populatedVendor?._id ||
    assignmentObject.vendorId ||
    "";

  return assignmentObject;
};

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
    const vendorFields = resolveAssignmentVendorFields(req.body);

    const assignment = await ReferralAssignment.findOneAndUpdate(
      buildAssignmentLookup({
        productId,
        vendorId: vendorFields.vendorId,
        externalVendorId: vendorFields.externalVendorId,
        assignedProductId,
      }),
      {
        productId,
        vendorId: vendorFields.vendorId,
        externalVendorId: vendorFields.externalVendorId,
        vendorSnapshot: vendorFields.vendorSnapshot,
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

    const assignmentObject = hydrateAssignmentVendor(assignment.toObject());
    res.status(201).json(assignmentObject);
  } catch (error) {
    console.error("Error creating referral assignment", error);
    res.status(500).json({
      message: error.code === 11000
        ? "Share code, ref code, or assignment already exists"
        : "Failed to create referral assignment",
    });
  }
});

router.post("/referral-assignments/bulk", protect, admin, async (req, res) => {
  try {
    const {
      productId,
      commissionType,
      commissionValue,
      isActive,
      shareCodePrefix,
      assignedProductPrefix,
      refCodePrefix,
      vendors: requestedVendors,
    } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    if (!Number.isFinite(Number(commissionValue)) || Number(commissionValue) < 0) {
      return res.status(400).json({ message: "Valid commission value is required" });
    }

    const normalizedCommissionType =
      String(commissionType || "").toLowerCase() === "flat" ? "fixed" : commissionType;

    const vendors = Array.isArray(requestedVendors) && requestedVendors.length
      ? requestedVendors
      : await fetchMetafitVendors(req.headers.authorization || "");

    if (!vendors.length) {
      return res.status(404).json({ message: "No vendors found for bulk assignment" });
    }

    const assignments = await Promise.all(
      vendors.map(async (vendor) => {
        const vendorRef = String(vendor.vendorId || vendor.mentorId || vendor._id || vendor.id || "").trim();
        const vendorFields = resolveAssignmentVendorFields({
          vendorId: vendorRef,
          vendorName: vendor.vendorName || vendor.businessName || vendor.name,
          vendorEmail: vendor.email || vendor.useremail,
          vendorPhone: vendor.phone || vendor.phoneNo,
          vendorRole: vendor.role,
        });
        const assignedProductId =
          buildBulkCode(assignedProductPrefix || "AP", vendorRef, productId);
        const shareCode = buildBulkCode(shareCodePrefix || "MWREF", vendorRef, productId);
        const refCode = buildBulkCode(refCodePrefix || "REF", vendorRef, productId);

        const assignment = await ReferralAssignment.findOneAndUpdate(
          buildAssignmentLookup({
            productId,
            vendorId: vendorFields.vendorId,
            externalVendorId: vendorFields.externalVendorId,
            assignedProductId,
          }),
          {
            productId,
            vendorId: vendorFields.vendorId,
            externalVendorId: vendorFields.externalVendorId,
            vendorSnapshot: vendorFields.vendorSnapshot,
            assignedProductId,
            shareCode,
            refCode,
            commissionType: normalizedCommissionType,
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

        return hydrateAssignmentVendor(assignment.toObject());
      })
    );

    res.status(201).json({
      message: `${assignments.length} vendors ko assignment create ho gaya`,
      totalAssigned: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Error creating bulk referral assignments", error);
    res.status(500).json({
      message:
        error.code === 11000
          ? "Bulk assignment me duplicate share code/ref code mila"
          : "Failed to create bulk referral assignments",
    });
  }
});

router.get("/referral-assignments", protect, admin, async (req, res) => {
  try {
    const { productId, vendorId } = req.query;
    const query = {};

    if (productId) query.productId = productId;
    if (vendorId) {
      if (mongoose.Types.ObjectId.isValid(String(vendorId))) {
        query.$or = [{ vendorId: String(vendorId) }, { externalVendorId: String(vendorId) }];
      } else {
        query.externalVendorId = String(vendorId);
      }
    }

    const assignments = await ReferralAssignment.find(query)
      .populate("vendorId", "vendorName businessName email phone")
      .sort({ createdAt: -1 });

    const productMap = await fetchProductsByIds(assignments.map((assignment) => assignment.productId));
    const hydratedAssignments = assignments.map((assignment) => {
      const assignmentObject = hydrateAssignmentVendor(assignment.toObject());
      assignmentObject.productId = productMap.get(String(assignment.productId)) || assignment.productId;
      return assignmentObject;
    });

    res.json(hydratedAssignments);
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
      .populate("vendorId", "vendorName businessName email phone");

    if (!assignment) {
      return res.status(404).json({ message: "Referral assignment not found" });
    }

    const productMap = await fetchProductsByIds([assignment.productId]);
    const assignmentObject = hydrateAssignmentVendor(assignment.toObject());
    assignmentObject.productId = productMap.get(String(assignment.productId)) || assignment.productId;

    res.json(assignmentObject);
  } catch (error) {
    console.error("Error updating referral assignment status", error);
    res.status(500).json({ message: "Failed to update referral assignment status" });
  }
});

router.get("/vendors", protect, admin, async (req, res) => {
  try {
    const vendors = await fetchMetafitVendors(req.headers.authorization || "");

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
      .populate("assignmentId", "assignedProductId shareCode commissionType commissionValue")
      .sort({ createdAt: -1 });

    const productMap = await fetchProductsByIds(purchases.map((purchase) => purchase.productId));
    const hydratedPurchases = purchases.map((purchase) => {
      const purchaseObject = purchase.toObject();
      purchaseObject.productId = productMap.get(String(purchase.productId)) || purchase.productId;
      return purchaseObject;
    });

    res.json(hydratedPurchases);
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
      .sort({ createdAt: -1 })
      .limit(20);

    const productMap = await fetchProductsByIds(latestSales.map((sale) => sale.productId));
    const hydratedSales = latestSales.map((sale) => {
      const saleObject = sale.toObject();
      saleObject.productId = productMap.get(String(sale.productId)) || sale.productId;
      return saleObject;
    });

    res.json({
      summary: summary[0] || {
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0,
      },
      sales: hydratedSales,
    });
  } catch (error) {
    console.error("Error fetching referral sales", error);
    res.status(500).json({ message: "Failed to fetch referral sales" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();

const { registerVendor, loginVendor, loginVendorWithOTP } = require("../controllers/vendorController");
const { sendOtpController, verifyOtpController } = require("../controllers/otpController");
const { protectVendor, vendorApproved } = require("../middleware/vendorAuthMiddleware");
const { protect } = require("../middleware/authMiddleware");
const ReferralAssignment = require("../models/ReferralAssignment");
const Vendor = require("../models/Vendor");
const { fetchProductsByIds } = require("../utils/productDataAccess");
const mongoose = require("mongoose");

const buildShareUrl = (productId, vendorId, assignedProductId, shareCode) => {
  const baseUrl =
    process.env.MWELLNESS_FRONTEND_URL ||
    process.env.FRONTEND_URL ||
    "https://mwellnessbazaar.com";

  const params = new URLSearchParams({
    vendorId: String(vendorId),
    assignedProductId: String(assignedProductId),
    ref: String(shareCode),
  });

  return `${baseUrl.replace(/\/$/, "")}/product/${productId}?${params.toString()}`;
};

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

// REGISTER ROUTE
router.post("/register", registerVendor);

// LOGIN ROUTE
router.post("/login", loginVendor);

// VENDOR OTP LOGIN ROUTE
router.post("/login-otp", loginVendorWithOTP);

// Check if phone number exists
router.post("/check-vendor-phone", async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number is required" 
      });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, "");
    const fullPhone = normalizedPhone.length === 10 ? "91" + normalizedPhone : normalizedPhone;

    // Check if vendor already exists with this phone
    const Vendor = require("../models/Vendor");
    const existingVendor = await Vendor.findOne({ phone: fullPhone });

    if (existingVendor) {
      return res.json({ 
        success: true, 
        exists: true, 
        vendor: {
          businessName: existingVendor.businessName,
          vendorName: existingVendor.vendorName,
          email: existingVendor.email,
          status: existingVendor.status
        }
      });
    }

    res.json({ success: true, exists: false });
  } catch (error) {
    console.error("Error checking vendor phone:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error checking phone number" 
    });
  }
});

// Send OTP to phone (using same logic as user registration)
router.post("/send-otp", sendOtpController);

// Verify OTP (using same logic as user registration)
router.post("/verify-otp", verifyOtpController);

// Update vendor onboarding progress
router.post("/update-vendor-onboarding", async (req, res) => {
  try {
    const { phone, step, formData } = req.body;
    
    if (!phone || !step) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone and step are required" 
      });
    }

    // This would typically save progress to a temporary storage
    // For now, we'll just return success
    res.json({ 
      success: true, 
      message: "Progress saved successfully",
      step,
      phone: phone.replace(/\D/g, "").length === 10 ? "91" + phone.replace(/\D/g, "") : phone
    });
  } catch (error) {
    console.error("Error saving vendor onboarding progress:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error saving progress" 
    });
  }
});

// Get pending vendors for approval
router.get("/pending-vendors", async (req, res) => {
  try {
    const Vendor = require("../models/Vendor");
    const vendors = await Vendor.find({ status: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      vendors
    });
  } catch (error) {
    console.error("Error fetching pending vendors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending vendors"
    });
  }
});

// Approve vendor
router.post("/approve-vendor/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const Vendor = require("../models/Vendor");

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    vendor.status = "approved";
    vendor.approvedAt = new Date();
    await vendor.save();

    res.json({
      success: true,
      message: "Vendor approved successfully",
      vendor
    });
  } catch (error) {
    console.error("Error approving vendor:", error);
    res.status(500).json({
      success: false,
      message: "Error approving vendor"
    });
  }
});

// Reject vendor
router.post("/reject-vendor/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const Vendor = require("../models/Vendor");

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    vendor.status = "rejected";
    vendor.rejectedAt = new Date();
    vendor.rejectionReason = reason;
    await vendor.save();

    res.json({
      success: true,
      message: "Vendor rejected successfully",
      vendor
    });
  } catch (error) {
    console.error("Error rejecting vendor:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting vendor"
    });
  }
});

// Get all vendors (for admin dashboard)
router.get("/all-vendors", async (req, res) => {
  try {
    const Vendor = require("../models/Vendor");
    const vendors = await Vendor.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      vendors
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendors"
    });
  }
});

// Get vendor products (for vendor dashboard)
router.get("/products", protectVendor, vendorApproved, async (req, res) => {
  try {
    const Product = require("../models/Product");
    
    // For now, return all products since we don't have vendor association
    // In a full implementation, this would filter by vendor ID
    const products = await Product.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendor products"
    });
  }
});

const resolveAuthorizedVendorIds = (user) => {
  if (!user || typeof user !== "object") {
    return [];
  }

  return Array.from(
    new Set(
      [
        user.vendorId,
        user.mentorId,
        user.userId,
        user.id,
        user._id,
      ]
        .filter(Boolean)
        .map((value) => String(value))
    )
  );
};

const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

const resolveAssignmentVendorId = async (requestedVendorId, user) => {
  if (requestedVendorId && mongoose.Types.ObjectId.isValid(requestedVendorId)) {
    return requestedVendorId;
  }

  const candidatePhones = [
    user?.phone,
    user?.mobile,
    user?.phoneNo,
  ]
    .map(normalizePhone)
    .filter(Boolean);

  const phoneQueries = candidatePhones.flatMap((phone) => {
    const queries = [{ phone }];
    if (phone.length === 10) {
      queries.push({ phone: `91${phone}` });
    }
    if (phone.length === 12 && phone.startsWith("91")) {
      queries.push({ phone: phone.slice(2) });
    }
    return queries;
  });

  const vendor = await Vendor.findOne({
    $or: [
      ...(user?.email
        ? [{ email: new RegExp(`^${String(user.email).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }]
        : []),
      ...phoneQueries,
    ],
  }).select("_id");
  return vendor ? String(vendor._id) : null;
};

// Get products assigned to the logged-in vendor with commission + share URL
router.get("/assigned-products", async (req, res) => {
  try {
    // Try to optionally authenticate the user if token is present
    let user = null;
    const authHeader = req.headers.authorization;
    const xAuthToken = req.headers["x-auth-token"];
    const token = (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) || xAuthToken;

    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const User = require("../models/User");

        // 1. Try local user
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded?.user?.id || decoded?.id;
          if (userId) {
            user = await User.findById(userId).select("-password");
          }
        } catch (localErr) {
          // ignore and try external
        }

        // 2. Try external jwt
        if (!user) {
          const EXTERNAL_ADMIN_JWT_SECRETS = [
            process.env.METAFIT_ADMIN_SECRET_KEY,
            process.env.SECRET_KEY,
            "your_secret_key",
          ].filter(Boolean);

          for (const secret of EXTERNAL_ADMIN_JWT_SECRETS) {
            try {
              const decoded = jwt.verify(token, secret);
              const rawUser = {
                _id: decoded.id || decoded._id || decoded.userId || decoded.mentorId || null,
                id: decoded.id || decoded._id || null,
                userId: decoded.userId || null,
                mentorId: decoded.mentorId || null,
                email: decoded.email || null,
                name: decoded.name || decoded.fullName || "External Admin",
                role: decoded.role || decoded.userRole || decoded.accountType || null,
              };
              if (rawUser._id) {
                const role = String(rawUser.role || "").toLowerCase();
                user = {
                  _id: rawUser._id,
                  id: rawUser.id,
                  mentorId: rawUser.mentorId,
                  userId: rawUser.userId,
                  vendorId: rawUser.mentorId,
                  name: rawUser.name,
                  email: rawUser.email,
                  role,
                  externalAuth: true,
                };
                break;
              }
            } catch (err) {
              // try next
            }
          }
        }

        // 3. Try external verify URL
        if (!user) {
          const axios = require("axios");
          const DEFAULT_EXTERNAL_ADMIN_BASE_URL =
            process.env.NODE_ENV === "production"
              ? "https://metafitwellness.com/admin/api/v2"
              : "http://localhost:5001/admin/api/v2";
          const EXTERNAL_ADMIN_VERIFY_URL = process.env.EXTERNAL_ADMIN_VERIFY_URL || `${DEFAULT_EXTERNAL_ADMIN_BASE_URL}/verify-admin-details`;

          const response = await axios.post(EXTERNAL_ADMIN_VERIFY_URL, {}, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
          });
          const data = response.data || {};
          if (data.userId || data.mentorId || data.id) {
            user = {
              _id: data.mentorId || data.userId || data.id,
              id: data.id || data.userId || null,
              mentorId: data.mentorId || null,
              email: data.email || null,
              role: data.role || data.userRole || null,
              name: data.name || "External User"
            };
          }
        }
      } catch (authError) {
        console.error("Optional auth error in /assigned-products:", authError);
      }
    }

    const requestedVendorId = String(
      req.query.vendorId ||
        (user && (user.vendorId || user.mentorId || user.userId || user.id || user._id)) ||
        ""
    ).trim();

    // PUBLIC FALLBACK: If requestedVendorId is not provided, fetch all products where isAssignedToAll is true
    if (!requestedVendorId) {
      const Product = require("../models/Product");
      const globalProducts = await Product.find({ isAssignedToAll: true });

      const productIds = globalProducts.map((p) => String(p._id));
      const existingAssignments = await ReferralAssignment.find({
        productId: { $in: productIds },
        assignmentStatus: "assigned",
        isActive: true,
      }).select("productId commissionType commissionValue").lean();

      const assignmentTemplateMap = new Map();
      for (const assignment of existingAssignments) {
        const prodIdStr = String(assignment.productId);
        if (!assignmentTemplateMap.has(prodIdStr)) {
          assignmentTemplateMap.set(prodIdStr, {
            commissionType: assignment.commissionType,
            commissionValue: assignment.commissionValue,
          });
        }
      }

      const assignedProducts = globalProducts.map((product) => {
        const prodId = String(product._id);
        const template = assignmentTemplateMap.get(prodId) || {
          commissionType: "percentage",
          commissionValue: 10,
        };

        return {
          _id: prodId,
          product: product,
          vendorId: "",
          commission: {
            type: template.commissionType,
            value: template.commissionValue,
          },
          shareCode: "",
          refCode: "",
          assignedProductId: "",
          isActive: true,
          isAssignedToAll: true,
          shareUrl: "",
        };
      });

      return res.json({
        success: true,
        assignedProducts,
      });
    }

    // Otherwise, continue with vendor-specific assignment fetch
    const authorizedVendorIds = user ? resolveAuthorizedVendorIds(user) : [];
    const isAdmin = user && String(user.role || "").toLowerCase() === "admin";

    // Perform authorization check only if a user session is active (to prevent breaking public clients querying a vendor store)
    if (user && !isAdmin && !authorizedVendorIds.includes(requestedVendorId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this vendor",
      });
    }

    const assignmentVendorId = await resolveAssignmentVendorId(requestedVendorId, user);

    const assignmentQuery = {
      isActive: true,
      $or: [
        { externalVendorId: requestedVendorId },
        { "vendorSnapshot.mentorId": requestedVendorId },
      ],
    };

    if (assignmentVendorId) {
      assignmentQuery.$or.push({ vendorId: assignmentVendorId });
    }

    let assignments = await ReferralAssignment.find(assignmentQuery)
      .sort({ createdAt: -1 });

    // Lazy Auto-Assign: Fetch globally assigned products
    try {
      const Product = require("../models/Product");
      const globalProducts = await Product.find({ isAssignedToAll: true });

      if (globalProducts.length > 0) {
        // Find which global products the vendor doesn't have an assignment for yet
        const existingProductIds = new Set(assignments.map(a => String(a.productId)));
        const missingGlobalProducts = globalProducts.filter(p => !existingProductIds.has(String(p._id)));

        if (missingGlobalProducts.length > 0) {
          // Resolve vendor information to build snapshot
          let vendorInfo = null;
          if (mongoose.Types.ObjectId.isValid(requestedVendorId)) {
            vendorInfo = await Vendor.findById(requestedVendorId).lean();
          } else {
            vendorInfo = await Vendor.findOne({
              $or: [{ vendorId: requestedVendorId }, { externalVendorId: requestedVendorId }]
            }).lean();
          }

          const vendorSnapshotObj = {
            mentorId: requestedVendorId,
            name: vendorInfo?.vendorName || vendorInfo?.businessName || (user?.name || "Partner"),
            email: vendorInfo?.email || (user?.email || ""),
            phone: vendorInfo?.phone || (user?.phone || ""),
            role: vendorInfo?.role || (user?.role || "vendor"),
          };

          // Find existing assignments for these products to use as a template for commission details
          const productIds = missingGlobalProducts.map((p) => String(p._id));
          const existingAssignments = await ReferralAssignment.find({
            productId: { $in: productIds },
            assignmentStatus: "assigned",
            isActive: true,
          }).select("productId commissionType commissionValue").lean();

          const assignmentTemplateMap = new Map();
          for (const assignment of existingAssignments) {
            const prodIdStr = String(assignment.productId);
            if (!assignmentTemplateMap.has(prodIdStr)) {
              assignmentTemplateMap.set(prodIdStr, {
                commissionType: assignment.commissionType,
                commissionValue: assignment.commissionValue,
              });
            }
          }

          const newAssignments = missingGlobalProducts.map((product) => {
            const prodId = String(product._id);
            const template = assignmentTemplateMap.get(prodId) || {
              commissionType: "percentage",
              commissionValue: 10,
            };

            return {
              productId: prodId,
              vendorId: assignmentVendorId || null,
              externalVendorId: requestedVendorId,
              vendorSnapshot: vendorSnapshotObj,
              assignedProductId: buildBulkCode("AP", requestedVendorId, prodId),
              shareCode: buildBulkCode("MWREF", requestedVendorId, prodId),
              refCode: buildBulkCode("REF", requestedVendorId, prodId),
              commissionType: template.commissionType,
              commissionValue: template.commissionValue,
              isActive: true,
              assignmentStatus: "assigned",
              isAssignedToAll: true,
            };
          });

          const bulkOps = newAssignments.map((assignment) => ({
            updateOne: {
              filter: {
                productId: assignment.productId,
                externalVendorId: assignment.externalVendorId,
                assignedProductId: assignment.assignedProductId
              },
              update: { $setOnInsert: assignment },
              upsert: true
            }
          }));

          await ReferralAssignment.bulkWrite(bulkOps);

          // Re-fetch assignments after generating missing ones
          assignments = await ReferralAssignment.find(assignmentQuery).sort({ createdAt: -1 });
        }
      }
    } catch (autoAssignErr) {
      console.error("Error during auto-assignment of global products:", autoAssignErr);
    }

    const productMap = await fetchProductsByIds(assignments.map((assignment) => assignment.productId));

    const assignedProducts = assignments.map((assignment) => {
      const effectiveVendorId =
        assignment.externalVendorId ||
        assignment.vendorSnapshot?.mentorId ||
        String(assignment.vendorId || "");

      return {
        _id: assignment._id,
        product: productMap.get(String(assignment.productId)) || assignment.productId,
        vendorId: effectiveVendorId,
        commission: {
          type: assignment.commissionType,
          value: assignment.commissionValue,
        },
        shareCode: assignment.shareCode,
        refCode: assignment.refCode || "",
        assignedProductId: assignment.assignedProductId,
        isActive: assignment.isActive,
        isAssignedToAll: assignment.isAssignedToAll,
        shareUrl: buildShareUrl(
          assignment.productId,
          effectiveVendorId,
          assignment.assignedProductId,
          assignment.shareCode
        ),
      };
    });

    res.json({
      success: true,
      assignedProducts,
    });
  } catch (error) {
    console.error("Error fetching assigned products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assigned products",
    });
  }
});

// Get vendor orders (for vendor dashboard)
router.get("/orders", protectVendor, vendorApproved, async (req, res) => {
  try {
    const Order = require("../models/Order");
    
    // For now, return all orders since we don't have vendor association
    // In a full implementation, this would filter by vendor ID
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendor orders"
    });
  }
});

// Get single vendor order detail
router.get("/orders/:id", protectVendor, vendorApproved, async (req, res) => {
  try {
    const Order = require("../models/Order");
    const ReferralPurchase = require("../models/ReferralPurchase");
    const { id } = req.params;

    const [order, referralPurchase] = await Promise.all([
      Order.findById(id)
        .populate("user", "name email phone")
        .populate("orderItems.productId", "name sku price discountPrice images vendorId platformCommission")
        .lean(),
      ReferralPurchase.findOne({ $or: [{ orderId: id }, { orderObjectId: id }] })
        .populate("productId", "name sku price discountPrice images vendorId platformCommission")
        .lean()
    ]);

    if (!order && !referralPurchase) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const loggedVendorId = String(req.user.vendorId || req.user._id || "");
    const isReferrer = Boolean(
      (order?.referral?.vendorId && String(order.referral.vendorId) === loggedVendorId) ||
      (referralPurchase?.vendorId && String(referralPurchase.vendorId) === loggedVendorId)
    );

    const safeOrder = order ? { ...order } : null;
    if (safeOrder && !isReferrer) {
      delete safeOrder.referral;
    }

    res.json({
      success: true,
      order: safeOrder || (isReferrer ? referralPurchase : null),
      referralPurchase: isReferrer ? referralPurchase : null
    });
  } catch (error) {
    console.error("Error fetching vendor order detail:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order detail"
    });
  }
});

// Update vendor product (for vendor dashboard)
router.put("/products/:id", protectVendor, vendorApproved, async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    const Product = require("../models/Product");

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Update product fields
    Object.assign(product, productData);
    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product"
    });
  }
});

// Delete vendor product (for vendor dashboard)
router.delete("/products/:id", protectVendor, vendorApproved, async (req, res) => {
  try {
    const { id } = req.params;
    const Product = require("../models/Product");

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product"
    });
  }
});

// Update order status (for vendor dashboard)
router.put("/orders/:id/status", protectVendor, vendorApproved, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const Order = require("../models/Order");

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.status = status;
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
    }
    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status"
    });
  }
});

// Update shipping status (for vendor dashboard)
router.put("/orders/:id/shipping", protectVendor, vendorApproved, async (req, res) => {
  try {
    const { id } = req.params;
    const { shippingStatus } = req.body;
    const Order = require("../models/Order");

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.shippingStatus = shippingStatus;
    await order.save();

    res.json({
      success: true,
      message: "Shipping status updated successfully",
      order
    });
  } catch (error) {
    console.error("Error updating shipping status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating shipping status"
    });
  }
});

module.exports = router;

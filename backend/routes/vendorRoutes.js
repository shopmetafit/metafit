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
router.get("/assigned-products", protect, async (req, res) => {
  try {
    const requestedVendorId = String(
      req.query.vendorId ||
        req.user.vendorId ||
        req.user.mentorId ||
        req.user.userId ||
        req.user.id ||
        req.user._id ||
        ""
    ).trim();

    const authorizedVendorIds = resolveAuthorizedVendorIds(req.user);
    const isAdmin = String(req.user.role || "").toLowerCase() === "admin";

    if (!requestedVendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      });
    }

    if (!isAdmin && !authorizedVendorIds.includes(requestedVendorId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this vendor",
      });
    }

    const assignmentVendorId = await resolveAssignmentVendorId(requestedVendorId, req.user);

    if (!assignmentVendorId && !isAdmin && !requestedVendorId) {
      return res.status(404).json({
        success: false,
        message: "Vendor mapping not found",
      });
    }

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
      const globalProducts = await Product.find({ isAssignedToAll: true, isPublished: true, productApprovalStatus: "approved" });

      if (globalProducts.length > 0) {
        // Find which global products the vendor doesn't have an assignment for yet
        const existingProductIds = new Set(assignments.map(a => String(a.productId)));
        const missingGlobalProducts = globalProducts.filter(p => !existingProductIds.has(String(p._id)));

        if (missingGlobalProducts.length > 0) {
          const vendorSnapshotObj = {
            mentorId: requestedVendorId,
            name: req.user.name || req.user.vendorName || "Partner",
            email: req.user.email || "",
            phone: req.user.phone || "",
            role: req.user.role || "vendor",
          };

          const newAssignments = missingGlobalProducts.map((product) => {
            const prodId = String(product._id);
            return {
              productId: prodId,
              vendorId: assignmentVendorId || null,
              externalVendorId: requestedVendorId,
              vendorSnapshot: vendorSnapshotObj,
              assignedProductId: buildBulkCode("AP", requestedVendorId, prodId),
              shareCode: buildBulkCode("MWREF", requestedVendorId, prodId),
              refCode: buildBulkCode("REF", requestedVendorId, prodId),
              commissionType: "percentage",
              commissionValue: 10,
              isActive: true,
              assignmentStatus: "assigned",
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

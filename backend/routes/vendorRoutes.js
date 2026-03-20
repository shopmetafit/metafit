const express = require("express");
const router = express.Router();

const { registerVendor, loginVendor, loginVendorWithOTP } = require("../controllers/vendorController");
const { sendOtpController, verifyOtpController } = require("../controllers/otpController");

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

module.exports = router;

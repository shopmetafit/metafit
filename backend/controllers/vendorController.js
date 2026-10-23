const Vendor = require("../models/Vendor.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sellerTransporter } = require("../utils/email");
const { generateAdminVendorRequestEmail, generateVendorApprovalEmail } = require("../utils/emailTemplate");
const { sendWhatsAppVendorOrderNotification } = require("../config/whatsappServices");

// REGISTER VENDOR
exports.registerVendor = async (req, res) => {
  try {
    const data = req.body || {};
    // Basic validation
    if (!data.businessEmail || !data.vendorPass || !data.businessName || !data.vendorPhone) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const existing = await Vendor.findOne({ email: data.businessEmail });

    if (existing) {
      return res.json({ success: false, message: "Already registered" });
    }

    const hashedPassword = await bcrypt.hash(data.vendorPass, 10);

    const street = String(data.streetAddress || data.address || data.pickupAddress?.street || "").trim();
    const city = String(data.vendorCity || data.city || data.pickupAddress?.city || "").trim();
    const state = String(data.vendorState || data.state || data.pickupAddress?.state || "").trim();
    const pincode = String(data.pinCode || data.pincode || data.pickupAddress?.pincode || "").trim();
    const contactPerson = String(data.contactPerson || data.vendorName || "").trim();
    const contactPhone = String(data.contactPhone || data.vendorPhone || "").trim();

    const pickupAddress = (street || city || state || pincode)
      ? {
          street,
          city,
          state,
          pincode,
          contactPerson,
          contactPhone,
        }
      : null;

    const newVendor = new Vendor({
      businessName: data.businessName,
      vendorName: data.vendorName,
      email: data.businessEmail,
      phone: data.vendorPhone,
      password: hashedPassword,

      bankAccountNumber: data.bankAccNumber,
      ifscCode: data.IFSCCode,
      accountHolderName: data.accountHolderName,

      state: data.vendorState,
      city: data.vendorCity,
      pincode: data.pinCode,
      pickupAddress,

      status: "pending"
    });

    await newVendor.save();

    // Send admin notification email about new vendor registration
    try {
      const adminEmailHtml = generateAdminVendorRequestEmail(
        data.vendorName,
        data.businessName,
        data.businessEmail,
        data.vendorPhone,
        "Company",
        data.vendorCity,
        data.vendorState
      );

      const adminMailOptions = {
        from: process.env.SELLER_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: "New Vendor Registration Request - MetaFit",
        html: adminEmailHtml
      };

      await sellerTransporter.sendMail(adminMailOptions);
      console.log("✓ Admin notification email sent successfully");
    } catch (emailErr) {
      console.error("✗ Failed to send admin notification email:", emailErr.message);
      // Don't throw - continue processing even if email fails
    }

    res.json({
      success: true,
      message: "Registration successful, waiting for admin approval"
    });

  } catch (error) {
    console.log("Error", error);

    // res.json({ success: false });
    res.status(500).json({ success: false, message: "Server error" });
  }

};

// VENDOR LOGIN
exports.loginVendor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find vendor by email
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, vendor.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check approval status
    if (vendor.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Account not approved yet. Please wait for admin approval.",
        status: vendor.status
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        vendorId: vendor._id,
        email: vendor.email,
        vendorName: vendor.vendorName,
        businessName: vendor.businessName
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      vendor: {
        id: vendor._id,
        vendorName: vendor.vendorName,
        businessName: vendor.businessName,
        email: vendor.email,
        status: vendor.status,
        pickupAddress: vendor.pickupAddress || null,
      }
    });

  } catch (error) {
    console.error("Vendor login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// VENDOR OTP LOGIN
exports.loginVendorWithOTP = async (req, res) => {
  try {
    let { phone, otp } = req.body;

    // Basic validation
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: "Phone and OTP are required" });
    }

    // Normalize phone number
    phone = phone.replace(/\D/g, "");
    if (phone.length === 10) {
      phone = "91" + phone;
    }

    // Find vendor by phone
    const vendor = await Vendor.findOne({ phone });
    if (!vendor) {
      return res.status(401).json({ success: false, message: "No vendor found with this phone number" });
    }

    // Check approval status
    if (vendor.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Account not approved yet. Please wait for admin approval.",
        status: vendor.status
      });
    }

    // Verify OTP (using the same logic as the existing OTP controller)
    const otpStore = require("../config/whatsappServices").otpStore; // This would need to be exported
    const otpData = otpStore.get(phone);

    if (!otpData) {
      return res.status(400).json({ success: false, message: "OTP expired or not found" });
    }

    const OTP_EXPIRY_MINUTES = 10;
    const MAX_OTP_ATTEMPTS = 3;
    const expiryTime = otpData.createdAt + OTP_EXPIRY_MINUTES * 60 * 1000;

    if (Date.now() > expiryTime) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(phone);
      return res.status(429).json({ success: false, message: "Too many wrong attempts" });
    }

    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining: MAX_OTP_ATTEMPTS - otpData.attempts
      });
    }

    // OTP verified successfully
    otpStore.delete(phone);

    // Generate JWT token
    const token = jwt.sign(
      {
        vendorId: vendor._id,
        email: vendor.email,
        vendorName: vendor.vendorName,
        businessName: vendor.businessName,
        phone: vendor.phone
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      vendor: {
        id: vendor._id,
        vendorName: vendor.vendorName,
        businessName: vendor.businessName,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        pickupAddress: vendor.pickupAddress || null,
      }
    });

  } catch (error) {
    console.error("Vendor OTP login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET VENDOR PROFILE
 * GET /api/vendor/profile
 * Requires: protectVendor, vendorApproved
 */
exports.getVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user?.vendorId || req.user?._id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Vendor authentication required" });
    }

    const vendor = await Vendor.findById(vendorId).select("-password");
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    res.json({
      success: true,
      vendor: {
        _id: vendor._id,
        id: vendor._id,
        vendorName: vendor.vendorName,
        businessName: vendor.businessName,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        city: vendor.city,
        state: vendor.state,
        pincode: vendor.pincode,
        pickupAddress: vendor.pickupAddress || null,
        platformCommission: vendor.platformCommission,
        createdAt: vendor.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    res.status(500).json({ success: false, message: "Server error fetching profile" });
  }
};

/**
 * UPDATE VENDOR PROFILE & PICKUP ADDRESS
 * PUT /api/vendor/profile
 * Requires: protectVendor, vendorApproved
 * Validates shipping address requirements strictly (no placeholder/demo fallbacks)
 */
exports.updateVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user?.vendorId || req.user?._id;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Vendor authentication required" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const { pickupAddress, vendorName, businessName, removePickupAddress } = req.body || {};

    const isRemovingAddress =
      pickupAddress === null ||
      removePickupAddress === true ||
      req.body?.clearPickupAddress === true;

    if (isRemovingAddress) {
      // Safely clear pickup address without touching vendor core account, registered city/state/phone
      vendor.pickupAddress = null;
    } else {
      // Support both nested pickupAddress object and flat address fields
      const addressInput =
        pickupAddress ||
        (req.body?.streetAddress || req.body?.street ? req.body : null);

      if (addressInput) {
        const street = String(addressInput.street || addressInput.streetAddress || "").trim();
        const city = String(addressInput.city || addressInput.vendorCity || vendor.city || "").trim();
        const state = String(addressInput.state || addressInput.vendorState || vendor.state || "").trim();
        const rawPincode = String(addressInput.pincode || addressInput.pinCode || vendor.pincode || "").trim();
        const pincode = rawPincode.replace(/\s/g, "");
        const contactPerson = String(addressInput.contactPerson || vendorName || vendor.vendorName || "").trim();
        const contactPhone = String(addressInput.contactPhone || vendor.phone || "").trim();

        const errors = {};
        if (!street || street.length < 5) {
          errors.street = "Street address must be at least 5 characters";
        }
        if (!city) {
          errors.city = "City is required";
        }
        if (!state) {
          errors.state = "State is required";
        }
        if (!pincode || !/^\d{6}$/.test(pincode)) {
          errors.pincode = "Valid 6-digit PIN code is required";
        }
        const digitsOnlyPhone = contactPhone.replace(/\D/g, "");
        if (!digitsOnlyPhone || digitsOnlyPhone.length < 10) {
          errors.contactPhone = "Valid 10-digit contact phone number is required";
        }
        if (!contactPerson) {
          errors.contactPerson = "Contact person name is required";
        }

        if (Object.keys(errors).length > 0) {
          return res.status(400).json({
            success: false,
            message: "Invalid pickup address for shipping",
            code: "INVALID_PICKUP_ADDRESS",
            errors,
          });
        }

        vendor.pickupAddress = {
          street,
          city,
          state,
          pincode,
          contactPerson,
          contactPhone,
        };

        // Keep root city, state, pincode synchronized for backward compatibility
        vendor.city = city;
        vendor.state = state;
        vendor.pincode = pincode;
      }
    }

    if (vendorName && typeof vendorName === "string" && vendorName.trim()) {
      vendor.vendorName = vendorName.trim();
    }
    if (businessName && typeof businessName === "string" && businessName.trim()) {
      vendor.businessName = businessName.trim();
    }

    await vendor.save();

    res.json({
      success: true,
      message: isRemovingAddress
        ? "Pickup address removed successfully"
        : "Vendor profile updated successfully",
      vendor: {
        _id: vendor._id,
        id: vendor._id,
        vendorName: vendor.vendorName,
        businessName: vendor.businessName,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        city: vendor.city,
        state: vendor.state,
        pincode: vendor.pincode,
        pickupAddress: vendor.pickupAddress || null,
      },
    });
  } catch (error) {
    console.error("Error updating vendor profile:", error);
    res.status(500).json({ success: false, message: "Server error updating profile" });
  }
};

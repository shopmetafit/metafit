const Vendor = require("../models/Vendor");
const User = require("../models/User");

// @desc    Register as vendor
// @route   POST /api/vendors/register
// @access  Private (customer users)
const registerVendor = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Check if user already registered as vendor
    const existingVendor = await Vendor.findOne({ userId });
    if (existingVendor) {
      return res
        .status(400)
        .json({ message: "You are already registered as a vendor" });
    }

    const {
      companyName,
      gstNo,
      panNo,
      businessDescription,
      bankDetails,
      pickupAddress,
      contactPerson,
    } = req.body;

    // Validation
    if (!companyName || !gstNo || !panNo || !bankDetails || !pickupAddress) {
      return res
        .status(400)
        .json({ message: "Missing required fields" });
    }

    // Validate GST format (15 digit)
    if (!/^\d{15}$/.test(gstNo.replace(/\D/g, ""))) {
      return res.status(400).json({ message: "Invalid GST number format" });
    }

    // Validate PAN format (10 character)
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNo)) {
      return res.status(400).json({ message: "Invalid PAN format" });
    }

    // Create vendor profile
    const vendor = new Vendor({
      userId,
      companyName,
      gstNo: gstNo.toUpperCase(),
      panNo: panNo.toUpperCase(),
      businessDescription,
      bankDetails: {
        accountName: bankDetails.accountName,
        accountNumber: bankDetails.accountNumber,
        bankName: bankDetails.bankName,
        ifscCode: bankDetails.ifscCode.toUpperCase(),
      },
      pickupAddress,
      contactPerson,
      status: "pending",
      isApproved: false,
    });

    await vendor.save();

    // Update user role to vendor
    user.role = "vendor";
    user.vendorName = companyName;
    await user.save();

    res.status(201).json({
      message:
        "Vendor registration submitted. Awaiting admin approval.",
      vendor,
    });
  } catch (error) {
    console.error("Vendor registration error:", error);
    res
      .status(500)
      .json({ message: "Error registering vendor", error: error.message });
  }
};

// @desc    Get vendor profile
// @route   GET /api/vendors/profile
// @access  Private (vendor users)
const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id }).populate(
      "userId",
      "name email phone avatar"
    );

    if (!vendor) {
      return res
        .status(404)
        .json({ message: "Vendor profile not found" });
    }

    res.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    res.status(500).json({
      message: "Error fetching vendor profile",
      error: error.message,
    });
  }
};

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private (vendor users)
const updateVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });

    if (!vendor) {
      return res
        .status(404)
        .json({ message: "Vendor profile not found" });
    }

    const {
      companyName,
      businessDescription,
      bankDetails,
      pickupAddress,
      contactPerson,
    } = req.body;

    // Update only non-sensitive fields
    if (companyName) vendor.companyName = companyName;
    if (businessDescription) vendor.businessDescription = businessDescription;
    if (bankDetails) vendor.bankDetails = bankDetails;
    if (pickupAddress) vendor.pickupAddress = pickupAddress;
    if (contactPerson) vendor.contactPerson = contactPerson;

    await vendor.save();

    res.json({
      message: "Vendor profile updated",
      vendor,
    });
  } catch (error) {
    console.error("Error updating vendor profile:", error);
    res.status(500).json({
      message: "Error updating vendor profile",
      error: error.message,
    });
  }
};

// @desc    Get all vendors (admin only)
// @route   GET /api/vendors
// @access  Private (admin)
const getAllVendors = async (req, res) => {
  try {
    const { status } = req.query; // Filter by status: pending, approved, rejected, suspended

    let query = {};
    if (status) {
      query.status = status;
    }

    const vendors = await Vendor.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      count: vendors.length,
      vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res
      .status(500)
      .json({ message: "Error fetching vendors", error: error.message });
  }
};

// @desc    Approve vendor (admin only)
// @route   PUT /api/vendors/:vendorId/approve
// @access  Private (admin)
const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { commissionRate } = req.body;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.isApproved = true;
    vendor.status = "approved";
    vendor.approvedAt = new Date();
    if (commissionRate) {
      vendor.commissionRate = commissionRate;
    }

    await vendor.save();

    // Update user role
    await User.findByIdAndUpdate(vendor.userId, {
      role: "vendor",
      isApproved: true,
    });

    res.json({
      message: "Vendor approved successfully",
      vendor,
    });
  } catch (error) {
    console.error("Error approving vendor:", error);
    res
      .status(500)
      .json({ message: "Error approving vendor", error: error.message });
  }
};

// @desc    Reject vendor (admin only)
// @route   PUT /api/vendors/:vendorId/reject
// @access  Private (admin)
const rejectVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res
        .status(400)
        .json({ message: "Rejection reason is required" });
    }

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.isApproved = false;
    vendor.status = "rejected";
    vendor.rejectionReason = rejectionReason;

    await vendor.save();

    res.json({
      message: "Vendor rejected",
      vendor,
    });
  } catch (error) {
    console.error("Error rejecting vendor:", error);
    res
      .status(500)
      .json({ message: "Error rejecting vendor", error: error.message });
  }
};

// @desc    Get vendor details (by ID or current user)
// @route   GET /api/vendors/:vendorId
// @access  Public
const getVendorDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId)
      .populate("userId", "name email phone vendorLogo vendorBanner")
      .lean();

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    res.status(500).json({
      message: "Error fetching vendor details",
      error: error.message,
    });
  }
};

module.exports = {
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
  getAllVendors,
  approveVendor,
  rejectVendor,
  getVendorDetails,
};

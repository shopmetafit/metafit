const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

// Middleware to protect vendor routes
const protectVendor = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

      // Check if this is a vendor token by looking for vendor-specific fields
      if (decoded.vendorId) {
        const vendor = await Vendor.findById(decoded.vendorId);
        if (!vendor) {
          return res.status(401).json({ message: "Not authorized, vendor not found" });
        }

        // Add vendor info to req.user for consistency
        req.user = {
          _id: vendor._id,
          email: vendor.email,
          vendorName: vendor.vendorName,
          businessName: vendor.businessName,
          phone: vendor.phone,
          role: "vendor",
          status: vendor.status
        };
        return next();
      } else if (decoded.user && decoded.user.id) {
        // Fall back to regular user authentication
        const User = require("../models/User");
        const user = await User.findById(decoded.user.id).select("-password");
        if (user) {
          req.user = user;
          return next();
        }
      }
    } catch (error) {
      // Local verification failed, token might be an external mentor/admin token
    }

    // Fall back to main protect middleware from authMiddleware
    try {
      const { protect } = require("./authMiddleware");
      return protect(req, res, next);
    } catch (err) {
      console.error("External protection failed", err);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Middleware to check if vendor is approved
const vendorApproved = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: "Not authorized as an approved vendor" });
  }

  const role = String(req.user.role || "").toLowerCase();

  // Local vendor check
  if (role === "vendor") {
    if (req.user.status === "approved") {
      return next();
    } else {
      return res.status(403).json({
        message: "Vendor account not approved yet. Please wait for admin approval.",
        status: req.user.status
      });
    }
  }

  // External vendor/mentor check
  const allowedExternalRoles = [
    "yoga instructor",
    "ayurvedic doctor",
    "lab test",
    "treatment and retreat",
    "treatment & retreat",
    "naturopathy and wellness",
    "naturopathy doctor",
    "naturopathy",
    "human psychology"
  ];

  if (allowedExternalRoles.includes(role)) {
    return next(); // External roles are assumed approved if token is verified
  }

  return res.status(403).json({ message: "Not authorized as an approved vendor" });
};

module.exports = { protectVendor, vendorApproved };
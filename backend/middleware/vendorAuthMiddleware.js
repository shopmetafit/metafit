const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

// Middleware to protect vendor routes
const protectVendor = async (req, res, next) => {
  let token;
  
  if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
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
            } else {
              // Fall back to regular user authentication
              const User = require("../models/User");
              const user = await User.findById(decoded.user.id).select("-password");
              if (!user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
              }
              req.user = user;
            }
            
            next();
    } catch (error) {
      console.error("Token verification failed", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, token failed" });
}
};

// Middleware to check if vendor is approved
const vendorApproved = (req, res, next) => {
  if (req.user && req.user.role === "vendor" && req.user.status === "approved") {
    next();
  } else if (req.user && req.user.role === "vendor" && req.user.status !== "approved") {
    res.status(403).json({ 
      message: "Vendor account not approved yet. Please wait for admin approval.",
      status: req.user.status
    });
  } else {
    res.status(403).json({ message: "Not authorized as an approved vendor" });
  }
};

module.exports = { protectVendor, vendorApproved };
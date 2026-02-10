const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;
  
  if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = await User.findById(decoded.user.id).select("-password"); // exclude password
            // console.log("protect",req.user);
            next();
    } catch (error) {
      console.error("Token verification failed", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, token failed" });
}
};

// Middleware to check if user is an admin
const admin = (req, res, next)=>{
    if(req.user && req.user.role ==="admin"){
        next()
    }else{
    res.status(403).json({ message: "Not authorized as an admin" });

}
}

// Middleware to check if user is a vendor
const vendor = (req, res, next) => {
  if (req.user && req.user.role === "vendor") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as a vendor" });
  }
};

// RBAC: Check if user has specific role(s)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized" });
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        message: `Not authorized. Required roles: ${allowedRoles.join(", ")}`,
      });
    }
  };
};

module.exports = { protect, admin, vendor, authorize };

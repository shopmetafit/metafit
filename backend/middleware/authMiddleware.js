const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");

const EXTERNAL_ADMIN_VERIFY_URL =
  process.env.EXTERNAL_ADMIN_VERIFY_URL ||
  "http://localhost:5001/admin/api/v2/verify-admin-details";
const EXTERNAL_ADMIN_JWT_SECRETS = [
  process.env.METAFIT_ADMIN_SECRET_KEY,
  process.env.SECRET_KEY,
  "your_secret_key",
].filter(Boolean);

const extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req.headers["x-auth-token"]) {
    return req.headers["x-auth-token"];
  }

  if (req.body && typeof req.body.token === "string") {
    return req.body.token;
  }

  if (req.query && typeof req.query.token === "string") {
    return req.query.token;
  }

  return null;
};

const normalizeUser = (rawUser, fallbackRole) => {
  if (!rawUser || typeof rawUser !== "object") {
    return null;
  }

  const role = String(
    rawUser.role ||
      rawUser.userType ||
      rawUser.accountType ||
      fallbackRole ||
      ""
  ).toLowerCase();

  return {
    _id:
      rawUser._id ||
      rawUser.id ||
      rawUser.userId ||
      rawUser.mentorId ||
      rawUser.adminId ||
      rawUser.vendorId ||
      null,
    id: rawUser.id || rawUser._id || null,
    mentorId: rawUser.mentorId || rawUser.vendorId || null,
    userId: rawUser.userId || null,
    vendorId: rawUser.vendorId || rawUser.mentorId || null,
    name: rawUser.name || rawUser.fullName || rawUser.vendorName || "External User",
    email: rawUser.email || null,
    phone: rawUser.phone || null,
    role,
    externalAuth: true,
  };
};

const resolveExternalUser = async (token) => {
  try {
    const response = await axios.post(
      EXTERNAL_ADMIN_VERIFY_URL,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      }
    );

    const data = response.data || {};
    const synthesizedUser =
      data && typeof data === "object"
        ? {
            id: data.userId || data.id || null,
            mentorId: data.mentorId || null,
            email: data.email || null,
            role: data.role || data.userRole || data.accountType || null,
            name: data.name || data.fullName || "External Admin",
          }
        : null;
    const candidateUser =
      data.user ||
      data.admin ||
      data.vendor ||
      data.data?.user ||
      data.data?.admin ||
      data.data?.vendor ||
      data.result ||
      synthesizedUser ||
      null;

    const fallbackRole =
      data.role || data.data?.role || data.adminRole || data.vendorRole;
    const normalizedUser = normalizeUser(candidateUser, fallbackRole);

    if (normalizedUser && !normalizedUser._id) {
      normalizedUser._id = data.mentorId || data.userId || data.id || token;
    }

    return normalizedUser;
  } catch (error) {
    return null;
  }
};

const resolveLocalUser = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded?.user?.id || decoded?.id;

  if (!userId) {
    return null;
  }

  return User.findById(userId).select("-password");
};

const resolveExternalJwtUser = async (token) => {
  for (const secret of EXTERNAL_ADMIN_JWT_SECRETS) {
    try {
      const decoded = jwt.verify(token, secret);
      const normalizedUser = normalizeUser(
        {
          _id:
            decoded.id ||
            decoded._id ||
            decoded.userId ||
            decoded.mentorId ||
            null,
          id: decoded.id || decoded._id || null,
          userId: decoded.userId || null,
          mentorId: decoded.mentorId || null,
          email: decoded.email || null,
          name: decoded.name || decoded.fullName || "External Admin",
          role: decoded.role || decoded.userRole || decoded.accountType || null,
        },
        decoded.role
      );

      if (normalizedUser) {
        normalizedUser.externalAuth = true;
        normalizedUser.authSource = "external-jwt";
        return normalizedUser;
      }
    } catch (error) {
      // Try the next known secret.
    }
  }

  return null;
};

// Middleware to protect routes
const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    const localUser = await resolveLocalUser(token);

    if (localUser) {
      req.user = localUser;
      return next();
    }
  } catch (localError) {
    // Try external auth fallback below.
  }

  const externalJwtUser = await resolveExternalJwtUser(token);

  if (externalJwtUser) {
    req.user = externalJwtUser;
    return next();
  }

  const externalUser = await resolveExternalUser(token);

  if (externalUser) {
    req.user = externalUser;
    return next();
  }

  return res.status(401).json({ message: "Not authorized, tokens failed" });
};

// Middleware to check if user is an admin
const admin = (req, res, next) => {
  if (req.user && String(req.user.role).toLowerCase() === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Not authorized as an admin" });
};

// Middleware to check if user is a vendor
const vendor = (req, res, next) => {
  if (req.user && String(req.user.role).toLowerCase() === "vendor") {
    return next();
  }

  return res.status(403).json({ message: "Not authorized as a vendor" });
};

// RBAC: Check if user has specific role(s)
const authorize = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map((role) => String(role).toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (normalizedRoles.includes(String(req.user.role).toLowerCase())) {
      return next();
    }

    return res.status(403).json({
      message: `Not authorized. Required roles: ${allowedRoles.join(", ")}`,
    });
  };
};

module.exports = { protect, admin, vendor, authorize };

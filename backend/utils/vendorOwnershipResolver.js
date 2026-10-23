/**
 * Vendor Ownership Resolver Utility for M Wellness Bazaar
 * Phase 2.5B — Vendor Ownership Resolution Boundary
 *
 * Resolves product ownership into the verified ownershipMap expected by
 * buildVendorFulfillments(orderItems, ownershipMap).
 *
 * Follows verified schema relationships across Product, Vendor, User, and ProductRequest:
 * 1. Checks explicit platform products (isPlatform: true or createdBy: "ADMIN" with no vendor attachment).
 * 2. Resolves vendor-owned products to actual Vendor._id (handling direct Vendor refs,
 *    legacy User refs with email/phone linking, and approved ProductRequest mappings).
 * 3. Rejects missing products, inactive/unapproved vendors, and conflicting mappings.
 * 4. Never blindly assumes Vendor has a 'user' field or fabricates dummy vendor records.
 */

const mongoose = require("mongoose");
const { PLATFORM_VENDOR_NAME } = require("./fulfillmentHelper");

/**
 * Custom error class for ownership resolver failures
 */
class VendorOwnershipResolverError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = "VendorOwnershipResolverError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Normalizes phone numbers to digits only
 */
function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Creates a safe regex for exact case-insensitive email matching
 */
function getSafeEmailRegex(email) {
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  return new RegExp(`^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

/**
 * Resolves an array of product IDs into a verified ownership Map.
 *
 * @param {Array<string|mongoose.Types.ObjectId>} productIds Array of product IDs to resolve
 * @param {Object} [options] Configuration and optional mock model overrides
 * @param {Object} [options.models] Optional model overrides for safe testing without DB writes
 * @param {Object} [options.models.Product] Product model
 * @param {Object} [options.models.Vendor] Vendor model
 * @param {Object} [options.models.User] User model
 * @param {Object} [options.models.ProductRequest] ProductRequest model
 * @returns {Promise<Map<string, Object>>} Map of productId string -> ownership object
 */
async function resolveProductOwnership(productIds, options = {}) {
  if (!productIds) {
    return new Map();
  }

  if (!Array.isArray(productIds)) {
    throw new VendorOwnershipResolverError(
      "productIds must be an array",
      "INVALID_PRODUCT_IDS",
      { productIdsType: typeof productIds }
    );
  }

  if (productIds.length === 0) {
    return new Map();
  }

  // Load models (allow dependency injection for pure mocked unit testing)
  const ProductModel = options.models?.Product || require("../models/Product");
  const VendorModel = options.models?.Vendor || require("../models/Vendor");
  const UserModel = options.models?.User || require("../models/User");
  const ProductRequestModel = options.models?.ProductRequest || require("../models/ProductRequest");

  // 1. Deduplicate and normalize input product IDs
  const rawIdStrings = [];
  for (const rawId of productIds) {
    const id = rawId?._id || rawId;
    if (!id) {
      throw new VendorOwnershipResolverError(
        "Invalid product ID encountered: ID cannot be null or empty",
        "INVALID_PRODUCT_IDS",
        { invalidId: rawId }
      );
    }
    rawIdStrings.push(String(id).trim());
  }

  const uniqueIdStrings = Array.from(new Set(rawIdStrings));
  const productObjectIds = uniqueIdStrings
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));

  // 2. Fetch products
  const productQuery = {
    $or: [
      { _id: { $in: productObjectIds } },
      { _id: { $in: uniqueIdStrings } },
    ],
  };

  const products = await ProductModel.find(productQuery).lean ?
    await ProductModel.find(productQuery).lean() :
    await ProductModel.find(productQuery);

  const productMap = new Map();
  for (const prod of (products || [])) {
    productMap.set(String(prod._id), prod);
  }

  // Check for missing products
  for (const idStr of uniqueIdStrings) {
    if (!productMap.has(idStr)) {
      throw new VendorOwnershipResolverError(
        `Product not found for ID: ${idStr}`,
        "PRODUCT_NOT_FOUND",
        { productId: idStr }
      );
    }
  }

  // 3. Fetch approved ProductRequests for these products
  const requestQuery = {
    productId: { $in: productObjectIds.length > 0 ? productObjectIds : uniqueIdStrings },
    status: "approved",
  };

  const productRequests = await ProductRequestModel.find(requestQuery).lean ?
    await ProductRequestModel.find(requestQuery).lean() :
    await ProductRequestModel.find(requestQuery);

  // Map<productIdStr, Array<ProductRequest>>
  const requestsByProduct = new Map();
  for (const req of (productRequests || [])) {
    if (!req.productId || !req.vendorId) continue;
    const pIdStr = String(req.productId?._id || req.productId);
    if (!requestsByProduct.has(pIdStr)) {
      requestsByProduct.set(pIdStr, []);
    }
    requestsByProduct.get(pIdStr).push(req);
  }

  // 4. Collect candidate vendor and user IDs to resolve in batch
  // For each product: gather candidate direct vendor IDs and candidate user IDs
  const candidateVendorIds = new Set();
  const candidateUserIds = new Set();

  for (const prod of productMap.values()) {
    // If explicitly marked as platform without vendor attachments, skip vendor lookup
    if (prod.isPlatform === true && !prod.vendorId) {
      continue;
    }

    if (prod.vendorId) {
      candidateVendorIds.add(String(prod.vendorId?._id || prod.vendorId));
    } else if (prod.user && prod.createdBy === "VENDOR") {
      // Legacy vendor product created by vendor user
      candidateUserIds.add(String(prod.user?._id || prod.user));
    }

    const reqs = requestsByProduct.get(String(prod._id));
    if (reqs && reqs.length > 0) {
      for (const r of reqs) {
        if (r.vendorId) {
          candidateVendorIds.add(String(r.vendorId?._id || r.vendorId));
        }
      }
    }
  }

  // 5. Query Vendor collection for candidate IDs
  const vendorObjIds = Array.from(candidateVendorIds)
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));

  const vendorQuery = {
    $or: [
      { _id: { $in: vendorObjIds } },
      { _id: { $in: Array.from(candidateVendorIds) } },
    ],
  };

  const vendors = await VendorModel.find(vendorQuery).lean ?
    await VendorModel.find(vendorQuery).lean() :
    await VendorModel.find(vendorQuery);

  const vendorMap = new Map();
  for (const v of (vendors || [])) {
    vendorMap.set(String(v._id), v);
  }

  // 6. Query User collection for any candidate IDs not found in Vendor collection
  // (Handling legacy Product.vendorId referencing User, or Product.user)
  const remainingUnresolvedIds = new Set(candidateUserIds);
  for (const vId of candidateVendorIds) {
    if (!vendorMap.has(vId)) {
      remainingUnresolvedIds.add(vId);
    }
  }

  let userMap = new Map();
  let userToVendorMap = new Map();

  if (remainingUnresolvedIds.size > 0) {
    const userObjIds = Array.from(remainingUnresolvedIds)
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const userQuery = {
      $or: [
        { _id: { $in: userObjIds } },
        { _id: { $in: Array.from(remainingUnresolvedIds) } },
      ],
    };

    const users = await UserModel.find(userQuery).lean ?
      await UserModel.find(userQuery).lean() :
      await UserModel.find(userQuery);

    for (const u of (users || [])) {
      userMap.set(String(u._id), u);
    }

    // For matched users, find corresponding Vendor by email or phone
    const vendorOrConditions = [];
    for (const user of userMap.values()) {
      const emailRegex = getSafeEmailRegex(user.email);
      if (emailRegex) {
        vendorOrConditions.push({ email: emailRegex });
      }

      const phone = normalizePhone(user.phone || user.mobile || user.phoneNo);
      if (phone) {
        vendorOrConditions.push({ phone });
        if (phone.length === 10) vendorOrConditions.push({ phone: `91${phone}` });
        if (phone.length === 12 && phone.startsWith("91")) vendorOrConditions.push({ phone: phone.slice(2) });
      }
    }

    if (vendorOrConditions.length > 0) {
      const linkedVendors = await VendorModel.find({ $or: vendorOrConditions }).lean ?
        await VendorModel.find({ $or: vendorOrConditions }).lean() :
        await VendorModel.find({ $or: vendorOrConditions });

      for (const lv of (linkedVendors || [])) {
        vendorMap.set(String(lv._id), lv);

        // Map users to this vendor
        for (const [uIdStr, user] of userMap.entries()) {
          const emailMatch = user.email && lv.email && String(user.email).trim().toLowerCase() === String(lv.email).trim().toLowerCase();
          const uPhone = normalizePhone(user.phone || user.mobile || user.phoneNo);
          const vPhone = normalizePhone(lv.phone);
          const phoneMatch = uPhone && vPhone && (uPhone === vPhone || uPhone === `91${vPhone}` || `91${uPhone}` === vPhone);

          if (emailMatch || phoneMatch) {
            userToVendorMap.set(uIdStr, lv);
          }
        }
      }
    }
  }

  // 7. Resolve ownership for each product
  const ownershipMap = new Map();

  for (const [productIdStr, product] of productMap.entries()) {
    // Check explicit platform flag
    if (product.isPlatform === true) {
      // Check for conflicting vendor attachments
      if (product.vendorId || (requestsByProduct.has(productIdStr) && requestsByProduct.get(productIdStr).length > 0)) {
        throw new VendorOwnershipResolverError(
          `Conflicting ownership for product ${productIdStr}: flagged as platform-owned but has vendor attachments`,
          "CONFLICTING_OWNERSHIP",
          { productId: productIdStr }
        );
      }

      ownershipMap.set(productIdStr, {
        isPlatform: true,
        vendorName: (typeof product.vendorName === "string" && product.vendorName.trim())
          ? product.vendorName.trim()
          : PLATFORM_VENDOR_NAME,
      });
      continue;
    }

    // Resolve candidate vendor from direct references
    let directVendor = null;
    const rawDirectVendorId = product.vendorId ? String(product.vendorId?._id || product.vendorId) : null;

    if (rawDirectVendorId) {
      if (vendorMap.has(rawDirectVendorId)) {
        directVendor = vendorMap.get(rawDirectVendorId);
      } else if (userToVendorMap.has(rawDirectVendorId)) {
        directVendor = userToVendorMap.get(rawDirectVendorId);
      } else {
        throw new VendorOwnershipResolverError(
          `Unresolved vendor reference for product ${productIdStr}: vendorId ${rawDirectVendorId} could not be resolved to any Vendor`,
          "UNRESOLVED_VENDOR",
          { productId: productIdStr, vendorId: rawDirectVendorId }
        );
      }
    } else if (product.user && product.createdBy === "VENDOR") {
      // Legacy vendor product created by vendor user
      const rawUserId = String(product.user?._id || product.user);
      if (vendorMap.has(rawUserId)) {
        directVendor = vendorMap.get(rawUserId);
      } else if (userToVendorMap.has(rawUserId)) {
        directVendor = userToVendorMap.get(rawUserId);
      } else {
        throw new VendorOwnershipResolverError(
          `Unresolved legacy vendor user for product ${productIdStr}: user ${rawUserId} could not be resolved to any Vendor`,
          "UNRESOLVED_VENDOR",
          { productId: productIdStr, userId: rawUserId }
        );
      }
    }

    // Resolve candidate vendor from approved ProductRequests
    let requestVendor = null;
    const reqs = requestsByProduct.get(productIdStr);
    if (reqs && reqs.length > 0) {
      // If multiple approved requests point to different vendors, flag conflict
      const requestVendorIds = new Set(reqs.map(r => String(r.vendorId?._id || r.vendorId)));
      if (requestVendorIds.size > 1) {
        throw new VendorOwnershipResolverError(
          `Conflicting ProductRequest approvals for product ${productIdStr}: multiple requests point to different vendors`,
          "CONFLICTING_OWNERSHIP",
          { productId: productIdStr, vendorIds: Array.from(requestVendorIds) }
        );
      }

      const reqVendorIdStr = Array.from(requestVendorIds)[0];
      if (vendorMap.has(reqVendorIdStr)) {
        requestVendor = vendorMap.get(reqVendorIdStr);
      } else if (userToVendorMap.has(reqVendorIdStr)) {
        requestVendor = userToVendorMap.get(reqVendorIdStr);
      } else {
        throw new VendorOwnershipResolverError(
          `Unresolved vendor reference in ProductRequest for product ${productIdStr}: vendorId ${reqVendorIdStr} not found`,
          "UNRESOLVED_VENDOR",
          { productId: productIdStr, vendorId: reqVendorIdStr }
        );
      }
    }

    // Check conflict between directVendor and requestVendor
    if (directVendor && requestVendor) {
      if (String(directVendor._id) !== String(requestVendor._id)) {
        throw new VendorOwnershipResolverError(
          `Conflicting ownership mapping for product ${productIdStr}: product references vendor ${directVendor._id} but ProductRequest references vendor ${requestVendor._id}`,
          "CONFLICTING_OWNERSHIP",
          {
            productId: productIdStr,
            directVendorId: String(directVendor._id),
            requestVendorId: String(requestVendor._id),
          }
        );
      }
    }

    const resolvedVendor = directVendor || requestVendor;

    if (resolvedVendor) {
      // Check vendor status (must be approved according to project rules)
      if (resolvedVendor.status !== "approved") {
        throw new VendorOwnershipResolverError(
          `Vendor account is not approved (status: '${resolvedVendor.status}') for product ${productIdStr}`,
          "INACTIVE_VENDOR",
          {
            productId: productIdStr,
            vendorId: String(resolvedVendor._id),
            vendorStatus: resolvedVendor.status,
          }
        );
      }

      ownershipMap.set(productIdStr, {
        isPlatform: false,
        vendorId: resolvedVendor._id,
        vendorName: resolvedVendor.vendorName || resolvedVendor.businessName || "Vendor",
      });
      continue;
    }

    // No vendor candidates resolved
    // If createdBy is ADMIN and no vendor was resolved, it is platform catalog
    if (product.createdBy === "ADMIN" && !product.vendorId) {
      ownershipMap.set(productIdStr, {
        isPlatform: true,
        vendorName: PLATFORM_VENDOR_NAME,
      });
      continue;
    }

    // If createdBy is VENDOR but vendor could not be resolved, reject
    throw new VendorOwnershipResolverError(
      `Unresolved vendor ownership for product ${productIdStr}: vendor identity could not be determined`,
      "UNRESOLVED_VENDOR",
      { productId: productIdStr, createdBy: product.createdBy }
    );
  }

  return ownershipMap;
}

/**
 * Safe wrapper around resolveProductOwnership that returns a structured result object
 * instead of throwing.
 *
 * @param {Array<string|mongoose.Types.ObjectId>} productIds Array of product IDs to resolve
 * @param {Object} [options] Optional configuration and mock models
 * @returns {Promise<{ success: boolean, ownershipMap?: Map<string, Object>, error?: string, code?: string, details?: Object }>}
 */
async function tryResolveProductOwnership(productIds, options = {}) {
  try {
    const ownershipMap = await resolveProductOwnership(productIds, options);
    return { success: true, ownershipMap };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      code: err.code || "UNKNOWN_ERROR",
      details: err.details || {},
    };
  }
}

module.exports = {
  resolveProductOwnership,
  tryResolveProductOwnership,
  VendorOwnershipResolverError,
};

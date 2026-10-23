/**
 * Fulfillment Builder Utility for M Wellness Bazaar
 * Phase 2.5A — Vendor-wise Fulfillment Preparation
 *
 * Prepares vendorFulfillments subdocuments for an Order from orderItems and verified ownership.
 * Pure function: No database calls, no mutations of input arguments.
 */

const crypto = require("crypto");

/**
 * Standard fulfillment initial status values directly aligned with Order.js schema
 */
const INITIAL_FULFILLMENT_STATUS = "Processing";
const INITIAL_SHIPPING_STATUS = "Pending";
const DEFAULT_COURIER = "standard";
const PLATFORM_VENDOR_NAME = "MetaFit Direct";

/**
 * Custom error class for fulfillment builder failures
 */
class FulfillmentBuilderError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = "FulfillmentBuilderError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Generates a unique, schema-compatible fulfillmentId.
 * Format: FUL-{orderNumberOrPrefix}-{vendorPart}-{index}-{randomSuffix}
 *
 * @param {string} [orderNumber] Optional orderNumber to incorporate
 * @param {string} [vendorPart] Short vendor or platform identifier
 * @param {number} [index] Group index
 * @returns {string} Unique fulfillment identifier
 */
function generateFulfillmentId(orderNumber, vendorPart = "VEND", index = 1) {
  const cleanOrder = orderNumber
    ? String(orderNumber).replace(/[^a-zA-Z0-9-]/g, "").toUpperCase()
    : `ORD-${Date.now()}`;
  const cleanVendor = String(vendorPart || "VEND").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-6);
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `FUL-${cleanOrder}-${cleanVendor}-${index}-${randomSuffix}`;
}

/**
 * Validates and normalizes ownership for a single order item.
 *
 * @param {Object} item Order item
 * @param {Map|Object} ownershipMap Resolved ownership map
 * @returns {Object} Normalized ownership
 */
function resolveItemOwnership(item, ownershipMap) {
  if (!item || typeof item !== "object") {
    throw new FulfillmentBuilderError(
      "Invalid order item encountered: item must be an object",
      "INVALID_ITEM",
      { item }
    );
  }

  const rawProductId = item.productId?._id || item.productId;
  if (!rawProductId) {
    throw new FulfillmentBuilderError(
      "Order item is missing required productId",
      "MISSING_PRODUCT_ID",
      { item }
    );
  }

  const productIdStr = String(rawProductId).trim();

  let ownership = null;
  if (ownershipMap instanceof Map) {
    ownership = ownershipMap.get(productIdStr);
  } else if (ownershipMap && typeof ownershipMap === "object") {
    ownership = ownershipMap[productIdStr];
  } else {
    throw new FulfillmentBuilderError(
      "ownershipMap must be a Map or an Object keyed by productId",
      "INVALID_OWNERSHIP_MAP",
      { ownershipMapType: typeof ownershipMap }
    );
  }

  if (!ownership) {
    throw new FulfillmentBuilderError(
      `Unresolved ownership: no ownership entry found for product ID ${productIdStr}`,
      "UNRESOLVED_OWNERSHIP",
      { productId: productIdStr, item }
    );
  }

  // Check for contradictory ownership
  const isPlatform = Boolean(ownership.isPlatform || ownership.type === "PLATFORM");
  const rawVendorId = ownership.vendorId !== undefined ? ownership.vendorId : null;

  if (isPlatform && rawVendorId !== null && rawVendorId !== undefined && String(rawVendorId).trim() !== "") {
    throw new FulfillmentBuilderError(
      `Contradictory ownership for product ID ${productIdStr}: product cannot be both platform-owned and vendor-owned`,
      "CONTRADICTORY_OWNERSHIP",
      { productId: productIdStr, ownership }
    );
  }

  if (isPlatform) {
    return {
      isPlatform: true,
      vendorId: null,
      vendorName: (typeof ownership.vendorName === "string" && ownership.vendorName.trim())
        ? ownership.vendorName.trim()
        : PLATFORM_VENDOR_NAME,
      groupKey: "platform:direct",
    };
  }

  // For vendor-owned items, vendorId is strictly required
  if (!rawVendorId || !String(rawVendorId).trim()) {
    throw new FulfillmentBuilderError(
      `Unresolved vendor ownership: product ID ${productIdStr} is not platform-owned, but vendorId is missing or empty`,
      "MISSING_VENDOR_ID",
      { productId: productIdStr, ownership }
    );
  }

  const vendorIdStr = String(rawVendorId).trim();
  const vName = (typeof ownership.vendorName === "string" && ownership.vendorName.trim())
    ? ownership.vendorName.trim()
    : "Vendor";

  return {
    isPlatform: false,
    vendorId: rawVendorId, // Preserves original ObjectId or string
    vendorIdStr,
    vendorName: vName,
    groupKey: `vendor:${vendorIdStr}`,
  };
}

/**
 * Pure builder function that groups order items into schema-compatible vendorFulfillments.
 *
 * @param {Array<Object>} orderItems Array of order items
 * @param {Map|Object} ownershipMap Validated product ownership mapping
 * @param {Object} [options] Optional configuration
 * @param {string} [options.orderNumber] Order number for deterministic fulfillment ID generation
 * @param {Date} [options.now] Optional fixed timestamp for deterministic testing
 * @returns {Array<Object>} Array of fulfillment objects matching Order.js schema
 */
function buildVendorFulfillments(orderItems, ownershipMap, options = {}) {
  if (!orderItems) {
    return [];
  }

  if (!Array.isArray(orderItems)) {
    throw new FulfillmentBuilderError(
      "orderItems must be an array",
      "INVALID_ORDER_ITEMS",
      { orderItemsType: typeof orderItems }
    );
  }

  if (orderItems.length === 0) {
    return [];
  }

  const now = options.now instanceof Date ? options.now : new Date();
  const orderNumber = options.orderNumber ? String(options.orderNumber).trim() : null;

  // Group items by resolved vendor identity
  // Map<groupKey, { isPlatform, vendorId, vendorName, items: [] }>
  const groups = new Map();

  for (let idx = 0; idx < orderItems.length; idx++) {
    const rawItem = orderItems[idx];
    const resolvedOwnership = resolveItemOwnership(rawItem, ownershipMap);

    const key = resolvedOwnership.groupKey;
    if (!groups.has(key)) {
      groups.set(key, {
        isPlatform: resolvedOwnership.isPlatform,
        vendorId: resolvedOwnership.vendorId,
        vendorName: resolvedOwnership.vendorName,
        vendorPart: resolvedOwnership.isPlatform ? "PLATFORM" : (resolvedOwnership.vendorIdStr || "VEND"),
        items: [],
      });
    }

    // Deep copy / snapshot item fields (guarantees immutability and preserves distinct variants)
    const clonedItem = {
      productId: rawItem.productId?._id || rawItem.productId,
      name: String(rawItem.name || ""),
      quantity: Number(rawItem.quantity || rawItem.qty || 1),
      price: Number(rawItem.price || 0),
    };

    if (rawItem.size !== undefined && rawItem.size !== null) {
      clonedItem.size = String(rawItem.size);
    }
    if (rawItem.color !== undefined && rawItem.color !== null) {
      clonedItem.color = String(rawItem.color);
    }
    if (rawItem.image) {
      clonedItem.image = String(rawItem.image);
    }

    groups.get(key).items.push(clonedItem);
  }

  // Convert groups into schema-compatible fulfillment objects
  const fulfillments = [];
  let groupIndex = 1;

  for (const group of groups.values()) {
    const fulfillmentId = generateFulfillmentId(orderNumber, group.vendorPart, groupIndex);

    const fulfillment = {
      fulfillmentId,
      vendorId: group.vendorId,
      vendorName: group.vendorName,
      items: group.items,
      status: INITIAL_FULFILLMENT_STATUS,
      statusHistory: [
        {
          status: INITIAL_FULFILLMENT_STATUS,
          timestamp: now,
          updatedBy: "System",
          note: "Order placed",
        },
      ],
      courier: DEFAULT_COURIER,
      awbNo: null,
      trackingId: null,
      shippingStatus: INITIAL_SHIPPING_STATUS,
      shippingError: null,
      error: null,
      pickupAddressSnapshot: null,
      bluedartGeneratedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    fulfillments.push(fulfillment);
    groupIndex++;
  }

  return fulfillments;
}

/**
 * Safe wrapper around buildVendorFulfillments that returns a result object
 * instead of throwing.
 *
 * @param {Array<Object>} orderItems Array of order items
 * @param {Map|Object} ownershipMap Validated product ownership mapping
 * @param {Object} [options] Optional configuration
 * @returns {{ success: boolean, fulfillments?: Array<Object>, error?: string, code?: string, details?: Object }}
 */
function tryBuildVendorFulfillments(orderItems, ownershipMap, options = {}) {
  try {
    const fulfillments = buildVendorFulfillments(orderItems, ownershipMap, options);
    return { success: true, fulfillments };
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
  buildVendorFulfillments,
  tryBuildVendorFulfillments,
  FulfillmentBuilderError,
  INITIAL_FULFILLMENT_STATUS,
  INITIAL_SHIPPING_STATUS,
  DEFAULT_COURIER,
  PLATFORM_VENDOR_NAME,
};

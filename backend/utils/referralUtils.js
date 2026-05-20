const ReferralAssignment = require("../models/ReferralAssignment");
const ReferralPurchase = require("../models/ReferralPurchase");

const normalizeReferralCode = (value) =>
  String(value || "").trim().toUpperCase();

const computeCommissionAmount = (orderAmount, commissionType, commissionValue) => {
  const amount = Number(orderAmount || 0);
  const value = Number(commissionValue || 0);

  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(value) || value <= 0) return 0;

  if (commissionType === "fixed") {
    return Math.min(value, amount);
  }

  return Number(((amount * value) / 100).toFixed(2));
};

const findAssignment = async ({ productId, vendorId, assignedProductId, ref }) => {
  const normalizedRef = normalizeReferralCode(ref);

  if (!productId || !vendorId || !assignedProductId || !normalizedRef) {
    return null;
  }

  return ReferralAssignment.findOne({
    productId,
    vendorId,
    assignedProductId: String(assignedProductId).trim(),
    isActive: true,
    $or: [{ shareCode: normalizedRef }, { refCode: normalizedRef }],
  });
};

const validateReferral = async ({ productId, vendorId, assignedProductId, ref }) => {
  const assignment = await findAssignment({
    productId,
    vendorId,
    assignedProductId,
    ref,
  });

  if (!assignment) {
    return {
      valid: false,
      message: "Referral link is invalid or inactive",
    };
  }

  return {
    valid: true,
    message: "Referral link is valid",
    assignment,
    normalizedRef: normalizeReferralCode(ref),
  };
};

const processReferralPurchase = async (payload = {}) => {
  const {
    orderId,
    orderObjectId,
    productId,
    vendorId,
    assignedProductId,
    shareCode,
    customerName,
    customerPhone,
    customerEmail,
    qty,
    orderAmount,
    paymentStatus,
    paymentReference,
    purchasedAt,
    source,
    metadata,
  } = payload;

  if (!orderId) {
    throw new Error("orderId is required");
  }

  const validation = await validateReferral({
    productId,
    vendorId,
    assignedProductId,
    ref: shareCode,
  });

  if (!validation.valid) {
    return {
      success: false,
      duplicate: false,
      message: validation.message,
    };
  }

  const assignment = validation.assignment;
  const commissionAmount = computeCommissionAmount(
    orderAmount,
    assignment.commissionType,
    assignment.commissionValue
  );

  const update = {
    orderObjectId: orderObjectId || null,
    assignmentId: assignment._id,
    productId,
    vendorId,
    assignedProductId: assignment.assignedProductId,
    shareCode: assignment.shareCode,
    refCode: assignment.refCode || "",
    customerName: String(customerName || "").trim(),
    customerPhone: String(customerPhone || "").trim(),
    customerEmail: String(customerEmail || "").trim().toLowerCase(),
    qty: Number(qty || 1),
    orderAmount: Number(orderAmount || 0),
    commissionType: assignment.commissionType,
    commissionValue: assignment.commissionValue,
    commissionAmount,
    paymentStatus: String(paymentStatus || "paid").trim(),
    paymentReference: String(paymentReference || "").trim(),
    purchasedAt: purchasedAt ? new Date(purchasedAt) : new Date(),
    source: String(source || "mwellness").trim(),
    metadata: metadata || {},
  };

  const existingPurchase = await ReferralPurchase.findOne({ orderId });
  const purchase = await ReferralPurchase.findOneAndUpdate(
    { orderId },
    { $set: update, $setOnInsert: { orderId } },
    { new: true, upsert: true }
  );

  return {
    success: true,
    duplicate: Boolean(existingPurchase),
    purchase,
    assignment,
  };
};

module.exports = {
  computeCommissionAmount,
  findAssignment,
  normalizeReferralCode,
  processReferralPurchase,
  validateReferral,
};

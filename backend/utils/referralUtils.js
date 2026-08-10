const mongoose = require("mongoose");
const ReferralAssignment = require("../models/ReferralAssignment");
const ReferralPurchase = require("../models/ReferralPurchase");

const normalizeReferralCode = (value) =>
  String(value || "").trim().toUpperCase();

const computeCommissionAmount = (orderAmount, commissionType, commissionValue) => {
  const amount = Number(orderAmount || 0);
  const value = Number(commissionValue || 0);

  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(value) || value <= 0) return 0;

  // Deduct mwellness shop 15% cut before applying commission
  const platformCutPercent = 15;
  const platformCutAmount = (amount * platformCutPercent) / 100;
  const vendorProductRevenue = amount - platformCutAmount;

  const type = String(commissionType || "").toLowerCase();
  if (type === "fixed" || type === "flat") {
    return Math.min(value, vendorProductRevenue);
  }

  return Number(((vendorProductRevenue * value) / 100).toFixed(2));
};

const findAssignment = async ({ productId, vendorId, assignedProductId, ref }) => {
  const normalizedRef = normalizeReferralCode(ref);

  if (!normalizedRef) {
    return null;
  }

  const query = {
    isActive: true,
    $or: [{ shareCode: normalizedRef }, { refCode: normalizedRef }],
  };

  return ReferralAssignment.findOne(query).populate("productId", "name");
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
    vendorId: mongoose.Types.ObjectId.isValid(vendorId) ? new mongoose.Types.ObjectId(vendorId) : null,
    externalVendorId: !mongoose.Types.ObjectId.isValid(vendorId) ? String(vendorId) : "",
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

  const existingPurchase = await ReferralPurchase.findOne({ orderId, productId });
  const purchase = await ReferralPurchase.findOneAndUpdate(
    { orderId, productId },
    { $set: update },
    { new: true, upsert: true }
  );

  const isNewPurchase = !existingPurchase;

  if (isNewPurchase) {
    try {
      const {
        sendWhatsAppVendorOrderNotification,
        sendWhatsAppAdminOrderNotification,
      } = require("../config/whatsappServices");
      
      const vendorName = assignment.vendorSnapshot?.name || "Referral Vendor";
      const vendorPhone = assignment.vendorSnapshot?.phone || "";
      const productNameForMsg = assignment.productId?.name || "Product";
      
      const whatsappPromises = [];
      
      if (vendorPhone) {
        whatsappPromises.push(
          sendWhatsAppVendorOrderNotification({
            vendor_phone: vendorPhone,
            vendor_name: vendorName,
            orderId: String(orderId),
            product: productNameForMsg,
            quantity: String(qty || 1),
            total_amount: `Rs. ${commissionAmount} (Commission)`,
            customer_name: customerName || "Customer",
            customer_phone: customerPhone || "N/A",
            address: "Online Referral Sale",
            number: process.env.ADMIN_WHATSAPP_PHONE || "",
          }).catch(err => console.error("Failed to send WhatsApp to referral vendor:", err.message))
        );
      }
      
      whatsappPromises.push(
        sendWhatsAppAdminOrderNotification({
          admin_phone: process.env.ADMIN_WHATSAPP_PHONE || "",
          orderId: String(orderId),
          product: `(Referral by ${vendorName}) ${productNameForMsg}`,
          quantity: String(qty || 1),
          total_amount: `Commission: Rs. ${commissionAmount} / Total: Rs. ${orderAmount}`,
          name: customerName || "Customer",
          phone: customerPhone || "N/A",
          address: "Online Referral Sale"
        }).catch(err => console.error("Failed to send WhatsApp admin referral notification:", err.message))
      );
      
      Promise.all(whatsappPromises).catch(() => {});
    } catch (err) {
      console.error("Error setting up referral WhatsApp notifications:", err.message);
    }
  }

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

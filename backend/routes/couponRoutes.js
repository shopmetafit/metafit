const express = require("express");
const Coupon = require("../models/Coupon");

const router = express.Router();

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
};

const nowInRange = (startsAt, endsAt, now) => {
  if (startsAt && now < startsAt) 
    return false;
  
  if (endsAt && now > endsAt) 
    return false;

  return true;
};

// Public: validate + calculate discount amount for a code.
// POST /api/coupons/apply  { code, subtotal }
router.post("/apply", async (req, res) => {
  try {
    const code = normalizeCode(req.body?.code);
    const subtotal = toNumber(req.body?.subtotal);
    const products = req.body?.products || [];
    const productIds = products.map(p => p.productId);

    if (!code) return res.status(400).json({ message: "Coupon code is required" });
    if (Number.isNaN(subtotal) || subtotal <= 0) {
      return res.status(400).json({ message: "Valid subtotal is required" });
    }

    const coupon = await Coupon.findOne({ code }).lean();
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
    if (!coupon.isActive) return res.status(400).json({ message: "Coupon is inactive" });

    const now = new Date();
    if (!nowInRange(coupon.startsAt, coupon.endsAt, now)) {
      return res.status(400).json({ message: "Coupon is not valid at this time" });
    }

    if (Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = productIds.some(pid => 
        coupon.applicableProducts.map(String).includes(String(pid))
      );
      if (!hasApplicableProduct) {
        return res.status(400).json({ message: "Coupon is not applicable to any product in your cart" });
      }
    }

    const minOrderAmount = Number(coupon.minOrderAmount || 0);
    if (subtotal < minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount is ₹${minOrderAmount}` });
    }

    const usageLimit =
      coupon.usageLimit === null || coupon.usageLimit === undefined ? null : Number(coupon.usageLimit);
    const usedCount = Number(coupon.usedCount || 0);
    if (usageLimit !== null && usedCount >= usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    let applicableSubtotal = subtotal;
    if (Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0 && products.length > 0) {
      const applicableProductIds = coupon.applicableProducts.map(String);
      applicableSubtotal = products.reduce((sum, item) => {
        if (applicableProductIds.includes(String(item.productId))) {
          return sum + (Number(item.price || 0) * Number(item.quantity || 1));
        }
        return sum;
      }, 0);
      if (applicableSubtotal <= 0) return res.status(400).json({ message: "Coupon is not applicable to any product in your cart" });
    }

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      const percent = Number(coupon.value);
      discountAmount = (applicableSubtotal * percent) / 100;
      const cap =
        coupon.maxDiscountAmount === null || coupon.maxDiscountAmount === undefined
          ? null
          : Number(coupon.maxDiscountAmount);
      if (cap !== null && Number.isFinite(cap)) {
        discountAmount = Math.min(discountAmount, cap);
      }
    } else if (coupon.type === "fixed") {
      discountAmount = Number(coupon.value);
    } else {
      return res.status(400).json({ message: "Coupon type is invalid" });
    }

    discountAmount = Math.max(0, Math.min(discountAmount, applicableSubtotal));

    return res.json({
      code: coupon.code,
      discountAmount,
      type: coupon.type,
      value: coupon.value,
    });
  } catch (error) {
    console.error("COUPON APPLY ERROR 👉", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


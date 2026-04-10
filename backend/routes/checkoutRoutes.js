const express = require("express");
const Product = require("../models/Product");
const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const isCouponCurrentlyValid = (coupon, now) => {
  if (!coupon) return false;
  if (coupon.isActive === false) return false;
  if (coupon.startsAt && now < coupon.startsAt) return false;
  if (coupon.endsAt && now > coupon.endsAt) return false;
  return true;
};

const computeCouponDiscount = (coupon, subtotal) => {
  if (!coupon) return 0;
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;

  const minOrderAmount = Number(coupon.minOrderAmount || 0);
  if (subtotal < minOrderAmount) return 0;

  let discountAmount = 0;
  if (coupon.type === "percentage") {
    const percent = Number(coupon.value);
    if (!Number.isFinite(percent) || percent <= 0) return 0;
    discountAmount = (subtotal * percent) / 100;
    const cap = coupon.maxDiscountAmount === null || coupon.maxDiscountAmount === undefined
      ? null
      : Number(coupon.maxDiscountAmount);
    if (cap !== null && Number.isFinite(cap)) {
      discountAmount = Math.min(discountAmount, cap);
    }
  } else if (coupon.type === "fixed") {
    const amount = Number(coupon.value);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    discountAmount = amount;
  } else {
    return 0;
  }

  return Math.max(0, Math.min(discountAmount, subtotal));
};

// @route POST / api/ checkout
// @desc Create a new checkout session
// @access Private

router.post("/", protect, async (req, res) => {
  const { checkoutItems, shippingAddress, paymentMethod, totalPrice, couponCode } =
    req.body;
  if (!checkoutItems || checkoutItems.length === 0) {
    return res.status(400).json({ message: "No items in checkout" });
  }

  try {
    // Calculate delivery charge (fixed 30 rupees for all cities)
    const deliveryCharge = 30;

    // Calculate total from items (authoritative source)
    const itemsTotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const code = normalizeCode(couponCode);
    let discountAmount = 0;

    if (code) {
      const coupon = await Coupon.findOne({ code }).lean();
      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon code" });
      }

      const now = new Date();
      if (!isCouponCurrentlyValid(coupon, now)) {
        return res.status(400).json({ message: "Coupon is not valid at this time" });
      }

      const usageLimit =
        coupon.usageLimit === null || coupon.usageLimit === undefined ? null : Number(coupon.usageLimit);
      const usedCount = Number(coupon.usedCount || 0);
      if (usageLimit !== null && usedCount >= usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }

      discountAmount = computeCouponDiscount(coupon, itemsTotal);

      if (discountAmount <= 0) {
        const minOrderAmount = Number(coupon.minOrderAmount || 0);
        if (itemsTotal < minOrderAmount) {
          return res.status(400).json({ message: `Minimum order amount is ₹${minOrderAmount}` });
        }
      }
    }

    // Use calculated total with delivery charge (ignore frontend price)
    const correctTotal = Math.max(itemsTotal + deliveryCharge - discountAmount, 0);

    // create a new checkout session
    const newCheckout = await Checkout.create({
      user: req.user._id,
      checkoutItems,
      shippingAddress,
      paymentMethod,
      totalPrice: correctTotal,
      deliveryCharge,
      couponCode: code,
      couponDiscount: discountAmount,
      paymentStatus: "Pending",
      isPaid: false,
    });
    // console.log(`Checkout created for user : ${req.user._id}`);
    res.status(201).json(newCheckout);
  } catch (error) {
    console.error("Error creating checkout session", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST / api/ checkout/:id/pay
// @desc update checkout to mark as paid after successful payment
// @access Private
router.put("/:id/pay", protect, async (req, res) => {
  const { paymentStatus, paymentDetails } = req.body;
  // console.log(paymentDetails);
  try {
    const checkout = await Checkout.findById(req.params.id);
    if (!checkout) {
      res.status(404).json({ message: "Checkout not found" });
    }
    if (paymentStatus === "paid") {
      checkout.isPaid = true;
      checkout.paymentStatus = paymentStatus;
      checkout.paymentDetails = paymentDetails;
      checkout.paidAt = Date.now();
      await checkout.save();
      res.status(201).json(checkout);
    } else {
      res.status(404).json({ message: "Invalid payment status" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST / api/ checkout/:id/finalised
// @desc finalize checkout and convert to an order after payment confirmation
// @access Private
router.post("/:id/finalize", protect, async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);
    if (!checkout) {
      res.status(404).json({ message: "Checkout not found" });
    }
    if (checkout.isFinalized) {
      return res.status(400).json({ message: "Checkout already finalized" });
    }
    if (checkout.isPaid) {
      // create final order based on checkout details
      const finalOrder = await Order.create({
        user: checkout.user,
        orderItems: checkout.checkoutItems,
        shippingAddress: checkout.shippingAddress,
        paymentMethod: checkout.paymentMethod,
        totalPrice: checkout.totalPrice,
        deliveryCharge: checkout.deliveryCharge,
        couponCode: checkout.couponCode || "",
        couponDiscount: checkout.couponDiscount || 0,
        isPaid: true,
        paidAt: checkout.paidAt,
        isDelivered: false,
        paymentStatus: "paid",
        paymentDetails: checkout.paymentDetails,
      });
      // mark the checkout as finalized
      (checkout.isFinalized = true), (checkout.finalizedAt = Date.now());
      await checkout.save();

      if (checkout.couponCode && checkout.couponDiscount > 0) {
        await Coupon.findOneAndUpdate(
          { code: normalizeCode(checkout.couponCode) },
          { $inc: { usedCount: 1 } }
        ).catch(() => null);
      }
      // Delete the cart associated with the user

      await Cart.findOneAndDelete({ user: checkout.user });
      res.status(201).json(finalOrder);
    } else {
      res.status(400).json({ message: "Checkout is not paid" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

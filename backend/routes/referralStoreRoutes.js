const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Checkout = require("../models/Checkout");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");
const { getProductReadModel } = require("../utils/productDataAccess");
const { validateReferral, normalizeReferralCode, processReferralPurchase } = require("../utils/referralUtils");

const router = express.Router();

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const isCouponCurrentlyValid = (coupon, now) => {
  if (!coupon) return false;
  if (coupon.isActive === false) return false;
  if (coupon.startsAt && now < coupon.startsAt) return false;
  if (coupon.endsAt && now > coupon.endsAt) return false;
  return true;
};

const computeCouponDiscount = (coupon, cartSubtotal, items) => {
  if (!coupon) return 0;
  if (!Number.isFinite(cartSubtotal) || cartSubtotal <= 0) return 0;

  const minOrderAmount = Number(coupon.minOrderAmount || 0);
  if (cartSubtotal < minOrderAmount) return 0;

  let applicableSubtotal = cartSubtotal;
  if (Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0 && items && items.length > 0) {
    const applicableProductIds = coupon.applicableProducts.map(String);
    applicableSubtotal = items.reduce((sum, item) => {
      if (applicableProductIds.includes(String(item.productId))) {
        return sum + (Number(item.price || 0) * Number(item.quantity || 1));
      }
      return sum;
    }, 0);
    if (applicableSubtotal <= 0) return 0;
  }

  if (coupon.type === "percentage") {
    const percent = Number(coupon.value);
    const cap =
      coupon.maxDiscountAmount === null || coupon.maxDiscountAmount === undefined
        ? null
        : Number(coupon.maxDiscountAmount);

    let discountAmount = (applicableSubtotal * percent) / 100;
    if (cap !== null && Number.isFinite(cap)) {
      discountAmount = Math.min(discountAmount, cap);
    }
    return Math.max(0, Math.min(discountAmount, applicableSubtotal));
  }

  if (coupon.type === "fixed") {
    return Math.max(0, Math.min(Number(coupon.value || 0), applicableSubtotal));
  }

  return 0;
};

router.get("/referrals/validate", async (req, res) => {
  try {
    const { productId, vendorId, assignedProductId, ref } = req.query;
    const validation = await validateReferral({ productId, vendorId, assignedProductId, ref });

    if (!validation.valid) {
      return res.status(404).json(validation);
    }

    res.json({
      valid: true,
      productId,
      vendorId,
      assignedProductId,
      shareCode: validation.assignment.shareCode,
      refCode: validation.assignment.refCode,
      commissionType: validation.assignment.commissionType,
      commissionValue: validation.assignment.commissionValue,
    });
  } catch (error) {
    console.error("Error validating referral", error);
    res.status(500).json({ valid: false, message: "Failed to validate referral" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const ProductReadModel = await getProductReadModel();
    const product = await ProductReadModel.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { vendorId, assignedProductId, ref } = req.query;
    let referral = null;

    if (vendorId && assignedProductId && ref) {
      const validation = await validateReferral({
        productId: req.params.id,
        vendorId,
        assignedProductId,
        ref,
      });

      referral = validation.valid
        ? {
            valid: true,
            vendorId,
            assignedProductId,
            shareCode: validation.assignment.shareCode,
            refCode: validation.assignment.refCode,
          }
        : {
            valid: false,
            message: validation.message,
          };
    }

    res.json({ product, referral });
  } catch (error) {
    console.error("Error fetching store product", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

router.post("/orders", async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    totalPrice,
    couponCode,
    customerName,
    customerPhone,
    customerEmail,
    productId,
    vendorId,
    assignedProductId,
    shareCode,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: "No items in order" });
  }

  try {
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded?.user?.id || decoded?.id;
      } catch (err) {}
    }

    if (!userId) {
      const phone = customerPhone || shippingAddress?.phone;
      const email = customerEmail;
      const name = customerName || `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim();

      if (!phone) {
        return res.status(400).json({ message: "Phone number is required for checkout" });
      }

      let user = await User.findOne({ phone });
      
      if (!user && email) {
        user = await User.findOne({ email });
        if (user && !user.phone) {
          user.phone = phone;
          await user.save();
        }
      }

      if (user) {
        userId = user._id;
        
        // Check if a new email is provided that differs from the primary email
        if (email && user.email !== email && !email.includes('@guest.metafit.com')) {
          if (!user.alternateEmails.includes(email)) {
            user.alternateEmails.push(email);
            await user.save();
          }
        }
      } else {
        user = await User.create({
          name: name || "Guest User",
          email: email || `${phone}@guest.metafit.com`,
          phone: phone,
          role: "customer"
        });
        userId = user._id;
      }
    }

    const productIds = orderItems.map((item) => item.productId);
    const ProductReadModel = await getProductReadModel();
    const products = await ProductReadModel.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const normalizedItems = orderItems.map((item) => {
      const product = productMap.get(String(item.productId));
      return {
        productId: item.productId,
        name: item.name || product?.name || "Product",
        image: item.image || product?.images?.[0]?.url || "https://via.placeholder.com/150",
        price: Number(item.price ?? product?.discountPrice ?? product?.price ?? 0),
        quantity: Number(item.quantity || item.qty || 1),
        size: item.size,
        color: item.color,
      };
    });

    let deliveryCharge = 0;
    const itemsTotal = normalizedItems.reduce((sum, item) => {
      const product = productMap.get(String(item.productId));
      const shipping = Number(product?.shippingCharge ?? 100);
      deliveryCharge += shipping;
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);

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

      if (Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0) {
        const hasApplicableProduct = productIds.some(pid => 
          coupon.applicableProducts.map(String).includes(String(pid))
        );
        if (!hasApplicableProduct) {
          return res.status(400).json({ message: "Coupon is not applicable to any product in your cart" });
        }
      }

      discountAmount = computeCouponDiscount(coupon, itemsTotal, normalizedItems);
    }

    const checkout = await Checkout.create({
      user: userId,
      checkoutItems: normalizedItems,
      shippingAddress,
      paymentMethod,
      totalPrice: Math.max(itemsTotal + deliveryCharge - discountAmount, 0),
      deliveryCharge,
      couponCode: code,
      couponDiscount: discountAmount,
      paymentStatus: "Pending",
      isPaid: false,
      customerName,
      customerPhone,
      customerEmail,
      referral: productId && vendorId && assignedProductId && shareCode
        ? {
            productId: mongoose.Types.ObjectId.isValid(productId) ? new mongoose.Types.ObjectId(productId) : null,
            vendorId: mongoose.Types.ObjectId.isValid(vendorId) ? new mongoose.Types.ObjectId(vendorId) : null,
            externalVendorId: !mongoose.Types.ObjectId.isValid(vendorId) ? String(vendorId) : "",
            assignedProductId,
            shareCode: normalizeReferralCode(shareCode),
          }
        : undefined,
    });

    res.status(201).json({
      id: checkout._id,
      orderId: checkout._id,
      paymentStatus: checkout.paymentStatus,
      totalPrice: checkout.totalPrice,
    });
  } catch (error) {
    console.error("Error creating store order", error);
    res.status(500).json({ message: `Failed to create order: ${error.message}` });
  }
});

router.post("/orders/:id/payment-success", async (req, res) => {
  const { paymentStatus, paymentReference } = req.body;

  try {
    const checkout = await Checkout.findById(req.params.id);
    if (!checkout) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (checkout.isPaid && checkout.isFinalized) {
      const existingOrder = await Order.findOne({ checkoutId: checkout._id });
      return res.json({
        success: true,
        duplicate: true,
        order: existingOrder,
      });
    }

    checkout.isPaid = paymentStatus === "paid";
    checkout.paymentStatus = paymentStatus || "paid";
    checkout.paymentDetails = {
      paymentReference: String(paymentReference || "").trim(),
    };
    checkout.paidAt = new Date();
    await checkout.save();

    let order = await Order.findOne({ paymentId: String(paymentReference || "").trim() });
    
    if (order) {
      // Order was already created by verifyPayment, so just update it with missing fields
      order.checkoutId = checkout._id;
      order.customerName = checkout.customerName || "";
      order.customerPhone = checkout.customerPhone || "";
      order.customerEmail = checkout.customerEmail || "";
      order.referral = checkout.referral;
      order.couponCode = checkout.couponCode || "";
      order.couponDiscount = checkout.couponDiscount || 0;
      await order.save();
    } else {
      order = await Order.create({
        user: checkout.user,
        checkoutId: checkout._id,
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
        paymentId: String(paymentReference || "").trim(),
        paymentDetails: checkout.paymentDetails,
        customerName: checkout.customerName || "",
        customerPhone: checkout.customerPhone || "",
        customerEmail: checkout.customerEmail || "",
        referral: checkout.referral,
      });
    }

    checkout.isFinalized = true;
    checkout.finalizedAt = new Date();
    await checkout.save();

    await Cart.findOneAndDelete({ user: checkout.user }).catch(() => null);

    if (checkout.referral?.productId && (checkout.referral?.vendorId || checkout.referral?.externalVendorId) && checkout.referral?.assignedProductId && checkout.referral?.shareCode) {
      const referredItem = checkout.checkoutItems.find(
        (item) => String(item.productId) === String(checkout.referral.productId)
      );

      if (referredItem) {
        await processReferralPurchase({
          orderId: String(order._id),
          orderObjectId: order._id,
          productId: referredItem.productId,
          vendorId: checkout.referral.vendorId || checkout.referral.externalVendorId,
          assignedProductId: checkout.referral.assignedProductId,
          shareCode: checkout.referral.shareCode,
          customerName: checkout.customerName,
          customerPhone: checkout.customerPhone,
          customerEmail: checkout.customerEmail,
          qty: referredItem.quantity || 1,
          orderAmount: Number(referredItem.price || 0) * Number(referredItem.quantity || 1),
          paymentStatus: "paid",
          paymentReference,
          source: "mwellness-store",
          metadata: {
            checkoutId: checkout._id,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error marking payment success", error);
    res.status(500).json({ message: "Failed to finalize paid order" });
  }
});

module.exports = router;

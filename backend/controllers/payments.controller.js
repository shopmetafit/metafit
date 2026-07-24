const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
const razorpayInstance = createRazorpayInstance();
const transporter = require("../utils/email");
const { generateBuyerEmail, generateSellerEmail, generateAdminOrderEmail } = require("../utils/emailTemplate");
const { sendWhatsAppOrderConfirmation, sendWhatsAppAdminOrderNotification, sendWhatsAppVendorOrderNotification } = require("../config/whatsappServices");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const AdminProductSale = require("../models/AdminProductSale");
const Checkout = require("../models/Checkout");

/**
 * 1. CUSTOMER clicks "Place Order"
 * -> Backend recalculates prices, shipping, and total strictly from DB
 * -> Backend creates Razorpay Order
 * -> Save Pending Payment Record in DB
 * -> Return Razorpay Order ID & server-calculated total
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      courseId,
      checkoutId,
      amount,
      products: bodyProducts,
      email,
      customerEmail,
      phone,
      customerPhone,
      firstName,
      lastName,
      customerName,
      address,
      city,
      postalCode,
      country,
      shippingAddress: bodyShippingAddress,
      referral: bodyReferral,
      couponCode: bodyCouponCode,
      couponDiscount: bodyCouponDiscount,
      deliveryCharge: bodyDeliveryCharge,
      userId,
      user: userIdBody,
    } = req.body;

    const targetCheckoutId = checkoutId || courseId;
    let checkoutDoc = null;
    if (targetCheckoutId) {
      checkoutDoc = await Checkout.findById(targetCheckoutId).catch(() => null);
    }

    // Resolve products array
    let products = bodyProducts;
    if ((!products || !products.length) && checkoutDoc && checkoutDoc.checkoutItems) {
      products = checkoutDoc.checkoutItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));
    }

    // Resolve shipping address & user info
    const shippingAddress = bodyShippingAddress || (checkoutDoc ? checkoutDoc.shippingAddress : null);
    const targetCity = shippingAddress?.city || city || "";
    const targetEmail = email || customerEmail || (checkoutDoc ? checkoutDoc.customerEmail : "");
    const targetPhone = phone || customerPhone || (checkoutDoc ? checkoutDoc.customerPhone : "");
    const targetCustomerName = customerName || (checkoutDoc ? checkoutDoc.customerName : `${firstName || ""} ${lastName || ""}`.trim());
    const couponCode = bodyCouponCode || (checkoutDoc ? checkoutDoc.couponCode : "");
    const rawCouponDiscount = bodyCouponDiscount ?? (checkoutDoc ? checkoutDoc.couponDiscount : 0);
    const referral = bodyReferral || (checkoutDoc ? checkoutDoc.referral : undefined);

    let calculatedProductsTotal = 0;
    let calculatedShipping = 0;
    const orderItems = [];

    if (Array.isArray(products) && products.length > 0) {
      const productIds = products.map((p) => p.productId).filter(Boolean);
      const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
      const dbProductMap = new Map();
      dbProducts.forEach((dbP) => dbProductMap.set(dbP._id.toString(), dbP));

      for (const item of products) {
        if (!item.productId) continue;
        const dbProduct = dbProductMap.get(item.productId.toString());
        if (!dbProduct) {
          return res.status(404).json({
            success: false,
            message: `Product not found: ${item.productId}`,
          });
        }

        // Gather valid prices from DB
        const validPrices = [dbProduct.price, dbProduct.discountPrice].filter(Boolean);
        if (Array.isArray(dbProduct.variants) && dbProduct.variants.length > 0) {
          dbProduct.variants.forEach((v) => {
            if (v.price) validPrices.push(v.price);
            if (v.discountPrice) validPrices.push(v.discountPrice);
          });
        }
        if (Array.isArray(dbProduct.sizes) && dbProduct.sizes.length > 0) {
          dbProduct.sizes.forEach((sizeStr) => {
            if (typeof sizeStr === "string" && sizeStr.includes(":")) {
              const parts = sizeStr.split(":");
              if (parts.length >= 2 && !isNaN(Number(parts[1]))) validPrices.push(Number(parts[1]));
              if (parts.length >= 3 && !isNaN(Number(parts[2]))) validPrices.push(Number(parts[2]));
            }
          });
        }

        // Determine item price strictly from DB
        let validItemPrice = dbProduct.discountPrice || dbProduct.price || 0;
        if (item.price && validPrices.includes(Number(item.price))) {
          validItemPrice = Number(item.price);
        }

        const qty = Math.max(Number(item.quantity || 1), 1);
        calculatedProductsTotal += validItemPrice * qty;

        // Determine shipping charge from DB
        let itemShipping = dbProduct.shippingCharge ?? 100;
        if (targetCity && Array.isArray(dbProduct.freeShippingCities) && dbProduct.freeShippingCities.length > 0) {
          const match = dbProduct.freeShippingCities.some(
            (c) => c.trim().toLowerCase() === targetCity.trim().toLowerCase()
          );
          if (match) {
            itemShipping = Number(dbProduct.localShippingCharge ?? 0);
          }
        }
        calculatedShipping += itemShipping;

        orderItems.push({
          productId: dbProduct._id,
          name: item.name || dbProduct.name,
          image: item.image || (dbProduct.images && dbProduct.images[0]) || "",
          price: validItemPrice,
          size: item.size || null,
          color: item.color || null,
          quantity: qty,
        });
      }
    } else {
      const fallbackAmount = Number(amount);
      if (!fallbackAmount || isNaN(fallbackAmount) || fallbackAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Products or valid amount required to create order",
        });
      }
      calculatedProductsTotal = fallbackAmount;
    }

    const couponDiscount = Math.max(Number(rawCouponDiscount || 0), 0);
    const calculatedTotal = Math.max(calculatedProductsTotal + calculatedShipping - couponDiscount, 0);

    const option = {
      amount: Math.round(calculatedTotal * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(option);

    // Find User
    let resolvedUser = null;
    const targetUserId = userId || userIdBody || (checkoutDoc ? checkoutDoc.user : null);

    if (targetUserId) resolvedUser = await User.findById(targetUserId).catch(() => null);
    if (!resolvedUser && targetEmail) resolvedUser = await User.findOne({ email: targetEmail }).catch(() => null);
    if (!resolvedUser && targetPhone) resolvedUser = await User.findOne({ phone: targetPhone }).catch(() => null);

    const finalAddress = shippingAddress?.address || address || "Not provided";
    const finalCity = targetCity || "Not provided";
    const finalPostalCode = shippingAddress?.postalCode || postalCode || "Not provided";
    const finalCountry = shippingAddress?.country || country || "India";

    const pendingOrder = new Order({
      user: resolvedUser ? resolvedUser._id : null,
      checkoutId: checkoutDoc ? checkoutDoc._id : null,
      orderItems,
      shippingAddress: {
        address: finalAddress,
        city: finalCity,
        postalCode: finalPostalCode,
        country: finalCountry,
      },
      customerName: targetCustomerName || "Customer",
      customerPhone: targetPhone || "",
      customerEmail: targetEmail || "",
      paymentMethod: "Razorpay",
      totalPrice: calculatedTotal,
      deliveryCharge: calculatedShipping,
      couponCode: couponCode || "",
      couponDiscount,
      isPaid: false,
      paymentStatus: "Pending",
      paymentId: razorpayOrder.id,
      paymentDetails: {
        razorpay_order_id: razorpayOrder.id,
      },
      status: "Processing",
      referral: referral || undefined,
    });

    await pendingOrder.save();

    return res.status(200).json({
      ...razorpayOrder,
      success: true,
      orderId: pendingOrder._id,
      pendingOrderId: pendingOrder._id,
      calculatedTotal,
      calculatedShipping,
    });
  } catch (error) {
    console.error("✗ Error in createOrder:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message,
    });
  }
};

/**
 * Shared Payment Completion Processor
 * Used by both Razorpay Webhook (Primary) & verifyPayment (Frontend Callback)
 */
async function processPaymentCompletion({
  razorpay_order_id,
  razorpay_payment_id,
  signature,
  paymentData = {},
}) {

  // 1. Find Pending Order Record in DB (Strict: No silent creation if missing)
  let order = null;
  if (razorpay_order_id) {
    order = await Order.findOne({
      $or: [
        { "paymentDetails.razorpay_order_id": razorpay_order_id },
        { paymentId: razorpay_order_id },
      ],
    });
  }

  if (!order && razorpay_payment_id) {
    order = await Order.findOne({ paymentId: razorpay_payment_id });
  }

  if (!order) {
    console.error(`❌ Pending Order not found for Razorpay Order ID: ${razorpay_order_id || razorpay_payment_id}`);
    throw new Error(`Pending Order not found for Razorpay Order ID: ${razorpay_order_id || razorpay_payment_id}`);
  }

  // 2. Check Already Processed? (Idempotency)
  if (order.isPaid || order.paymentStatus === "Completed") {
    return {
      success: true,
      message: "Order already processed",
      orderId: order._id,
      orderNumber: order.orderNumber,
      alreadyProcessed: true,
    };
  }

  // 3. Amount Validation
  const paidAmountPaise = paymentData.amount || paymentData.total_amount;
  if (paidAmountPaise && !isNaN(Number(paidAmountPaise))) {
    const paidAmountRupees = Number(paidAmountPaise) > 10000 && Number(paidAmountPaise) % 100 === 0
      ? Number(paidAmountPaise) / 100
      : Number(paidAmountPaise);

    if (Math.abs(paidAmountRupees - order.totalPrice) > 0.01) {
      console.error(`🚨 SECURITY ALERT: Payment amount mismatch! Paid: ₹${paidAmountRupees}, Expected: ₹${order.totalPrice}`);
      throw new Error(`Payment amount mismatch. Paid: ₹${paidAmountRupees}, Expected: ₹${order.totalPrice}`);
    }
  }

  // 4. Finalize & Save Order FIRST
  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentStatus = "Completed";
  order.paymentId = razorpay_payment_id || order.paymentId;
  if (!order.paymentDetails) order.paymentDetails = {};
  order.paymentDetails.razorpay_payment_id = razorpay_payment_id;
  if (signature) order.paymentDetails.razorpay_signature = signature;
  if (razorpay_order_id) order.paymentDetails.razorpay_order_id = razorpay_order_id;
  order.status = "Processing";

  await order.save();
  const savedOrderId = order._id;
  const finalOrderNumber = order.orderNumber || razorpay_payment_id || String(order._id);

  // 5. Update Product Stock & Save Admin Product Sales AFTER Order is guaranteed saved
  const products = order.orderItems || [];
  const dbProductMap = new Map();
  const vendorMap = new Map();
  let primaryVendor = null;

  if (Array.isArray(products) && products.length > 0) {
    const productIds = products.map((p) => p.productId).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
    dbProducts.forEach((dbP) => dbProductMap.set(dbP._id.toString(), dbP));

    const vendorIds = [
      ...new Set(
        dbProducts.filter((p) => p.vendorId).map((p) => p.vendorId.toString())
      ),
    ];
    const vendors = await Vendor.find({ _id: { $in: vendorIds } }).lean();
    const vendorsById = new Map();
    vendors.forEach((v) => vendorsById.set(v._id.toString(), v));

    for (const item of products) {
      if (!item.productId) continue;

      // Decrement Stock safely
      const qtyToDecrement = Number(item.quantity || 1);
      try {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { countInStock: -qtyToDecrement } }
        );
      }
      catch (stockErr) {
        console.error(`✗ Failed to update stock for Product ${item.productId}:`, stockErr.message);
      }

      const dbProduct = dbProductMap.get(item.productId.toString());
      if (dbProduct) {
        if (dbProduct.createdBy === "VENDOR" && dbProduct.vendorId) {
          const vendorIdStr = dbProduct.vendorId.toString();
          const vendorObj = vendorsById.get(vendorIdStr);
          if (vendorObj) {
            if (!vendorMap.has(vendorIdStr)) {
              vendorMap.set(vendorIdStr, { vendor: vendorObj, products: [item] });
              if (!primaryVendor) primaryVendor = vendorObj;
            } else {
              vendorMap.get(vendorIdStr).products.push(item);
            }
          }
        } else {
          if (!vendorMap.has("ADMIN")) {
            vendorMap.set("ADMIN", {
              vendor: {
                email: process.env.SELLER_EMAIL,
                phone: process.env.ADMIN_WHATSAPP_PHONE,
                vendorName: "Admin",
              },
              products: [item],
            });
          } else {
            vendorMap.get("ADMIN").products.push(item);
          }
        }

        // Save Admin Product Sales
        if (dbProduct.createdBy === "ADMIN") {
          const qty = item.quantity || 1;
          const price = item.price || dbProduct.price || 0;
          const totalAmountItem = price * qty;

          await AdminProductSale.findOneAndUpdate(
            { orderObjectId: savedOrderId, productId: item.productId },
            {
              $setOnInsert: {
                orderId: String(savedOrderId),
                productId: item.productId,
                name: item.name || dbProduct.name,
                price,
                qty,
                totalAmount: totalAmountItem,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                customerEmail: order.customerEmail,
                paymentStatus: "paid",
                paymentReference: razorpay_payment_id,
                purchasedAt: new Date(),
              },
            },
            { upsert: true, new: true }
          ).catch((err) => console.error("✗ Failed to save AdminProductSale:", err.message));
        }
      }
    }
  }

  // 6. Build product HTML for emails
  let productListHtml = "";
  if (Array.isArray(products) && products.length > 0) {
    productListHtml = products
      .map((p) => {
        let details = `${p.name} - ₹${p.price}`;
        const attributes = [];
        if (p.quantity) attributes.push(`Qty: ${p.quantity}`);
        if (p.size) attributes.push(`Size: ${typeof p.size === "string" ? p.size.split(":")[0] : p.size}`);
        if (p.color) attributes.push(`Color: ${p.color}`);
        if (attributes.length > 0) {
          details += ` (${attributes.join(", ")})`;
        }
        return `<li>${details}</li>`;
      })
      .join("");
  } else {
    productListHtml = "<li>Products information not available</li>";
  }

  // 7. Send Emails & WhatsApp Notifications
  const firstName = order.customerName ? order.customerName.split(" ")[0] : "Customer";
  const lastName = order.customerName ? order.customerName.split(" ").slice(1).join(" ") : "";
  const addressStr = order.shippingAddress?.address || "Not provided";
  const totalAmount = order.totalPrice;

  const buyerEmailHtml = generateBuyerEmail(firstName, productListHtml, totalAmount, finalOrderNumber, addressStr);
  const adminSellerName = primaryVendor ? primaryVendor.vendorName : vendorMap.size > 0 ? "Multiple Vendors" : "MetaFit Direct";
  const adminSellerEmail = primaryVendor ? primaryVendor.email : process.env.SELLER_EMAIL;
  const adminSellerPhone = primaryVendor ? primaryVendor.phone : "N/A";

  const adminEmailHtml = generateAdminOrderEmail(
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    adminSellerName,
    adminSellerEmail,
    adminSellerPhone,
    productListHtml,
    totalAmount,
    finalOrderNumber,
    addressStr
  );

  const buyerMailOptions = {
    from: process.env.EMAIL_USER,
    to: order.customerEmail,
    subject: "Order Confirmed 🎉",
    html: buyerEmailHtml,
  };

  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.SELLER_EMAIL,
    subject: `📦 New Order Alert - ${order.customerName}`,
    html: adminEmailHtml,
  };

  if (order.customerEmail) {
    Promise.all([
      transporter.sendMail(buyerMailOptions).catch((e) => console.error("✗ Failed buyer email:", e.message)),
      transporter.sendMail(adminMailOptions).catch((e) => console.error("✗ Failed admin email:", e.message)),
    ]).catch((err) => console.error("✗ Failed main emails:", err.message));
  }

  // Send Seller Emails
  const vendorMailOptions = [];
  for (const [vendorIdStr, vendorData] of vendorMap.entries()) {
    const currentVendor = vendorData.vendor;
    const vendorProducts = vendorData.products;

    let vendorProductListHtml = "";
    let vendorTotalAmount = 0;

    vendorProducts.forEach((item) => {
      const itemTotal = item.price * (item.quantity || 1);
      vendorTotalAmount += itemTotal;
      vendorProductListHtml += `
        <li style="margin-bottom: 10px;">
          <b>${item.name}</b> (x${item.quantity || 1})
          <br />
          <span style="color:#9ca3af; font-size:14px;">Price: ₹${item.price} | Total: ₹${itemTotal}</span>
          ${item.size ? `<br /><span style="color:#9ca3af; font-size:14px;">Size: ${typeof item.size === "string" ? item.size.split(":")[0] : item.size}</span>` : ""}
          ${item.color ? `<br /><span style="color:#9ca3af; font-size:14px;">Color: ${item.color}</span>` : ""}
        </li>
      `;
    });

    const sellerEmailHtml = generateSellerEmail(
      firstName,
      lastName,
      order.customerEmail,
      order.customerPhone,
      vendorProductListHtml,
      vendorTotalAmount,
      finalOrderNumber,
      addressStr
    );

    if (currentVendor.email) {
      vendorMailOptions.push({
        from: process.env.SELLER_EMAIL,
        to: currentVendor.email,
        subject: `🎉 New Order Alert - ${order.customerName}`,
        html: sellerEmailHtml,
      });
    }
  }

  if (vendorMailOptions.length > 0) {
    const sender = transporter.sellerTransporter || transporter;
    Promise.all(
      vendorMailOptions.map((mail) => sender.sendMail(mail).catch((e) => console.error(`✗ Failed seller email to ${mail.to}:`, e.message)))
    ).catch((err) => console.error("✗ Failed seller emails:", err.message));
  }

  // Send WhatsApp Notifications
  const whatsappPromises = [];
  if (order.customerPhone) {
    const productName = products && products.length > 0 ? products.map((p) => p.name).join(", ") : "Order";
    const productQuantity = products && products.length > 0 ? products.length.toString() : "1";

    const whatsappPayload = {
      customer_phone: order.customerPhone,
      customer_name: firstName,
      product_success_name: finalOrderNumber,
      product_name: productName,
      product_quantity: productQuantity,
      product_amount: `${totalAmount}`,
      payment_status: "completed",
    };

    whatsappPromises.push(
      sendWhatsAppOrderConfirmation(whatsappPayload).catch((err) =>
        console.error("✗ Failed WhatsApp buyer confirmation:", err.message)
      )
    );
  }

  if (order.customerPhone && products && products.length > 0) {
    const productName = products.map((p) => p.name).join(", ");
    const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 1), 0).toString();

    const adminNotificationPayload = {
      admin_phone: process.env.ADMIN_WHATSAPP_PHONE,
      orderId: finalOrderNumber,
      product: productName,
      quantity: totalQuantity,
      total_amount: `${totalAmount} `,
      name: order.customerName,
      phone: order.customerPhone,
      address: addressStr,
    };

    whatsappPromises.push(
      sendWhatsAppAdminOrderNotification(adminNotificationPayload).catch((err) =>
        console.error("✗ Failed WhatsApp admin notification:", err.message)
      )
    );

    for (const [vendorIdStr, vendorData] of vendorMap.entries()) {
      const currentVendor = vendorData.vendor;
      const vendorProducts = vendorData.products;

      if (!currentVendor.phone) continue;

      const vendorProductName = vendorProducts.map((p) => p.name).join(", ");
      const vendorTotalQuantity = vendorProducts.reduce((sum, p) => sum + (p.quantity || 1), 0).toString();

      const vendorNotificationPayload = {
        vendor_phone: currentVendor.phone,
        vendor_name: currentVendor.vendorName || "Vendor",
        orderId: finalOrderNumber,
        product: vendorProductName,
        quantity: vendorTotalQuantity,
        total_amount: `${totalAmount} `,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        address: addressStr,
        number: process.env.ADMIN_WHATSAPP_PHONE,
      };

      whatsappPromises.push(
        sendWhatsAppVendorOrderNotification(vendorNotificationPayload).catch((err) =>
          console.error("✗ Failed WhatsApp vendor notification:", err.message)
        )
      );
    }
  }

  if (whatsappPromises.length > 0) {
    Promise.all(whatsappPromises).catch((err) =>
      console.error("✗ Failed during WhatsApp notifications execution:", err.message)
    );
  }

  return {
    success: true,
    message: "Payment processed successfully",
    orderId: savedOrderId,
    orderNumber: finalOrderNumber,
  };
}

/**
 * Frontend Callback: verifyPayment
 */
exports.verifyPayment = async (req, res) => {
  const { order_id, payment_id, signature } = req.body;

  // Generate HMAC signature to verify payment
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
  hmac.update((order_id || "") + "|" + (payment_id || ""));
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature !== signature) {
    return res.status(400).json({
      success: false,
      message: "Payment signature not verified",
    });
  }

  try {
    const result = await processPaymentCompletion({
      razorpay_order_id: order_id,
      razorpay_payment_id: payment_id,
      signature,
      paymentData: req.body,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("✗ Error in verifyPayment:", err);
    return res.status(400).json({
      success: false,
      message: "Payment verification failed",
      error: err.message,
    });
  }
};

/**
 * Primary Webhook Handler: handleRazorpayWebhook
 */
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_SECRET_KEY;

    if (webhookSignature && webhookSecret) {
      // Use rawBody buffer/string if attached by express raw body parser, otherwise fallback
      const bodyData = req.rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(bodyData)
        .digest("hex");

      if (expectedSignature !== webhookSignature) {
        console.warn("⚠️ Razorpay webhook signature mismatch");
        return res.status(400).json({ status: "error", message: "Invalid webhook signature" });
      }
    }

    const event = req.body?.event;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = req.body?.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id || req.body?.payload?.order?.entity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      const result = await processPaymentCompletion({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        signature: webhookSignature,
        paymentData: paymentEntity || {},
      });

      return res.status(200).json({ status: "ok", ...result });
    }

    return res.status(200).json({ status: "ignored", event });
  } catch (err) {
    console.error("✗ Error in handleRazorpayWebhook:", err);
    return res.status(400).json({ status: "error", message: err.message });
  }
};
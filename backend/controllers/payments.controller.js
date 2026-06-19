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

exports.createOrder = async (req, res) => {
  const { courseId, amount } = req.body;
  if (!courseId || !amount) {
    return res.status(400).json({
      message: "course id and amount required",
    });
  }

  const option = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpayInstance.orders.create(option);
    return res.status(200).json(order);
  } catch (error) {
    console.error("✗ Failed to create Razorpay order:", error);
    return res.status(500).json({
      success: false,
      message: " Something went wrong",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  const {
    order_id,
    payment_id,
    signature,
    email,
    products,
    totalAmount,
    firstName,
    lastName,
    address,
    phone,
  } = req.body;

  console.log("---- STARTING PAYMENT VERIFICATION ----");
  console.log("Received data:", { order_id, payment_id, email, totalAmount, phone, signature_received: signature ? 'yes' : 'no' });

  // Generate HMAC signature to verify payment
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
  hmac.update(order_id + "|" + payment_id);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature !== signature) {
    return res.status(400).json({
      success: false,
      message: "Payment not verified",
    });
  }

  console.log("✓ Signature verified successfully");

  const existingOrder = await Order.findOne({
    paymentId: payment_id,
  });

  if (existingOrder) {
    return res.status(200).json({
      success: true,
      message: "Order already processed",
      orderId: existingOrder._id,
    });
  }

  // Build product list HTML - safely handle products array
  let productList = "";
  if (Array.isArray(products) && products.length > 0) {
    productList = products
      .map((p) => {
        let details = `${p.name} - ₹${p.price}`;
        const attributes = [];
        if (p.quantity) attributes.push(`Qty: ${p.quantity}`);
        if (p.size) attributes.push(`Size: ${p.size}`);
        if (p.color) attributes.push(`Color: ${p.color}`);
        if (attributes.length > 0) {
          details += ` (${attributes.join(", ")})`;
        }
        return `<li>${details}</li>`;
      })
      .join("");
  } else {
    productList = "<li>Products information not available</li>";
  }

  try {
    // Fetch user early
    console.log("Fetching user for email:", email);
    const user = await User.findOne({ email });
    if (!user) {
      console.warn("⚠️ User not found for email:", email);
    } else {
      console.log("✓ User found:", user._id);
    }

    // Resolve products and vendor details early
    let primaryVendor = null;
    const vendorMap = new Map(); // vendorId string -> { vendor, products: [] }
    const orderItems = [];
    let calculatedShipping = 0;

    if (Array.isArray(products) && products.length > 0) {
      const productIds = products.map((p) => p.productId);

      const dbProducts = await Product.find({
        _id: { $in: productIds },
      }).lean();

      // Create a map for quick product lookup
      const dbProductMap = new Map();
      dbProducts.forEach(dbP => dbProductMap.set(dbP._id.toString(), dbP));

      const vendorIds = [
        ...new Set(
          dbProducts
            .filter(p => p.vendorId)
            .map(p => p.vendorId.toString())
        )
      ];

      const vendors = await Vendor.find({
        _id: { $in: vendorIds }
      }).lean();

      const vendorsById = new Map();
      vendors.forEach(v => vendorsById.set(v._id.toString(), v));

      let calculatedAmount = 0;

      for (const item of products) {
        const dbProduct = dbProductMap.get(item.productId.toString());
        if (dbProduct) {
          // Gather all valid prices for this product from the database
          const validPrices = [dbProduct.price, dbProduct.discountPrice].filter(Boolean);
          
          if (dbProduct.variants && dbProduct.variants.length > 0) {
            dbProduct.variants.forEach(v => {
              if (v.price) validPrices.push(v.price);
              if (v.discountPrice) validPrices.push(v.discountPrice);
            });
          }

          // If the frontend item.price is one of the valid DB prices, use it.
          // Otherwise, fallback to the main dbProduct.discountPrice or dbProduct.price
          let validItemPrice = (dbProduct.discountPrice || dbProduct.price);
          
          if (item.price && validPrices.includes(Number(item.price))) {
            validItemPrice = Number(item.price);
          } else {
            console.warn(`Price check fallback for ${item.name}: frontend sent ${item.price}, using DB price ${validItemPrice}`);
          }

          calculatedAmount += validItemPrice * (item.quantity || 1);
          calculatedShipping += (dbProduct.shippingCharge || 0) * (item.quantity || 1);
        }
      }

      // Compare against the expected total (products + shipping)
      const expectedTotal = calculatedAmount + calculatedShipping;

      if (Number(expectedTotal) !== Number(totalAmount)) {
        console.error("Amount mismatch:", { expectedTotal, calculatedAmount, calculatedShipping, totalAmount: Number(totalAmount) });
        return res.status(400).json({
          success: false,
          message: "Amount mismatch",
        });
      }

      for (const p of products) {
        const dbProduct = dbProductMap.get(p.productId.toString());

        if (dbProduct && dbProduct.createdBy === "VENDOR" && dbProduct.vendorId) {
          const vendorIdStr = dbProduct.vendorId.toString();
          const vendorObj = vendorsById.get(vendorIdStr);

          if (vendorObj) {
            if (!vendorMap.has(vendorIdStr)) {
              vendorMap.set(vendorIdStr, { vendor: vendorObj, products: [p] });
              if (!primaryVendor) {
                primaryVendor = vendorObj;
              }
            } else {
              vendorMap.get(vendorIdStr).products.push(p);
            }
          }
        }

        orderItems.push({
          productId: p.productId,
          name: p.name,
          image: p.image,
          price: p.price,
          size: p.size || null,
          color: p.color || null,
          quantity: p.quantity || 1,
        });
      }
    }

    const vendorCity = primaryVendor ? primaryVendor.city : null;
    const vendorPostalCode = primaryVendor ? primaryVendor.pincode : null;

    console.log("✓ Vendor details and products mapped. Total vendors:", vendorMap.size);

    // Save order to database BEFORE sending emails
    let savedOrderId = null;
    try {
      const addressParts = address.split(",").map((part) => part.trim());
      const finalCity = vendorCity || addressParts[1] || "Not provided";
      const finalPostalCode = vendorPostalCode || addressParts[2] || "Not provided";

      const newOrder = new Order({
        user: user ? user._id : null,
        orderItems,
        shippingAddress: {
          address: addressParts[0] || address,
          city: finalCity,
          postalCode: finalPostalCode,
          country: "India",
        },
        paymentMethod: "Razorpay",
        totalPrice: totalAmount,
        deliveryCharge: calculatedShipping,
        isPaid: true,
        paidAt: new Date(),
        paymentStatus: "Completed",
        paymentId: payment_id,
        paymentDetails: {
          razorpay_order_id: order_id,
          razorpay_payment_id: payment_id,
          razorpay_signature: signature,
        },
        status: "Processing",
      });

      await newOrder.save();
      savedOrderId = newOrder._id;
      console.log("✓ Order saved successfully with ID:", savedOrderId);
    } catch (orderErr) {
      console.error("✗ Failed to save order:", orderErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to save order",
        error: orderErr.message
      });
    }

    // Return Success immediately to the client
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      orderId: savedOrderId
    });

    // Generate emails using template functions
    const buyerEmailHtml = generateBuyerEmail(firstName, productList, totalAmount, payment_id, address);

    const adminSellerName = primaryVendor ? primaryVendor.vendorName : (vendorMap.size > 0 ? "Multiple Vendors" : "MetaFit Direct");
    const adminSellerEmail = primaryVendor ? primaryVendor.email : process.env.SELLER_EMAIL;
    const adminSellerPhone = primaryVendor ? primaryVendor.phone : "N/A";

    const adminEmailHtml = generateAdminOrderEmail(
      `${firstName} ${lastName || ""}`.trim(),
      email,
      phone,
      adminSellerName,
      adminSellerEmail,
      adminSellerPhone,
      productList,
      totalAmount,
      payment_id,
      address
    );

    // // ---------------- BUYER EMAIL ----------------
    // const buyerMailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: "Order Confirmed 🎉",
    //   html: buyerEmailHtml,
    // };

    // // ---------------- ADMIN EMAIL ----------------
    // const adminMailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: process.env.SELLER_EMAIL,
    //   subject: `📦 New Order Alert - ${firstName} ${lastName}`,
    //   html: adminEmailHtml,
    // };

    // // Send emails with better error handling
    // try {
    //   console.log("📧 Sending buyer and admin emails...");
    //   await Promise.all([
    //     transporter.sendMail(buyerMailOptions).catch(e => console.error("✗ Failed buyer email:", e.message)),
    //     transporter.sendMail(adminMailOptions).catch(e => console.error("✗ Failed admin email:", e.message))
    //   ]);
    //   console.log("✓ Buyer and admin emails processed");
    // } catch (emailErr) {
    //   console.error("✗ Failed to process main emails:", emailErr.message);
    // }

    // // ---------------- SELLER EMAILS ----------------
    // const vendorMailOptions = [];

    // for (const [vendorIdStr, vendorData] of vendorMap.entries()) {
    //   const currentVendor = vendorData.vendor;
    //   const vendorProducts = vendorData.products;

    //   let vendorProductListHtml = "";
    //   let vendorTotalAmount = 0;

    //   vendorProducts.forEach((item) => {
    //     const itemTotal = item.price * (item.quantity || 1);
    //     vendorTotalAmount += itemTotal;
    //     vendorProductListHtml += `
    //       <li style="margin-bottom: 10px;">
    //         <b>${item.name}</b> (x${item.quantity || 1})
    //         <br />
    //         <span style="color:#9ca3af; font-size:14px;">Price: ₹${item.price} | Total: ₹${itemTotal}</span>
    //       </li>
    //     `;
    //   });

    //   const sellerEmailHtml = generateSellerEmail(
    //     firstName,
    //     lastName,
    //     email,
    //     phone,
    //     vendorProductListHtml,
    //     vendorTotalAmount,
    //     payment_id,
    //     address
    //   );

    //   vendorMailOptions.push({
    //     from: process.env.SELLER_EMAIL,
    //     to: currentVendor.email,
    //     subject: `🎉 New Order Alert - ${firstName} ${lastName}`,
    //     html: sellerEmailHtml,
    //   });
    // }

    // if (vendorMailOptions.length > 0) {
    //   try {
    //     console.log(`📧 Sending ${vendorMailOptions.length} seller emails...`);
    //     const sender = transporter.sellerTransporter || transporter;
    //     await Promise.all(
    //       vendorMailOptions.map((mail) => sender.sendMail(mail).catch(e => console.error(`✗ Failed seller email to ${mail.to}:`, e.message)))
    //     );
    //     console.log("✓ Seller emails processed");
    //   } catch (emailErr) {
    //     console.error("✗ Failed to process seller emails:", emailErr.message);
    //   }
    // }

    // // ---------------- WHATSAPP NOTIFICATIONS ----------------
    // const whatsappPromises = [];

    // // 1. Buyer Notification
    // if (phone) {
    //   const productName = products && products.length > 0
    //     ? products.map(p => p.name).join(", ")
    //     : "Order";

    //   const productQuantity = products && products.length > 0
    //     ? products.length.toString()
    //     : "1";

    //   const whatsappPayload = {
    //     customer_phone: phone,
    //     customer_name: firstName,
    //     product_success_name: payment_id,
    //     product_name: productName,
    //     product_quantity: productQuantity,
    //     product_amount: `${totalAmount}`,
    //     payment_status: "completed"
    //   };

    //   console.log("📱 Preparing WhatsApp Buyer Payload");
    //   whatsappPromises.push(
    //     sendWhatsAppOrderConfirmation(whatsappPayload).catch(whatsappErr => {
    //       console.error("✗ Failed to send WhatsApp buyer confirmation:", {
    //         message: whatsappErr.message,
    //         phone: phone
    //       });
    //     })
    //   );
    // } else {
    //   console.warn("⚠️ Phone number not provided - skipping WhatsApp buyer confirmation");
    // }

    // // 2. Admin & Vendor Notifications
    // if (payment_id && firstName && phone && products && products.length > 0) {
    //   console.log("📱 Preparing WhatsApp Admin/Vendor notifications");
    //   const productName = products.map(p => p.name).join(", ");
    //   const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 1), 0).toString();

    //   const adminNotificationPayload = {
    //     admin_phone: process.env.ADMIN_WHATSAPP_PHONE,
    //     orderId: payment_id.toString(),
    //     product: productName,
    //     quantity: totalQuantity,
    //     total_amount: `${totalAmount} `,
    //     name: firstName,
    //     phone: phone,
    //     address: address || "Not provided"
    //   };

    //   whatsappPromises.push(
    //     sendWhatsAppAdminOrderNotification(adminNotificationPayload).catch(adminWhatsappErr => {
    //       console.error("✗ Failed to send WhatsApp admin notification:", {
    //         message: adminWhatsappErr.message
    //       });
    //     })
    //   );

    //   for (const [vendorIdStr, vendorData] of vendorMap.entries()) {
    //     const currentVendor = vendorData.vendor;
    //     const vendorProducts = vendorData.products;

    //     const vendorProductName = vendorProducts.map(p => p.name).join(", ");
    //     const vendorTotalQuantity = vendorProducts.reduce((sum, p) => sum + (p.quantity || 1), 0).toString();

    //     const vendorNotificationPayload = {
    //       vendor_phone: currentVendor.phone,
    //       vendor_name: currentVendor.vendorName,
    //       orderId: payment_id.toString(),
    //       product: vendorProductName,
    //       quantity: vendorTotalQuantity,
    //       total_amount: `${totalAmount} `,
    //       customer_name: firstName,
    //       customer_phone: phone,
    //       address: address || "Not provided",
    //       number: process.env.ADMIN_WHATSAPP_PHONE
    //     };

    //     console.log(`📱 Preparing WhatsApp vendor notification to: ${currentVendor.vendorName} (${currentVendor.phone})`);

    //     whatsappPromises.push(
    //       sendWhatsAppVendorOrderNotification(vendorNotificationPayload).catch(whatsappErr => {
    //         console.error("✗ Failed to send WhatsApp vendor notification:", {
    //           message: whatsappErr.message,
    //           vendorPhone: currentVendor.phone
    //         });
    //       })
    //     );
    //   }
    // } else {
    //   console.warn("⚠️ Skipping admin/vendor WhatsApp notification - missing required data");
    // }

    // // Execute all WhatsApp requests concurrently
    // if (whatsappPromises.length > 0) {
    //   try {
    //     console.log(`📱 Sending ${whatsappPromises.length} WhatsApp notifications concurrently...`);
    //     await Promise.all(whatsappPromises);
    //     console.log("✓ All WhatsApp notifications processed successfully");
    //   } catch (overallWhatsappErr) {
    //     console.error("✗ Failed during WhatsApp notification processing:", overallWhatsappErr.message);
    //   }
    // }

  } catch (err) {
    console.error("✗ Error in verifyPayment:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Payment verification failed",
        error: err.message,
      });
    }
  }
};
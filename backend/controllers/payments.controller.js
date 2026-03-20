const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
const razorpayInstance = createRazorpayInstance();
const transporter = require("../utils/email");
const {generateBuyerEmail, generateSellerEmail, generateAdminOrderEmail} = require("../utils/emailTemplate");
const { sendWhatsAppOrderConfirmation , sendWhatsAppAdminOrderNotification} = require("../config/whatsappServices");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

exports.createOrder = (req, res) => {
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
    razorpayInstance.orders.create(option, (err, order) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: " Something went wrong",
        });
      }
      return res.status(200).json(order);
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: " Something went wrong",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  // console.log("verifyPayment req.body:", req.body); // Debugging line
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
    // Generate emails using template functions
    const buyerEmailHtml = generateBuyerEmail(firstName, productList, totalAmount, payment_id, address);
    const adminEmailHtml = generateAdminOrderEmail(firstName, email, lastName, process.env.SELLER_EMAIL, productList, totalAmount, payment_id, address);

    // ---------------- BUYER EMAIL ----------------
    const buyerMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Order Confirmed 🎉",
      html: buyerEmailHtml,
    };

    // ---------------- ADMIN EMAIL ----------------
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.SELLER_EMAIL,
      subject: `📦 New Order Alert - ${firstName} ${lastName}`,
      html: adminEmailHtml,
    };

    // Send emails with better error handling
    try {
      await transporter.sendMail(buyerMailOptions);
      // console.log("✓ Buyer email sent successfully");
    } catch (emailErr) {
      console.error("✗ Failed to send buyer email:", emailErr.message);
      // Don't throw - continue processing even if email fails
    }

    try {
      await transporter.sendMail(adminMailOptions);
      // console.log("✓ Admin email sent successfully");
    } catch (emailErr) {
      console.error("✗ Failed to send admin email:", emailErr.message);
      // Don't throw - continue processing even if email fails
    }



    // Send WhatsApp order confirmation if phone number is available
    if (phone) {
      // console.log("📱 Attempting to send WhatsApp confirmation to:", phone);
      try {
        const productName = products && products.length > 0 
          ? products.map(p => p.name).join(", ") 
          : "Order";
        
        const productQuantity = products && products.length > 0 
          ? products.length.toString() 
          : "1";

        const whatsappPayload = {
          customer_phone: phone,
          customer_name: firstName,
          product_success_name: payment_id,
          product_name: productName,
          product_quantity: productQuantity,
          product_amount: `${totalAmount}`,
          payment_status: "completed"
        };

        // console.log("📱 WhatsApp Payload:", JSON.stringify(whatsappPayload, null, 2));

        const whatsappResult = await sendWhatsAppOrderConfirmation(whatsappPayload);
        // console.log("✓ WhatsApp order confirmation sent successfully:", whatsappResult);
      } catch (whatsappErr) {
        console.error("✗ Failed to send WhatsApp order confirmation:", {
          message: whatsappErr.message,
          error: whatsappErr,
          phone: phone
        });
        // Don't throw - continue processing even if WhatsApp fails
      }
    } else {
      console.warn("⚠️ Phone number not provided in payment verification");
    }

    // Send WhatsApp admin notification for ALL orders
    if (payment_id && firstName && phone && products && products.length > 0) {
      try {
        // console.log("📱 Attempting to send WhatsApp admin notification");
        const productName = products.map(p => p.name).join(", ");
        const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 1), 0).toString();
        
        const adminNotificationPayload = {
          admin_phone: process.env.ADMIN_WHATSAPP_PHONE,
          orderId: payment_id.toString(),
          product: productName,
          quantity: totalQuantity,
          total_amount: `${totalAmount}`,
          name: firstName,
          phone: phone,
          address: address || "Not provided"
        };

        // console.log("📱 Admin WhatsApp Payload:", JSON.stringify(adminNotificationPayload, null, 2));

        const adminResult = await sendWhatsAppAdminOrderNotification(adminNotificationPayload);
        // console.log("✓ WhatsApp admin notification sent successfully:", adminResult);
      } catch (adminWhatsappErr) {
        console.error("✗ Failed to send WhatsApp admin notification:", {
          message: adminWhatsappErr.message,
          error: adminWhatsappErr
        });
        // Don't throw - continue processing even if admin WhatsApp fails
      }
    } else {
      console.warn("⚠️ Skipping admin WhatsApp notification - missing required data", {
        payment_id,
        firstName,
        phone
      });
    }

    if (products && products.length > 0) {
      // Vendor WhatsApp notifications removed
    } else {
      console.warn("⚠️ No products available for vendor notification");
    }

    // Save order to database
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        console.warn("⚠️ User not found for email:", email);
      }

      // Build order items from products and fetch vendor details if needed
      let vendorCity = null;
      let vendorPostalCode = null;

      const orderItems = await Promise.all(
        products.map(async (p) => {
          // Fetch product from DB to get vendor info
          const dbProduct = await Product.findById(p.productId);
          
          // If product is from vendor, fetch vendor details
          if (dbProduct && dbProduct.createdBy === "VENDOR" && dbProduct.vendorId) {
            try {
              const vendor = await Vendor.findOne({ userId: dbProduct.vendorId });
              if (vendor && vendor.pickupAddress) {
                vendorCity = vendor.pickupAddress.city;
                vendorPostalCode = vendor.pickupAddress.pincode;
                // console.log("📍 Using vendor address - City:", vendorCity, "Pincode:", vendorPostalCode);
              }
            } catch (vendorErr) {
              console.error("⚠️ Failed to fetch vendor details:", vendorErr.message);
            }
          }

          return {
            productId: p.productId,
            name: p.name,
            image: p.image,
            price: p.price,
            size: p.size || null,
            color: p.color || null,
            quantity: p.quantity || 1,
          };
        })
      );

      // Extract address components (assuming address is a string)
      const addressParts = address.split(",").map((part) => part.trim());

      // Use vendor's city/pincode if available, otherwise use parsed address
      const finalCity = vendorCity || addressParts[1] || "Not provided";
      const finalPostalCode = vendorPostalCode || addressParts[2] || "Not provided";

      // Create new order
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
        deliveryCharge: 30,
        isPaid: true,
        paidAt: new Date(),
        paymentStatus: "Completed",
        paymentId: payment_id,
        status: "Processing",
      });

      await newOrder.save();
      // console.log("✓ Order saved successfully with ID:", newOrder._id);
    } catch (orderErr) {
      console.error("✗ Failed to save order:", orderErr.message);
      // Don't throw - order is created even if DB save fails
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (err) {
    console.error("✗ Error in verifyPayment:", err);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: err.message,
    });
  }
};
const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
const razorpayInstance = createRazorpayInstance();
const transporter = require("../utils/email");
const {generateBuyerEmail, generateSellerEmail} = require("../utils/emailTemplate");
const { sendWhatsAppOrderConfirmation } = require("../config/whatsappServices");

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
  console.log("verifyPayment req.body:", req.body); // Debugging line
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
      .map(
        (p) =>
          `<li>${p.name} - ₹${p.price} (Size: ${p.size || "N/A"}, Color: ${p.color || "N/A"})</li>`
      )
      .join("");
  } else {
    productList = "<li>Products information not available</li>";
  }

  try {
    // Generate emails using template functions
    const buyerEmailHtml = generateBuyerEmail(firstName, productList, totalAmount, payment_id, address);
    const sellerEmailHtml = generateSellerEmail(firstName, lastName, email, productList, totalAmount, payment_id, address);

    // ---------------- BUYER EMAIL ----------------
    const buyerMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Order Confirmed 🎉",
      html: buyerEmailHtml,
    };

    // ---------------- SELLER EMAIL ----------------
    const sellerMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.SELLER_EMAIL,
      subject: `New Order from ${firstName} ${lastName}`,
      html: sellerEmailHtml,
    };

    // Send emails with better error handling
    try {
      await transporter.sendMail(buyerMailOptions);
      console.log("✓ Buyer email sent successfully");
    } catch (emailErr) {
      console.error("✗ Failed to send buyer email:", emailErr.message);
      // Don't throw - continue processing even if email fails
    }

    try {
      await transporter.sendMail(sellerMailOptions);
      console.log("✓ Seller email sent successfully");
    } catch (emailErr) {
      console.error("✗ Failed to send seller email:", emailErr.message);
      // Don't throw - continue processing even if email fails
    }

    // Send WhatsApp order confirmation if phone number is available
    if (phone) {
      console.log("📱 Attempting to send WhatsApp confirmation to:", phone);
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
          product_amount: `₹${totalAmount}`,
          shipping_address: address,
          payment_status: "completed"
        };

        console.log("📱 WhatsApp Payload:", JSON.stringify(whatsappPayload, null, 2));

        const whatsappResult = await sendWhatsAppOrderConfirmation(whatsappPayload);
        console.log("✓ WhatsApp order confirmation sent successfully:", whatsappResult);
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
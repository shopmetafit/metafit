const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
const razorpayInstance = createRazorpayInstance();
const transporter = require("../utils/email");
const {generateBuyerEmail, generateSellerEmail} = require("../utils/emailTemplate");
const { sendWhatsAppOrderConfirmation , sendWhatsAppAdminOrderNotification , sendWhatsAppVendorOrderNotification} = require("../config/whatsappServices");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");

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
          product_amount: `${totalAmount}`,
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

    // Send WhatsApp admin notification ONLY for admin-created products
    if (payment_id && firstName && phone && products && products.length > 0) {
      try {
        // Filter products created by ADMIN
        const adminProducts = [];
        for (const product of products) {
          const dbProduct = await Product.findById(product.productId);
          if (dbProduct && dbProduct.createdBy === "ADMIN") {
            adminProducts.push(product);
          }
        }

        // Only send admin notification if there are admin products
        if (adminProducts.length > 0) {
          console.log("📱 Attempting to send WhatsApp admin notification");
          const productName = adminProducts.map(p => p.name).join(", ");
          
          const adminNotificationPayload = {
            admin_phone: process.env.ADMIN_WHATSAPP_PHONE,
            orderId: payment_id.toString(),
            product: productName,
            quantity: adminProducts.length.toString(),
            total_amount: `₹${totalAmount}`,
            name: firstName,
            phone: phone,
            address: address || "Not provided"
          };

          console.log("📱 Admin WhatsApp Payload:", JSON.stringify(adminNotificationPayload, null, 2));

          const adminResult = await sendWhatsAppAdminOrderNotification(adminNotificationPayload);
          console.log("✓ WhatsApp admin notification sent successfully for admin products:", adminResult);
        } else {
          console.log("ℹ️ No admin products in order - skipping admin notification");
        }
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
      try {
        console.log("📱 Attempting to send WhatsApp vendor notification");
        console.log("📦 Products received:", JSON.stringify(products, null, 2));
        
        // Send notification to each vendor whose product was purchased
        for (const product of products) {
          console.log(`🔍 Checking product: ${product.name}, productId: ${product.productId}`);
          
          try {
            // Fetch actual product from database to get createdBy and vendorId from source of truth
            const dbProduct = await Product.findById(product.productId);
            
            if (!dbProduct) {
              console.warn(`⚠️ Product not found in database: ${product.productId}`);
              continue;
            }
            
            console.log(`📦 Product from DB - createdBy: ${dbProduct.createdBy}, vendorId: ${dbProduct.vendorId}`);
            
            // Check if product is created by VENDOR and has vendorId
            if (dbProduct.createdBy === "VENDOR" && dbProduct.vendorId) {
              try {
                console.log(`🔎 Searching for vendor with userId: ${dbProduct.vendorId}`);
                
                // Fetch vendor details from database using vendorId
                const vendor = await Vendor.findOne({ userId: dbProduct.vendorId });
                
                console.log(`📋 Vendor query result:`, vendor ? "Found" : "Not Found");
                if (vendor) {
                  console.log(`   Vendor data:`, JSON.stringify(vendor, null, 2));
                }
                
                if (vendor && vendor.contactPerson && vendor.contactPerson.phone) {
                  console.log(`📱 Found vendor: ${vendor.companyName} with phone: ${vendor.contactPerson.phone}`);
                  
                  const vendorNotificationPayload = {
                    vendor_phone: vendor.contactPerson.phone,
                    vendor_name: vendor.companyName,
                    orderId: payment_id.toString(),
                    product: dbProduct.name || "Unknown Product",
                    quantity: product.quantity ? product.quantity.toString() : "1",
                    customer_name: firstName,
                    customer_phone: phone,
                    address: address || "Not provided",
                    total_amount: product.price ? `${product.price * product.quantity}` : totalAmount,
                    number: process.env.ADMIN_WHATSAPP_PHONE,
                  };

                  console.log("📱 Vendor WhatsApp Payload:", JSON.stringify(vendorNotificationPayload, null, 2));

                  const vendorResult = await sendWhatsAppVendorOrderNotification(vendorNotificationPayload);
                  console.log(`✓ WhatsApp vendor notification sent successfully to ${vendor.companyName} (${vendor.contactPerson.phone}):`, vendorResult);
                } else {
                  console.warn(`⚠️ Vendor not found or phone number missing for vendorId: ${dbProduct.vendorId}`);
                }
              } catch (vendorFetchErr) {
                console.error(`✗ Error fetching vendor details for vendorId ${dbProduct.vendorId}:`);
                console.error(`   Error message:`, vendorFetchErr.message);
                console.error(`   Full error:`, vendorFetchErr);
              }
            } else {
              console.log(`⏭️ Product not created by vendor (createdBy: ${dbProduct.createdBy})`);
            }
          } catch (productFetchErr) {
            console.error(`✗ Error fetching product details for productId ${product.productId}:`, productFetchErr.message);
          }
        }
      } catch (vendorWhatsappErr) {
        console.error("✗ Failed to send WhatsApp vendor notification:", {
          message: vendorWhatsappErr.message,
          error: vendorWhatsappErr
        });
        // Don't throw - continue processing even if vendor WhatsApp fails
      }
    } else {
      console.warn("⚠️ No products available for vendor notification");
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
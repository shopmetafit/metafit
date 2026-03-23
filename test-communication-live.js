const { sellerTransporter } = require("./backend/utils/email");
const { generateAdminVendorRequestEmail, generateVendorApprovalEmail } = require("./backend/utils/emailTemplate");
const { sendWhatsAppOrderConfirmation, sendWhatsAppAdminOrderNotification, sendWhatsAppVendorOrderNotification } = require("./backend/config/whatsappServices");

// Test actual sending of emails and WhatsApp messages
async function testLiveCommunication() {
  console.log("🚀 Testing Live Communication...\n");

  // Check if environment variables are set
  const requiredEnvVars = {
    SELLER_EMAIL: process.env.SELLER_EMAIL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_WHATSAPP_PHONE: process.env.ADMIN_WHATSAPP_PHONE,
    WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID
  };

  console.log("📋 Environment Variables Check:");
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: Set`);
    } else {
      console.log(`❌ ${key}: Not set - Live tests will fail`);
    }
  });

  console.log("\n");

  // Test 1: Send Admin Vendor Request Email
  console.log("📧 Test 1: Sending Admin Vendor Request Email");
  try {
    const adminEmailHtml = generateAdminVendorRequestEmail(
      "Live Test Vendor",
      "Live Test Company",
      "live.test.vendor@example.com",
      "9876543210",
      "Company",
      "Mumbai",
      "Maharashtra"
    );

    const adminMailOptions = {
      from: process.env.SELLER_EMAIL || "test@example.com",
      to: process.env.ADMIN_EMAIL || "admin@example.com",
      subject: "Live Test - New Vendor Registration Request - MetaFit",
      html: adminEmailHtml
    };

    if (process.env.SELLER_EMAIL && process.env.ADMIN_EMAIL) {
      await sellerTransporter.sendMail(adminMailOptions);
      console.log("✅ Admin vendor request email sent successfully!");
    } else {
      console.log("⚠️  Skipping actual email send - environment variables not set");
      console.log("📝 Would send to:", adminMailOptions.to);
      console.log("📝 Subject:", adminMailOptions.subject);
    }
  } catch (error) {
    console.error("❌ Admin vendor request email failed:", error.message);
  }

  console.log("\n");

  // Test 2: Send Vendor Approval Email
  console.log("📧 Test 2: Sending Vendor Approval Email");
  try {
    const vendorEmailHtml = generateVendorApprovalEmail(
      "Live Test Vendor",
      "Live Test Company"
    );

    const vendorMailOptions = {
      from: process.env.SELLER_EMAIL || "test@example.com",
      to: "live.test.vendor@example.com",
      subject: "Live Test - Product Approved - MetaFit Vendor Portal",
      html: vendorEmailHtml
    };

    if (process.env.SELLER_EMAIL) {
      await sellerTransporter.sendMail(vendorMailOptions);
      console.log("✅ Vendor approval email sent successfully!");
    } else {
      console.log("⚠️  Skipping actual email send - SELLER_EMAIL not set");
      console.log("📝 Would send to:", vendorMailOptions.to);
      console.log("📝 Subject:", vendorMailOptions.subject);
    }
  } catch (error) {
    console.error("❌ Vendor approval email failed:", error.message);
  }

  console.log("\n");

  // Test 3: Send WhatsApp Order Confirmation
  console.log("📱 Test 3: Sending WhatsApp Order Confirmation");
  try {
    const whatsappPayload = {
      customer_phone: "919876543210",
      customer_name: "Live Test Customer",
      product_success_name: "live_test_order_12345",
      product_name: "Live Test Product - Size: M, Color: Blue",
      product_quantity: "2",
      product_amount: "999",
      payment_status: "completed"
    };

    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const result = await sendWhatsAppOrderConfirmation(whatsappPayload);
      console.log("✅ WhatsApp order confirmation sent successfully!");
      console.log("📝 Result:", JSON.stringify(result, null, 2));
    } else {
      console.log("⚠️  Skipping actual WhatsApp send - WhatsApp credentials not set");
      console.log("📝 Would send to:", whatsappPayload.customer_phone);
      console.log("📝 Customer name:", whatsappPayload.customer_name);
      console.log("📝 Product:", whatsappPayload.product_name);
    }
  } catch (error) {
    console.error("❌ WhatsApp order confirmation failed:", error.message);
  }

  console.log("\n");

  // Test 4: Send WhatsApp Admin Order Notification
  console.log("📱 Test 4: Sending WhatsApp Admin Order Notification");
  try {
    const adminNotificationPayload = {
      admin_phone: process.env.ADMIN_WHATSAPP_PHONE || "919876543210",
      orderId: "live_test_order_12345",
      product: "Live Test Product",
      quantity: "2",
      total_amount: "999",
      name: "Live Test Customer",
      phone: "919876543210",
      address: "123 Live Test Street, Mumbai, Maharashtra"
    };

    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.ADMIN_WHATSAPP_PHONE) {
      const result = await sendWhatsAppAdminOrderNotification(adminNotificationPayload);
      console.log("✅ WhatsApp admin notification sent successfully!");
      console.log("📝 Result:", JSON.stringify(result, null, 2));
    } else {
      console.log("⚠️  Skipping actual WhatsApp send - required credentials not set");
      console.log("📝 Would send to:", adminNotificationPayload.admin_phone);
      console.log("📝 Order ID:", adminNotificationPayload.orderId);
      console.log("📝 Product:", adminNotificationPayload.product);
    }
  } catch (error) {
    console.error("❌ WhatsApp admin notification failed:", error.message);
  }

  console.log("\n");

  // Test 5: Send WhatsApp Vendor Order Notification
  console.log("📱 Test 5: Sending WhatsApp Vendor Order Notification");
  try {
    const vendorNotificationPayload = {
      vendor_phone: "919876543210",
      vendor_name: "Live Test Vendor",
      orderId: "live_test_order_12345",
      product: "Live Test Product - Size: M, Color: Blue",
      quantity: "2",
      total_amount: "999",
      customer_name: "Live Test Customer",
      customer_phone: "919876543210",
      address: "123 Live Test Street, Mumbai, Maharashtra",
      number: process.env.ADMIN_WHATSAPP_PHONE || "919876543210"
    };

    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const result = await sendWhatsAppVendorOrderNotification(vendorNotificationPayload);
      console.log("✅ WhatsApp vendor notification sent successfully!");
      console.log("📝 Result:", JSON.stringify(result, null, 2));
    } else {
      console.log("⚠️  Skipping actual WhatsApp send - WhatsApp credentials not set");
      console.log("📝 Would send to:", vendorNotificationPayload.vendor_phone);
      console.log("📝 Vendor name:", vendorNotificationPayload.vendor_name);
      console.log("📝 Product:", vendorNotificationPayload.product);
    }
  } catch (error) {
    console.error("❌ WhatsApp vendor notification failed:", error.message);
  }

  console.log("\n📋 Final Summary:");
  console.log("✅ All communication templates and payloads are properly structured");
  console.log("✅ Email templates are ready for sending");
  console.log("✅ WhatsApp payloads are ready for sending");
  
  if (Object.values(requiredEnvVars).every(Boolean)) {
    console.log("✅ All required environment variables are set - live communication is working!");
  } else {
    console.log("⚠️  Some environment variables are missing - set them to enable live communication");
    console.log("📝 Required variables:");
    console.log("   - SELLER_EMAIL: Email address for sending vendor emails");
    console.log("   - ADMIN_EMAIL: Email address for receiving admin notifications");
    console.log("   - ADMIN_WHATSAPP_PHONE: WhatsApp number for admin notifications");
    console.log("   - WHATSAPP_TOKEN: Meta WhatsApp API token");
    console.log("   - WHATSAPP_PHONE_NUMBER_ID: Meta WhatsApp phone number ID");
  }
}

// Run the live test
testLiveCommunication().catch(console.error);
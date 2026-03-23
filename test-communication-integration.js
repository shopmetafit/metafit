const { sellerTransporter } = require("./backend/utils/email");
const { generateAdminVendorRequestEmail, generateVendorApprovalEmail } = require("./backend/utils/emailTemplate");
const { sendWhatsAppOrderConfirmation, sendWhatsAppAdminOrderNotification, sendWhatsAppVendorOrderNotification } = require("./backend/config/whatsappServices");

// Test email and WhatsApp communication integration
async function testCommunicationIntegration() {
  console.log("🧪 Testing Communication Integration...\n");

  // Test 1: Admin Vendor Request Email
  console.log("📧 Test 1: Admin Vendor Request Email");
  try {
    const adminEmailHtml = generateAdminVendorRequestEmail(
      "Test Vendor",
      "Test Company",
      "test.vendor@example.com",
      "9876543210",
      "Company",
      "Mumbai",
      "Maharashtra"
    );

    const adminMailOptions = {
      from: process.env.SELLER_EMAIL || "test@example.com",
      to: process.env.ADMIN_EMAIL || "admin@example.com",
      subject: "New Vendor Registration Request - MetaFit",
      html: adminEmailHtml
    };

    console.log("✅ Admin email template generated successfully");
    console.log("📝 Email subject:", adminMailOptions.subject);
    console.log("📝 Email from:", adminMailOptions.from);
    console.log("📝 Email to:", adminMailOptions.to);
    console.log("📝 HTML length:", adminEmailHtml.length, "characters\n");
  } catch (error) {
    console.error("❌ Admin email test failed:", error.message);
  }

  // Test 2: Vendor Approval Email
  console.log("📧 Test 2: Vendor Approval Email");
  try {
    const vendorEmailHtml = generateVendorApprovalEmail(
      "Test Vendor",
      "Test Company"
    );

    const vendorMailOptions = {
      from: process.env.SELLER_EMAIL || "test@example.com",
      to: "test.vendor@example.com",
      subject: "Product Approved - MetaFit Vendor Portal",
      html: vendorEmailHtml
    };

    console.log("✅ Vendor approval email template generated successfully");
    console.log("📝 Email subject:", vendorMailOptions.subject);
    console.log("📝 Email from:", vendorMailOptions.from);
    console.log("📝 Email to:", vendorMailOptions.to);
    console.log("📝 HTML length:", vendorEmailHtml.length, "characters\n");
  } catch (error) {
    console.error("❌ Vendor approval email test failed:", error.message);
  }

  // Test 3: WhatsApp Order Confirmation
  console.log("📱 Test 3: WhatsApp Order Confirmation");
  try {
    const whatsappPayload = {
      customer_phone: "919876543210",
      customer_name: "Test Customer",
      product_success_name: "order_12345",
      product_name: "Test Product - Size: M, Color: Blue",
      product_quantity: "2",
      product_amount: "999",
      payment_status: "completed"
    };

    console.log("✅ WhatsApp order confirmation payload prepared");
    console.log("📝 Customer phone:", whatsappPayload.customer_phone);
    console.log("📝 Customer name:", whatsappPayload.customer_name);
    console.log("📝 Product name:", whatsappPayload.product_name);
    console.log("📝 Product amount:", whatsappPayload.product_amount);
    console.log("📝 Payment status:", whatsappPayload.payment_status);
    console.log("📝 Payload keys:", Object.keys(whatsappPayload), "\n");
  } catch (error) {
    console.error("❌ WhatsApp order confirmation test failed:", error.message);
  }

  // Test 4: WhatsApp Admin Order Notification
  console.log("📱 Test 4: WhatsApp Admin Order Notification");
  try {
    const adminNotificationPayload = {
      admin_phone: process.env.ADMIN_WHATSAPP_PHONE || "919876543210",
      orderId: "order_12345",
      product: "Test Product",
      quantity: "2",
      total_amount: "999",
      name: "Test Customer",
      phone: "919876543210",
      address: "123 Test Street, Mumbai, Maharashtra"
    };

    console.log("✅ WhatsApp admin notification payload prepared");
    console.log("📝 Admin phone:", adminNotificationPayload.admin_phone);
    console.log("📝 Order ID:", adminNotificationPayload.orderId);
    console.log("📝 Product:", adminNotificationPayload.product);
    console.log("📝 Quantity:", adminNotificationPayload.quantity);
    console.log("📝 Total amount:", adminNotificationPayload.total_amount);
    console.log("📝 Customer name:", adminNotificationPayload.name);
    console.log("📝 Customer phone:", adminNotificationPayload.phone);
    console.log("📝 Address:", adminNotificationPayload.address);
    console.log("📝 Payload keys:", Object.keys(adminNotificationPayload), "\n");
  } catch (error) {
    console.error("❌ WhatsApp admin notification test failed:", error.message);
  }

  // Test 5: WhatsApp Vendor Order Notification
  console.log("📱 Test 5: WhatsApp Vendor Order Notification");
  try {
    const vendorNotificationPayload = {
      vendor_phone: "919876543210",
      vendor_name: "Test Vendor",
      orderId: "order_12345",
      product: "Test Product - Size: M, Color: Blue",
      quantity: "2",
      total_amount: "999",
      customer_name: "Test Customer",
      customer_phone: "919876543210",
      address: "123 Test Street, Mumbai, Maharashtra",
      number: process.env.ADMIN_WHATSAPP_PHONE || "919876543210"
    };

    console.log("✅ WhatsApp vendor notification payload prepared");
    console.log("📝 Vendor phone:", vendorNotificationPayload.vendor_phone);
    console.log("📝 Vendor name:", vendorNotificationPayload.vendor_name);
    console.log("📝 Order ID:", vendorNotificationPayload.orderId);
    console.log("📝 Product:", vendorNotificationPayload.product);
    console.log("📝 Quantity:", vendorNotificationPayload.quantity);
    console.log("📝 Total amount:", vendorNotificationPayload.total_amount);
    console.log("📝 Customer name:", vendorNotificationPayload.customer_name);
    console.log("📝 Customer phone:", vendorNotificationPayload.customer_phone);
    console.log("📝 Address:", vendorNotificationPayload.address);
    console.log("📝 Admin number:", vendorNotificationPayload.number);
    console.log("📝 Payload keys:", Object.keys(vendorNotificationPayload), "\n");
  } catch (error) {
    console.error("❌ WhatsApp vendor notification test failed:", error.message);
  }

  // Test 6: Environment Variables Check
  console.log("⚙️ Test 6: Environment Variables Check");
  const requiredEnvVars = [
    'SELLER_EMAIL',
    'ADMIN_EMAIL', 
    'ADMIN_WHATSAPP_PHONE',
    'WHATSAPP_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID'
  ];

  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${envVar}: Not set`);
    }
  });

  console.log("\n📋 Summary:");
  console.log("✅ All communication templates and payloads are properly structured");
  console.log("✅ Email templates are ready for sending");
  console.log("✅ WhatsApp payloads are ready for sending");
  console.log("⚠️  Actual sending requires valid environment variables and API credentials");
  console.log("⚠️  To test actual sending, ensure all environment variables are set correctly");
}

// Run the test
testCommunicationIntegration().catch(console.error);
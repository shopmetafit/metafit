// CommonJS version
const dotenv = require("dotenv");
dotenv.config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_URL = `https://graph.facebook.com/v24.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

const lastMessageTime = new Map();


const validateParam = (value, name) => {
    if (value === null || value === undefined) {
        throw new Error(`${name} is required`);
    }

    const str = String(value).trim();

    if (!str || str === "null" || str === "undefined") {
        throw new Error(`${name} is invalid`);
    }

    return str;
};


const sendWhatsAppOTP = async (customer_phone, otp) => {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        throw new Error("WhatsApp credentials missing");
    }

    // Validate OTP
    const validatedOTP = validateParam(otp, "otp");
    if (!/^\d{6}$/.test(validatedOTP)) {
        throw new Error("OTP must be 6 digits");
    }

    // Format phone number (India)
    let phoneNumber = customer_phone.replace(/\D/g, "");
    if (phoneNumber.length === 10) {
        phoneNumber = "91" + phoneNumber;
    }

    if (!/^\d{10,15}$/.test(phoneNumber)) {
        throw new Error("Invalid phone number");
    }

    const payload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
            name: "otp_mbazaar",
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: validatedOTP }
                    ]
                },
                {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [
                        { type: "text", text: validatedOTP }
                    ]
                }
            ]
        }
    };

    const response = await fetch(WHATSAPP_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.error?.message || "WhatsApp OTP send failed"
        );
    }
    
    return data;
};


const sendWhatsAppOrderConfirmation = async ({
  customer_phone,
  customer_name,
  product_success_name,
  product_name,
  product_quantity,
  product_amount,
  payment_status
}) => {
  console.log("\n🔴 ========== WHATSAPP ORDER CONFIRMATION START ==========");
  console.log("📱 Input Phone:", customer_phone);
  console.log("👤 Customer Name:", customer_name);
  console.log("💰 Amount:", product_amount);
  
  // Validate payment status - only send if payment is successful
  console.log("🔍 Checking payment_status:", payment_status, "Type:", typeof payment_status);
  
  if (payment_status !== "completed" && payment_status !== "success") {
    console.error("❌ Payment status validation failed. Expected 'completed' or 'success', got:", payment_status);
    throw new Error("Order confirmation can only be sent after successful payment");
  }
  
  console.log("✅ Payment status validated");

  console.log("🔑 Checking credentials...");
  console.log("   WHATSAPP_TOKEN exists:", !!WHATSAPP_TOKEN);
  console.log("   WHATSAPP_PHONE_NUMBER_ID:", WHATSAPP_PHONE_NUMBER_ID);
  
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("❌ Credentials missing!");
    throw new Error("WhatsApp credentials missing");
  }
  console.log("✅ Credentials verified");

  const name = validateParam(customer_name, "customer_name");
  const successName = validateParam(product_success_name, "product_success_name");

  const product = validateParam(
    product_name.length > 900
      ? product_name.slice(0, 900) + "..."
      : product_name,
    "product_name"
  );

  const quantity = validateParam(product_quantity, "product_quantity");
  const amount = validateParam(product_amount, "product_amount");

  console.log("📞 Formatting phone number...");
  let phoneNumber = customer_phone.replace(/\D/g, "");
  console.log("   After removing non-digits:", phoneNumber);
  
  if (phoneNumber.length === 10) {
    phoneNumber = "91" + phoneNumber;
    console.log("   Added country code 91:", phoneNumber);
  }

  console.log("   Final formatted number:", phoneNumber);
  
  if (!/^\d{10,15}$/.test(phoneNumber)) {
    console.error("❌ Invalid phone number format:", phoneNumber);
    throw new Error("Invalid phone number");
  }
  console.log("✅ Phone number valid");

  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "template",
    template: {
      name: "mbazaar_products",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: name },
            { type: "text", text: successName },
            { type: "text", text: product },
            { type: "text", text: quantity },
            { type: "text", text: amount },
          ]
        }
      ]
    }
  };

  // Rate limiting: Wait if message was sent too soon to this number
  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  const lastTime = lastMessageTime.get(normalizedPhone) || 0;
  const timeSinceLastMessage = Date.now() - lastTime;
  const MIN_DELAY = 2000; // 2 seconds between messages to same number

  if (timeSinceLastMessage < MIN_DELAY) {
    const waitTime = MIN_DELAY - timeSinceLastMessage;
    console.log(`⏳ Rate limiting: Waiting ${waitTime}ms before sending to ${phoneNumber}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  console.log("\n📤 Sending to WhatsApp API...");
  console.log("   URL:", WHATSAPP_API_URL);
  console.log("   Payload:", JSON.stringify(payload, null, 2));
  
  const response = await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  console.log("📥 API Response Status:", response.status, response.statusText);
  
  const data = await response.json();
  console.log("WhatsApp API Response:", JSON.stringify(data, null, 2));
  
  // Record the time this message was sent
  lastMessageTime.set(normalizedPhone, Date.now());
  
  if (!response.ok) {
    console.error("❌ WhatsApp API Error:");
    console.error("   Status:", response.status);
    console.error("   Error:", data?.error || "Unknown error");
    throw new Error(
      data?.error?.message || "WhatsApp order confirmation failed"
    );
  }

  console.log("✅ Message sent successfully!");
  console.log("🔴 ========== WHATSAPP ORDER CONFIRMATION END ==========\n");
  
  return data;
};

const sendWhatsAppAdminOrderNotification = async ({
  admin_phone,
  orderId,
  product,
  quantity,
  total_amount,
  name,
  phone,
  address
}) => {
  console.log("\n🔵 ========== WHATSAPP ADMIN ORDER NOTIFICATION START ==========");

  console.log("📱 Admin Phone:", admin_phone);
  console.log("🧾 Order ID:", orderId);
  console.log("📦 Product:", product);

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("❌ WhatsApp credentials missing");
    throw new Error("WhatsApp credentials missing");
  }

  const order = validateParam(orderId, "orderId");
  const productName = validateParam(product, "product");
  const productQuantity = validateParam(quantity, "quantity");
  const amount = validateParam(total_amount, "total_amount");
  const customerName = validateParam(name, "name");
  const customerPhone = validateParam(phone, "phone");
  const shippingAddress = validateParam(address, "address");

  console.log("📞 Formatting admin phone number...");

  let phoneNumber = admin_phone.replace(/\D/g, "");

  if (phoneNumber.length === 10) {
    phoneNumber = "91" + phoneNumber;
  }

  if (!/^\d{10,15}$/.test(phoneNumber)) {
    console.error("❌ Invalid phone number:", phoneNumber);
    throw new Error("Invalid phone number");
  }

  console.log("✅ Admin phone number validated:", phoneNumber);

  const payload = {
    messaging_product: "whatsapp",
    to: process.env.ADMIN_WHATSAPP_PHONE, // Always send to the configured admin number, not dynamic input
    type: "template",
    template: {
      name: "bazaar_admin",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: order },          // {{1}}
            { type: "text", text: productName },    // {{3}}
            { type: "text", text: productQuantity },// {{4}}
            { type: "text", text: amount },         // {{5}}
            { type: "text", text: customerName },   // {{6}}
            { type: "text", text: customerPhone },  // {{7}}
            { type: "text", text: shippingAddress } // {{8}}
          ]
        }
      ]
    }
  };

  const normalizedPhone = phoneNumber.replace(/\D/g, "");
  const lastTime = lastMessageTime.get(normalizedPhone) || 0;
  const timeSinceLastMessage = Date.now() - lastTime;
  const MIN_DELAY = 2000;

  if (timeSinceLastMessage < MIN_DELAY) {
    const waitTime = MIN_DELAY - timeSinceLastMessage;
    console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  console.log("📤 Sending Admin Notification to WhatsApp API...");

  const response = await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  console.log("📥 WhatsApp API Response:", JSON.stringify(data, null, 2));

  lastMessageTime.set(normalizedPhone, Date.now());

  if (!response.ok) {
    console.error("❌ WhatsApp API Error:", data?.error);
    throw new Error(data?.error?.message || "WhatsApp admin notification failed");
  }

  console.log("✅ Admin notification sent successfully");
  console.log("🔵 ========== WHATSAPP ADMIN ORDER NOTIFICATION END ==========\n");

  return data;
};

const sendWhatsAppVendorOrderNotification = async ({
  vendor_phone,
  vendor_name,
  orderId,
  product,
  quantity,
  total_amount,
  customer_name,
  customer_phone,
  address,
  number
}) => {

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WhatsApp credentials missing");
  }

  const vendorName = validateParam(vendor_name, "vendor_name");
  const order = validateParam(orderId, "orderId");
  const productName = validateParam(product, "product");
  const productQuantity = validateParam(quantity, "quantity");
  const amount = validateParam(total_amount, "total_amount");
  const customerName = validateParam(customer_name, "customer_name");
  const customerPhone = validateParam(customer_phone, "customer_phone");
  const shippingAddress = validateParam(address, "address");
  const contactNumber = validateParam(number, "number");

  let phoneNumber = vendor_phone.replace(/\D/g, "");

  if (phoneNumber.length === 10) {
    phoneNumber = "91" + phoneNumber;
  }

  if (!/^\d{10,15}$/.test(phoneNumber)) {
    throw new Error("Invalid vendor phone number");
  }

  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "template",
    template: {
      name: "mwellness_vendor",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: vendorName },      // {{1}}
            { type: "text", text: order },           // {{2}}
            { type: "text", text: productName },     // {{3}}
            { type: "text", text: productQuantity }, // {{4}}
            { type: "text", text: amount },          // {{5}}
            { type: "text", text: customerName },    // {{6}}
            { type: "text", text: customerPhone },   // {{7}}
            { type: "text", text: shippingAddress }, // {{8}}
            { type: "text", text: contactNumber }    // {{9}}
          ]
        }
      ]
    }
  };

  const response = await fetch(WHATSAPP_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ WhatsApp Vendor Notification Error:", data);
    throw new Error(data?.error?.message || "Vendor notification failed");
  }

  console.log("✅ Vendor notification sent successfully");
  console.log("🟢 ===== VENDOR ORDER NOTIFICATION END =====\n");

  return data;
};
module.exports = { sendWhatsAppOTP, sendWhatsAppOrderConfirmation, sendWhatsAppAdminOrderNotification, sendWhatsAppVendorOrderNotification };




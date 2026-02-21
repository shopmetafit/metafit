// CommonJS version
const dotenv = require("dotenv");
dotenv.config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_URL = `https://graph.facebook.com/v24.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

// Rate limiting: Store last message time per phone
const lastMessageTime = new Map();

/**
 * Validate and sanitize parameter
 */
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

/**
 * Send WhatsApp OTP
 */
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

/**
 * Send WhatsApp Order Confirmation
 */
const sendWhatsAppOrderConfirmation = async ({
  customer_phone,
  customer_name,
  product_success_name,
  product_name,
  product_quantity,
  product_amount,
  shipping_address,
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
  const address = validateParam(shipping_address, "shipping_address");

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
            { type: "text", text: address }
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

// For CommonJS export
module.exports = { sendWhatsAppOTP, sendWhatsAppOrderConfirmation };

console.log("WHATSAPP_API_KEY:", !!process.env.WHATSAPP_TOKEN);
console.log("WHATSAPP_PHONE_NUMBER_ID:", !!process.env.WHATSAPP_PHONE_NUMBER_ID);
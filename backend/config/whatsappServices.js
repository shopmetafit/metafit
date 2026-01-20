// CommonJS version
const dotenv = require("dotenv");
dotenv.config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_URL = `https://graph.facebook.com/v24.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

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

// For CommonJS export
module.exports = { sendWhatsAppOTP };

console.log("WHATSAPP_API_KEY:", !!process.env.WHATSAPP_TOKEN);
console.log("WHATSAPP_PHONE_NUMBER_ID:", !!process.env.WHATSAPP_PHONE_NUMBER_ID);
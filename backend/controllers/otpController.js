import { sendWhatsAppOTP } from "../config/whatsappServices.js";

/* -------------------------------------------------------------------------- */
/*                               CONFIGURATION                                */
/* -------------------------------------------------------------------------- */

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const MAX_OTP_SEND_ATTEMPTS = 900;
const OTP_RATE_LIMIT_HOURS = 24;

/* -------------------------------------------------------------------------- */
/*                              IN-MEMORY STORES                               */
/* -------------------------------------------------------------------------- */

// phone -> { otp, createdAt, attempts }
const otpStore = new Map();

// phone -> { sendAttempts: number[], blockedUntil }
const otpRateLimitStore = new Map();

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const normalizePhone = (phone) =>
  phone.replace(/\D/g, "");

const isPhoneRateLimited = (phone) => {
  const data = otpRateLimitStore.get(phone);
  if (!data) return { limited: false };

  const now = Date.now();

  if (data.blockedUntil && now < data.blockedUntil) {
    const remainingMs = data.blockedUntil - now;
    return {
      limited: true,
      remainingTime: Math.ceil(remainingMs / (1000 * 60 * 60)),
    };
  }

  const windowMs = OTP_RATE_LIMIT_HOURS * 60 * 60 * 1000;
  data.sendAttempts = data.sendAttempts.filter(
    (t) => now - t < windowMs
  );

  if (data.sendAttempts.length >= MAX_OTP_SEND_ATTEMPTS) {
    data.blockedUntil = data.sendAttempts[0] + windowMs;
    const remainingMs = data.blockedUntil - now;
    return {
      limited: true,
      remainingTime: Math.ceil(remainingMs / (1000 * 60 * 60)),
    };
  }

  return { limited: false };
};

/* -------------------------------------------------------------------------- */
/*                              SEND OTP API                                  */
/* -------------------------------------------------------------------------- */
/**
 * POST /auth/send-otp
 * Body: { phone }
 */
export const sendOtpController = async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    phone = normalizePhone(phone);

    // Add India country code if 10-digit
    if (phone.length === 10) {
      phone = "91" + phone;
    }

    // WhatsApp-compatible validation
    if (!/^[1-9]\d{9,14}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    const rateLimit = isPhoneRateLimited(phone);
    if (rateLimit.limited) {
      return res.status(429).json({
        success: false,
        message: `OTP limit exceeded. Try again in ${rateLimit.remainingTime} hour(s).`,
      });
    }

    // Generate OTP **before sending**
    const otp = generateOTP();

    // Store OTP
    otpStore.set(phone, {
      otp,
      createdAt: Date.now(),
      attempts: 0,
    });

    // Update rate limit store
    let rateData = otpRateLimitStore.get(phone);
    if (!rateData) {
      rateData = { sendAttempts: [], blockedUntil: 0 };
      otpRateLimitStore.set(phone, rateData);
    }
    rateData.sendAttempts.push(Date.now());

    // Send OTP via WhatsApp
    try {
      await sendWhatsAppOTP(phone, otp);
      console.log("[OTP SENT SUCCESS]", phone, otp);
    } catch (err) {
      console.error("[WhatsApp SEND ERROR]", err);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP via WhatsApp: " + err.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      phone: `${phone.slice(0, 2)}****${phone.slice(-2)}`,
      attemptsRemaining:
        MAX_OTP_SEND_ATTEMPTS - rateData.sendAttempts.length,
    });
  } catch (error) {
    console.error("[OTP SEND ERROR]", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};


/* -------------------------------------------------------------------------- */
/*                              VERIFY OTP API                                */
/* -------------------------------------------------------------------------- */
/**
 * POST /auth/verify-otp
 * Body: { phone, otp }
 */
export const verifyOtpController = async (req, res) => {
  try {
    let { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    phone = normalizePhone(phone);

    console.log("[DEBUG] Received phone:", phone);
    console.log("[DEBUG] OTP store keys:", Array.from(otpStore.keys()));

    if (phone.length === 10) {
      phone = "91" + phone;
    }

    console.log("[DEBUG] Normalized phone:", phone);

    const otpData = otpStore.get(phone);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    const expiryTime =
      otpData.createdAt + OTP_EXPIRY_MINUTES * 60 * 1000;

    if (Date.now() > expiryTime) {
      otpStore.delete(phone);
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(phone);
      return res.status(429).json({
        success: false,
        message: "Too many wrong attempts",
      });
    }

    console.log("[DEBUG] Expected OTP:", otpData.otp);
    console.log("[DEBUG] Received OTP:", otp);

    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
        attemptsRemaining:
          MAX_OTP_ATTEMPTS - otpData.attempts,
      });
    }

    otpStore.delete(phone);

    return res.status(200).json({
      success: true,
      message: "Phone verified successfully",
      verified: true,
    });
  } catch (error) {
    console.error("[OTP VERIFY ERROR]", error.message);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

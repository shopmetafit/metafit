const razorpay = require("razorpay");

exports.createRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_SECRET_ID || process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_SECRET_KEY || process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.warn("⚠️ Razorpay warning: RAZORPAY_SECRET_ID or RAZORPAY_SECRET_KEY is missing from environment variables.");
  }

  return new razorpay({
    key_id: key_id || "placeholder_key_id",
    key_secret: key_secret || "placeholder_key_secret"
  });
};

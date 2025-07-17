const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
const razorpayInstance = createRazorpayInstance();
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
    //   console.log("pymco26", order);
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
  const { order_id, payment_id, signature } = req.body;

  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_KEY);
  hmac.update(order_id + "|" + payment_id);

  const generateSignature = hmac.digest("hex");

  if (generateSignature === signature) {
    return res.status(200).json({
      success: true,
      message: " Payment verified",
    });

  } else {
    return res.status(200).json({
      success: false,
      message: " Payment not verified",
    });
  }
};

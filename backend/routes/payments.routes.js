const express = require("express");
const { createOrder, verifyPayment, handleRazorpayWebhook } = require("../controllers/payments.controller");
const router = express.Router();

router.post("/createOrder", createOrder);
router.post("/verifyPayment", verifyPayment);
router.post("/razorpay-webhook", handleRazorpayWebhook);
router.post("/webhook", handleRazorpayWebhook);

module.exports = router;
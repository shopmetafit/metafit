import { Router } from "express";
import { sendOtpController, verifyOtpController } from "../controllers/otpController.js";

const router = Router();

/**
 * @route POST /auth/send-otp
 * @desc Send OTP to user phone via WhatsApp
 */
router.post("/send-otp", sendOtpController);

/**
 * @route POST /auth/verify-otp
 * @desc Verify OTP for user phone
 */
router.post("/verify-otp", verifyOtpController);

export default router;

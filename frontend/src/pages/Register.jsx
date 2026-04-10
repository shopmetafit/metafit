import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { registerUser, sendOTP, verifyOTP } from "../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { mergeCart } from "../redux/slices/cartSlice";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const otpInputRefs = useRef([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestId, otpLoading, otpVerifying } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);

  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const isCheckoutRedirect = redirect.includes("checkout");

  useEffect(() => {
    let interval;
    if (timer > 0) interval = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (showOtpInput && otpInputRefs.current[0]) {
      setTimeout(() => otpInputRefs.current[0].focus(), 100);
    }
  }, [showOtpInput]);

  useEffect(() => {
    if (user) {
      if (cart?.products?.length > 0 && guestId) {
        dispatch(mergeCart({ guestId, user })).then(() =>
          navigate(isCheckoutRedirect ? "/checkout" : "/")
        );
      } else {
        navigate(isCheckoutRedirect ? "/checkout" : "/");
      }
    }
  }, [user, guestId, cart, navigate, isCheckoutRedirect, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const num = value.replace(/\D/g, "");
      if (num.length <= 10) setFormData((p) => ({ ...p, [name]: num }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleOtpChange = (value, index) => {
    const num = value.replace(/\D/g, "");
    const newOtp = otp.split("");
    newOtp[index] = num;
    setOtp(newOtp.join(""));
    if (num && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setIsSendingOtp(true);
    try {
      const result = await dispatch(sendOTP({ phone: formData.phone }));
      if (sendOTP.fulfilled.match(result)) {
        setShowOtpInput(true);
        setOtpSent(true);
        setTimer(120);
        toast.success("OTP sent to your phone");
      } else {
        toast.error(result.payload?.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleRegistration = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error("Please fill all required fields");
      return;
    }
    const result = await dispatch(registerUser(formData));
    if (registerUser.rejected.match(result)) {
      const error = result.payload;
      if (error?.errors) error.errors.forEach((e) => toast.error(e.message));
      else if (error?.message) toast.error(error.message);
      else toast.error("Registration failed. Please try again.");
      setOtp("");
      setShowOtpInput(false);
      setOtpSent(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setIsVerifying(true);
    try {
      const result = await dispatch(verifyOTP({ phone: formData.phone, otp }));
      if (verifyOTP.fulfilled.match(result)) {
        toast.success("Phone verified!");
        await handleRegistration();
      } else {
        toast.error(result.payload?.message || "Invalid OTP. Please try again.");
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) await handleSendOtp();
    else await handleVerifyOtp();
  };

  const isLoading = isSendingOtp || isVerifying || otpLoading || otpVerifying;

  return (
    <div className="min-h-screen bg-[#f0f2f2] flex flex-col items-center justify-center px-4 py-10">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-white font-black text-xl">M</span>
        </div>
        <div className="leading-tight">
          <div className="text-lg font-black text-gray-900">M Wellness</div>
          <div className="text-xs text-teal-600 font-semibold -mt-0.5">Bazaar</div>
        </div>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-lg border border-gray-300 shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {showOtpInput ? "Verify your number" : "Create account"}
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          {showOtpInput
            ? `Enter the 6-digit OTP sent to +91 ${formData.phone}`
            : "Fill in the details below to get started"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!showOtpInput ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Your full name"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#047ca8] focus:ring-2 focus:ring-[#047ca8]/20 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#047ca8] focus:ring-2 focus:ring-[#047ca8]/20 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="At least 6 characters"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm pr-10 focus:outline-none focus:border-[#047ca8] focus:ring-2 focus:ring-[#047ca8]/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Phone Number *</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 border border-gray-300 rounded bg-gray-50 text-sm text-gray-600 flex-shrink-0">
                    +91
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#047ca8] focus:ring-2 focus:ring-[#047ca8]/20 transition"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">We'll send an OTP to verify your number</p>
              </div>
            </>
          ) : (
            <div>
              {/* OTP Timer */}
              <p className="text-xs text-gray-500 text-center mb-4">
                Expires in:{" "}
                <span className="font-bold text-gray-800">
                  {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
                </span>
              </p>

              {/* OTP Boxes */}
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpInputRefs.current[i] = el)}
                    type="text"
                    value={otp[i] || ""}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    maxLength="1"
                    inputMode="numeric"
                    className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-[#047ca8] focus:outline-none focus:ring-2 focus:ring-[#047ca8]/20 transition"
                  />
                ))}
              </div>

              <div className="text-center mb-2">
                <button
                  type="button"
                  onClick={() => timer === 0 && handleSendOtp()}
                  disabled={timer > 0 || isSendingOtp}
                  className={`text-sm font-medium transition-colors ${
                    timer > 0 || isSendingOtp
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-[#047ca8] hover:underline"
                  }`}
                >
                  {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0FB7A3] hover:bg-[#0DA28E] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-full text-sm transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isSendingOtp || otpLoading ? "Sending OTP..." : "Verifying..."}
              </>
            ) : otpSent ? (
              "Verify & Create Account"
            ) : (
              "Send OTP"
            )}
          </button>

          {showOtpInput && (
            <button
              type="button"
              onClick={() => { setShowOtpInput(false); setOtp(""); setOtpSent(false); }}
              className="w-full border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-full text-sm hover:bg-gray-50 transition-colors"
            >
              Change Phone Number
            </button>
          )}
        </form>

        {/* Trust signal */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-500">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          <span>Your information is safe and secure</span>
        </div>
      </div>

      {/* Already have account */}
      <div className="flex items-center gap-3 w-full max-w-sm my-5">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-xs text-gray-400">Already have an account?</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      <Link
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        className="w-full max-w-sm block text-center border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-2.5 rounded-full text-sm transition-colors shadow-sm"
      >
        Sign in to your account
      </Link>

      <p className="text-xs text-gray-500 mt-6 text-center max-w-xs">
        By creating an account, you agree to our{" "}
        <Link to="/terms-and-conditions" className="text-[#047ca8] hover:underline">Terms</Link>{" "}
        and{" "}
        <Link to="/privacy-policy" className="text-[#047ca8] hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
};

export default Register;

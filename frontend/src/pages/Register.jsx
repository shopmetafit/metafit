// Register.jsx
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { registerUser, sendOTP, verifyOTP } from "../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { mergeCart } from "../redux/slices/cartSlice";
import { toast } from "sonner";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
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

  // Timer effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Focus first OTP input when shown
  useEffect(() => {
    if (showOtpInput && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [showOtpInput]);

  // Navigation effect
  useEffect(() => {
    if (user) {
      if (cart?.products?.length > 0 && guestId) {
        dispatch(mergeCart({ guestId, user })).then(() => {
          navigate(isCheckoutRedirect ? "/checkout" : "/");
        });
      } else {
        navigate(isCheckoutRedirect ? "/checkout" : "/");
      }
    }
  }, [user, guestId, cart, navigate, isCheckoutRedirect, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Allow only numbers and limit to 10 digits
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOtpChange = (value, index) => {
    // Ensure only numbers
    const numericValue = value.replace(/\D/g, '');
    
    // Update OTP string
    const newOtp = otp.split('');
    newOtp[index] = numericValue;
    const updatedOtp = newOtp.join('');
    setOtp(updatedOtp);

    // Auto-focus next input
    if (numericValue && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpInputRefs.current[index - 1]) {
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
        setTimer(120); // 2 minutes timer
        toast.success("OTP sent successfully to your phone");
      } else if (sendOTP.rejected.match(result)) {
        toast.error(result.payload?.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await dispatch(verifyOTP({ 
        phone: formData.phone, 
        otp 
      }));
      
      if (verifyOTP.fulfilled.match(result)) {
        toast.success("Phone number verified successfully!");
        // Continue with registration
        await handleRegistration();
      } else if (verifyOTP.rejected.match(result)) {
        toast.error(result.payload?.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegistration = async () => {
    console.log("Registering user with data:", formData);
    if (!formData.name || !formData.email || !formData.password|| !formData.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    const result = await dispatch(registerUser(formData));
    
    if (registerUser.rejected.match(result)) {
      const error = result.payload;
      if (error?.errors) {
        error.errors.forEach((err) => toast.error(err.message));
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
      // Reset OTP verification if registration fails
      setOtp("");
      setShowOtpInput(false);
      setOtpSent(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!otpSent) {
      // First step: Send OTP
      await handleSendOtp();
    } else {
      // Second step: Verify OTP and register
      await handleVerifyOtp();
    }
  };

  const handleResendOtp = () => {
    if (timer === 0) {
      handleSendOtp();
    }
  };

  return (
    <div className="flex">
      <div className="w-full flex flex-col justify-center items-center p-4 md:p-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white p-6 md:p-8 rounded-lg border shadow-sm"
        >
          <div className="flex justify-center mb-6">
            <h2 className="text-xl font-medium">M Wellness Bazaar</h2>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-6">Hey There!</h2>
          <p className="text-center mb-6">
            {!showOtpInput 
              ? "Create your account" 
              : "Verify your phone number"
            }
          </p>

          {!showOtpInput ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter your name"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Phone Number *</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 border rounded bg-gray-50">
                    <span className="text-gray-600">+91</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="flex-1 p-2 border rounded"
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll send a verification code to this number
                </p>
              </div>
            </>
          ) : (
            <div className="mb-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Enter the 6-digit OTP sent to +91 {formData.phone}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  OTP expires in: {Math.floor(timer / 60)}:{timer % 60 < 10 ? '0' : ''}{timer % 60}
                </p>
              </div>
              
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-12 h-12 text-center text-lg border rounded-lg focus:border-blue-500 focus:outline-none"
                    maxLength="1"
                    inputMode="numeric"
                  />
                ))}
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timer > 0 || isSendingOtp}
                  className={`text-sm ${timer > 0 || isSendingOtp ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700'}`}
                >
                  {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                Didn't receive OTP? Check if the number is correct or try resend
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSendingOtp || isVerifying || otpLoading || otpVerifying}
            className="w-full bg-black text-white p-2 rounded-lg font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {(isSendingOtp || otpLoading) ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Sending OTP...
              </span>
            ) : (isVerifying || otpVerifying) ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Verifying...
              </span>
            ) : (
              otpSent ? "Verify & Create Account" : "Send OTP"
            )}
          </button>

          {showOtpInput && (
            <button
              type="button"
              onClick={() => {
                setShowOtpInput(false);
                setOtp("");
                setOtpSent(false);
              }}
              className="w-full mt-4 p-2 border rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Change Phone Number
            </button>
          )}

          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link 
              to={`/login?redirect=${encodeURIComponent(redirect)}`} 
              className="text-blue-500 hover:text-blue-700"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
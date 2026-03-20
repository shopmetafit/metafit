import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { vendorApiService } from "../services/vendorApi";

const VendorLogin = () => {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'otp'
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
    otp: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await vendorApiService.loginVendor(formData.email, formData.password);
      
      if (response.success) {
        // Store token and vendor info
        localStorage.setItem('vendorToken', response.token);
        localStorage.setItem('vendorInfo', JSON.stringify(response.vendor));
        
        toast.success("Login successful!");
        navigate("/vendor-dashboard");
      } else {
        // Handle different error scenarios
        if (response.status === 'pending') {
          toast.error("Your account is pending approval. Please wait for admin approval.");
        } else if (response.status === 'rejected') {
          toast.error("Your account has been rejected. Please contact support.");
        } else {
          toast.error(response.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.phone) {
      toast.error("Please enter your phone number");
      return;
    }

    // Validate phone number
    const normalizedPhone = formData.phone.replace(/\D/g, "");
    if (normalizedPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    try {
      const response = await vendorApiService.sendOtp(formData.phone);
      
      if (response.success) {
        toast.success("OTP sent to your phone");
        setOtpSent(true);
        setOtpTimer(120); // 2 minutes timer
        
        // Start countdown
        const timer = setInterval(() => {
          setOtpTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(response.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPLogin = async (e) => {
    e.preventDefault();

    if (!formData.phone || !formData.otp) {
      toast.error("Please fill all fields");
      return;
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(formData.otp)) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await vendorApiService.loginVendorWithOTP(formData.phone, formData.otp);
      
      if (response.success) {
        // Store token and vendor info
        localStorage.setItem('vendorToken', response.token);
        localStorage.setItem('vendorInfo', JSON.stringify(response.vendor));
        
        toast.success("Login successful!");
        navigate("/vendor-dashboard");
      } else {
        // Handle different error scenarios
        if (response.status === 'pending') {
          toast.error("Your account is pending approval. Please wait for admin approval.");
        } else if (response.status === 'rejected') {
          toast.error("Your account has been rejected. Please contact support.");
        } else {
          toast.error(response.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("OTP Login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-full flex flex-col justify-center items-center p-3 sm:p-4 md:p-8">
        <div className="w-full max-w-sm sm:max-w-md bg-white p-4 sm:p-6 md:p-8 rounded-lg border shadow-sm mx-2 sm:mx-4">
          <div className="flex justify-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-medium">M Wellness Bazaar</h2>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 sm:mb-4">Vendor Login</h2>
          <p className="text-center text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Sign in to your vendor account
          </p>

          {/* Login Method Toggle */}
          <div className="flex border border-gray-200 rounded-lg mb-4 sm:mb-6 overflow-hidden">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-medium transition ${
                loginMethod === 'email'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setLoginMethod('otp')}
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-medium transition ${
                loginMethod === 'otp'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Phone & OTP
            </button>
          </div>

          {/* Email/Password Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin}>
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="vendor@example.com"
                  required
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter your password"
                  required
                />
                <Link
                  to="/vendor-forgot-password"
                  className="text-xs sm:text-sm text-black hover:text-gray-700 font-medium mt-1 sm:mt-2 inline-block"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white p-2 sm:p-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* OTP Form */}
          {loginMethod === 'otp' && (
            <form onSubmit={handleOTPLogin}>
              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2">
                  Phone Number *
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-2 sm:px-3 border rounded bg-gray-50 text-xs sm:text-sm">
                    <span className="text-gray-600">+91</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="flex-1 p-2 sm:p-3 text-sm sm:text-base border rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-semibold mb-1 sm:mb-2">
                  OTP *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    className="flex-1 p-2 sm:p-3 text-sm sm:text-base border rounded focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={isLoading || otpSent}
                    className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {otpSent && otpTimer > 0 
                      ? `Resend OTP (${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')})` 
                      : isLoading ? "Sending..." : "Send OTP"
                    }
                  </button>
                </div>
                {otpSent && (
                  <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                    OTP expires in: {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white p-2 sm:p-3 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black"
              >
                {isLoading ? "Signing in..." : "Sign In with OTP"}
              </button>
            </form>
          )}

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
            <p className="text-center text-xs sm:text-sm text-gray-600">
              Don't have a vendor account?{" "}
              <Link to="/vendor-register" className="text-black hover:text-gray-700 font-medium">
                Register here
              </Link>
            </p>

            <p className="mt-2 sm:mt-4 text-center text-xs sm:text-sm text-gray-600">
              Looking for customer login?{" "}
              <Link to="/login" className="text-black hover:text-gray-700 font-medium">
                Customer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;

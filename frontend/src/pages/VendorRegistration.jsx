import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDispatch } from "react-redux";

const VendorRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    contactPhone: "",
    businessName: "",
    vendorName: "",
    businessEmail: "",
    company: "",

    // Step 2: Business Details
    businessType: "company",
    businessAddress: "",
    city: "",
    state: "",
    zipCode: "",

    // Step 3: Bank Details
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    accountHolderName: "",

    // Step 4: Documents
    panNumber: "",
    gstNumber: "",
    aadharNumber: "",

    // Step 5: Verification
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpInputRefs = useRef([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      setTimeout(() => {
        otpInputRefs.current[0].focus();
      }, 100);
    }
  }, [showOtpInput]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "contactPhone") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOtpChange = (value, index) => {
    const numericValue = value.replace(/\D/g, "");

    const newOtp = otp.split("");
    newOtp[index] = numericValue;
    const updatedOtp = newOtp.join("");
    setOtp(updatedOtp);

    if (numericValue && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleSendOtp = async () => {
    if (!formData.contactPhone || formData.contactPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSendingOtp(true);
    try {
      // TODO: Replace with actual API call
      // const result = await dispatch(sendOTP({ phone: formData.contactPhone }));
      
      setShowOtpInput(true);
      setOtpSent(true);
      setTimer(120);
      toast.success("OTP sent successfully to your phone");
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
      // TODO: Replace with actual API call
      // const result = await dispatch(verifyOTP({ phone: formData.contactPhone, otp }));
      
      toast.success("Phone number verified successfully!");
      setShowOtpInput(false);
      setOtp("");
      moveToNextStep();
    } catch (error) {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.contactPhone || !formData.businessName || !formData.vendorName || !formData.businessEmail || !formData.company) {
          toast.error("Please fill all required fields in Step 1");
          return false;
        }
        if (!formData.businessEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          toast.error("Please enter a valid business email");
          return false;
        }
        return true;

      case 2:
        if (!formData.businessType || !formData.businessAddress || !formData.city || !formData.state || !formData.zipCode) {
          toast.error("Please fill all required fields in Step 2");
          return false;
        }
        return true;

      case 3:
        if (!formData.bankName || !formData.accountNumber || !formData.ifscCode || !formData.accountHolderName) {
          toast.error("Please fill all required fields in Step 3");
          return false;
        }
        return true;

      case 4:
        if (!formData.panNumber || !formData.gstNumber || !formData.aadharNumber) {
          toast.error("Please fill all required fields in Step 4");
          return false;
        }
        return true;

      case 5:
        if (!formData.password || !formData.confirmPassword) {
          toast.error("Please fill all required fields in Step 5");
          return false;
        }
        if (formData.password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const moveToNextStep = () => {
    if (validateStep()) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const moveToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (currentStep === 1) {
      if (!otpSent) {
        await handleSendOtp();
      } else {
        await handleVerifyOtp();
      }
    } else if (currentStep === 5) {
      // Final submission
      if (validateStep()) {
        setIsSubmitting(true);
        try {
          // TODO: Replace with actual API call
          // const result = await dispatch(registerVendor(formData));
          toast.success("Vendor registration successful!");
          navigate("/vendor-dashboard");
        } catch (error) {
          toast.error("Registration failed. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      moveToNextStep();
    }
  };

  const handleResendOtp = () => {
    if (timer === 0) {
      handleSendOtp();
    }
  };

  const steps = [
    { number: 1, label: "Business Info" },
    { number: 2, label: "Details" },
    { number: 3, label: "Bank" },
    { number: 4, label: "Documents" },
    { number: 5, label: "Security" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Registration</h1>
          <p className="text-gray-600">Join our platform and start your journey</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8 px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => {
                    if (step.number < currentStep) {
                      setCurrentStep(step.number);
                    }
                  }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold transition ${
                    currentStep === step.number
                      ? "bg-orange-500 text-white"
                      : currentStep > step.number
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-1 ${currentStep > step.number ? "bg-green-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {currentStep}
                </div>
                <h3 className="font-semibold text-gray-900">
                  {steps[currentStep - 1].label}
                </h3>
              </div>

              <div className="mb-6">
                {currentStep === 1 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Tell us about your business and provide your contact details.</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Business Name</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Vendor Name</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Business Email</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Contact Phone</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Provide your complete business address and details.</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Business Address</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">City, State & ZIP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Business Type</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Share your banking details securely.</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Bank Name</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Account Number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">IFSC Code</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Upload your documents for verification.</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">PAN Number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">GST Number</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Aadhar Number</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Set your secure password to complete registration.</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Strong Password</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span className="text-sm text-gray-700">Confirm Password</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-600">Progress</span>
                  <span className="text-xs text-orange-500 font-semibold">{currentStep}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                  />
                </div>
              </div>

              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Already have an account? Sign in
              </Link>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
              {/* Step 1: Business Information */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>

                  {!showOtpInput ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone Number *</label>
                          <div className="flex gap-2">
                            <div className="flex items-center px-3 border border-gray-300 rounded-lg bg-gray-50">
                              <span className="text-gray-600 text-sm">+91</span>
                            </div>
                            <input
                              type="tel"
                              name="contactPhone"
                              value={formData.contactPhone}
                              onChange={handleInputChange}
                              placeholder="10-digit mobile number"
                              maxLength="10"
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || !formData.contactPhone || formData.contactPhone.length !== 10}
                            className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {isSendingOtp ? "Sending..." : "Send OTP"}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          placeholder="Enter your business name"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Name *</label>
                        <input
                          type="text"
                          name="vendorName"
                          value={formData.vendorName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Email *</label>
                        <input
                          type="email"
                          name="businessEmail"
                          value={formData.businessEmail}
                          onChange={handleInputChange}
                          placeholder="business@example.com"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">Please enter a valid business email address</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company *</label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Company name or sole proprietorship"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <p className="text-gray-600">Enter the 6-digit OTP sent to +91 {formData.contactPhone}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          OTP expires in: {Math.floor(timer / 60)}:{timer % 60 < 10 ? "0" : ""}{timer % 60}
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
                            className="w-12 h-12 text-center text-lg border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          className={`text-sm font-medium ${timer > 0 || isSendingOtp ? "text-gray-400 cursor-not-allowed" : "text-orange-600 hover:text-orange-700"}`}
                        >
                          {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Business Details */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type *</label>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="company">Company</option>
                        <option value="individual">Individual/Sole Proprietor</option>
                        <option value="partnership">Partnership</option>
                        <option value="llp">LLP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address *</label>
                      <input
                        type="text"
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleInputChange}
                        placeholder="Enter your business address"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="State"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code *</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="ZIP Code"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Bank Details */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Bank Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name *</label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        placeholder="Enter bank name"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name *</label>
                      <input
                        type="text"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleInputChange}
                        placeholder="Enter account holder name"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number *</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        placeholder="Enter account number"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code *</label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        placeholder="Enter IFSC code"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Documents */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Documents</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Number *</label>
                      <input
                        type="text"
                        name="panNumber"
                        value={formData.panNumber}
                        onChange={handleInputChange}
                        placeholder="Enter PAN number (10 characters)"
                        maxLength="10"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">GST Number *</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        placeholder="Enter GST number (15 characters)"
                        maxLength="15"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Aadhar Number *</label>
                      <input
                        type="text"
                        name="aadharNumber"
                        value={formData.aadharNumber}
                        onChange={handleInputChange}
                        placeholder="Enter Aadhar number (12 digits)"
                        maxLength="12"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Security */}
              {currentStep === 5 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Password</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter a strong password"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters required</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Re-enter your password"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={moveToPreviousStep}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                )}

                <button
                  type="submit"
                  disabled={
                    (currentStep === 1 && (isSendingOtp || isVerifying)) ||
                    (currentStep === 5 && isSubmitting)
                  }
                  className={`flex-1 px-6 py-3 font-semibold rounded-lg text-white transition ${
                    (currentStep === 1 && (isSendingOtp || isVerifying)) ||
                    (currentStep === 5 && isSubmitting)
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {currentStep === 5
                    ? isSubmitting
                      ? "Completing..."
                      : "Complete Registration"
                    : currentStep === 1 && !showOtpInput
                    ? "Send OTP"
                    : currentStep === 1 && showOtpInput
                    ? "Verify & Continue"
                    : "Next"}
                </button>
              </div>

              {/* Sign In Link */}
              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-orange-600 hover:text-orange-700 font-semibold">
                  Sign in here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration;

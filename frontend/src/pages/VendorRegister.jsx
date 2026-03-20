import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { vendorApiService } from '../services/vendorApi';

export default function VendorRegistration() {
  const [formData, setFormData] = useState({
    businessName: '',
    vendorName: '',
    email: '',
    phone: '',
    businessType: 'company',
    password: '',
    confirmPassword: '',
    bankAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    streetAddress: '',
    state: '',
    city: '',
    pincode: '',
    terms: false,
    passwordsMatch: true,
  });

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Puzzle verification state
  const [puzzle, setPuzzle] = useState({ num1: 0, num2: 0, answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [puzzleVerified, setPuzzleVerified] = useState(false);

  // Phone OTP verification state
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [existingVendor, setExistingVendor] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [timer, setTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const otpInputRefs = useRef([]);

  const navigate = useNavigate();

  // Generate new puzzle
  const generatePuzzle = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const answer = num1 + num2;
    setPuzzle({ num1, num2, answer });
    setUserAnswer('');
    setPuzzleVerified(false);
  };

  useEffect(() => {
    generatePuzzle();
  }, []);

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

  // Verify puzzle answer
  const verifyPuzzle = () => {
    if (parseInt(userAnswer) === puzzle.answer) {
      setPuzzleVerified(true);
      toast.success('Verification successful!');
    } else {
      setPuzzleVerified(false);
      toast.error('Incorrect answer. Please try again.');
      generatePuzzle();
    }
  };

  // Send OTP to phone
  const sendOtp = async () => {
    if (!formData.phone) {
      toast.error('Please enter a phone number');
      return;
    }
    setSendingOtp(true);
    try {
      const response = await vendorApiService.sendOtp(formData.phone);
      
      if (response.success) {
        setShowOtpInput(true);
        setOtpSent(true);
        setTimer(120); // 2 minutes timer
        toast.success('OTP sent successfully to your phone');
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Error sending OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Check if phone number exists in database
  const checkPhoneNumber = async (phone) => {
    if (phone.length !== 10) return;

    setCheckingPhone(true);
    setPhoneError('');
    setExistingVendor(null);

    try {
      // TODO: Replace with your actual API endpoint
      // const response = await api.post('/vendor/check-vendor-phone', { phone });
      // if (response.data.exists) {
      //   setExistingVendor(response.data.vendor);
      //   if (response.data.vendor.formData) {
      //     setFormData(prev => ({
      //       ...prev,
      //       ...response.data.vendor.formData,
      //       password: '',
      //       confirmPassword: '',
      //       passwordsMatch: true,
      //       terms: false
      //     }));
      //   }
      //   if (response.data.vendor.firstIncompletestep) {
      //     setCurrentStep(response.data.vendor.firstIncompletestep);
      //   }
      //   const progressMsg = `This phone number is already registered. You have completed ${response.data.vendor.completedFields || 0} out of ${response.data.vendor.totalFields || 0} sections. Jumping to incomplete section...`;
      //   setPhoneError(progressMsg);
      //   setShowOtpInput(false);
      //   setPhoneVerified(false);
      // }
    } catch (error) {
      console.error('Error checking phone:', error);
      toast.error('Error checking phone number. Please try again.');
    } finally {
      setCheckingPhone(false);
    }
  };

  // OTP input change handler
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

  // OTP input keydown handler
  const handleKeyDown = (e, index) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpInputRefs.current[index - 1]) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  // OTP verification handler
  const verifyOtpCode = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setVerifyingOtp(true);
    try {
      const response = await vendorApiService.verifyOtp(formData.phone, otp);
      
      if (response.success) {
        setPhoneVerified(true);
        setShowOtpInput(false);
        setOtp('');
        toast.success("Phone number verified successfully!");
      } else {
        toast.error(response.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Error verifying OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // OTP resend handler
  const handleResendOtp = () => {
    if (timer === 0) {
      sendOtp();
    }
  };

  // Validation functions
  const validateField = (name, value) => {
    const errors = { ...validationErrors };

    switch (name) {
      case 'businessName':
        if (!value.trim()) {
          errors.businessName = 'Business name is required';
        } else if (value.trim().length < 2) {
          errors.businessName = 'Business name must be at least 2 characters';
        } else if (!/^[a-zA-Z0-9\s&.,-]+$/.test(value)) {
          errors.businessName = 'Business name contains invalid characters';
        } else {
          delete errors.businessName;
        }
        break;

      case 'vendorName':
        if (!value.trim()) {
          errors.vendorName = 'Vendor name is required';
        } else if (value.trim().length < 2) {
          errors.vendorName = 'Vendor name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          errors.vendorName = 'Vendor name can only contain letters and spaces';
        } else {
          delete errors.vendorName;
        }
        break;

      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        } else {
          delete errors.email;
        }
        break;

      case 'phone':
        if (!value) {
          errors.phone = 'Phone number is required';
        } else if (value.length !== 10) {
          errors.phone = 'Phone number must be 10 digits';
        } else if (!/^\d{10}$/.test(value)) {
          errors.phone = 'Phone number must contain only digits';
        } else {
          delete errors.phone;
          // Check if phone number exists
          if (value.length === 10) {
            checkPhoneNumber(value);
          }
        }
        break;

      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        } else {
          delete errors.password;
        }
        
        // Re-validate confirm password
        if (formData.confirmPassword) {
          if (value !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
          } else {
            delete errors.confirmPassword;
          }
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match';
        } else {
          delete errors.confirmPassword;
        }
        break;

      case 'bankAccountNumber':
        if (!value) {
          errors.bankAccountNumber = 'Bank account number is required';
        } else if (!/^\d{9,18}$/.test(value)) {
          errors.bankAccountNumber = 'Bank account number must be 9-18 digits';
        } else {
          delete errors.bankAccountNumber;
        }
        break;

      case 'ifscCode':
        if (!value) {
          errors.ifscCode = 'IFSC code is required';
        } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase())) {
          errors.ifscCode = 'Please enter a valid IFSC code (e.g., SBIN0002499)';
        } else {
          delete errors.ifscCode;
        }
        break;

      case 'accountHolderName':
        if (value && !/^[a-zA-Z\s]+$/.test(value)) {
          errors.accountHolderName = 'Account holder name can only contain letters and spaces';
        } else {
          delete errors.accountHolderName;
        }
        break;

      case 'streetAddress':
        if (!value.trim()) {
          errors.streetAddress = 'Street address is required';
        } else if (value.trim().length < 5) {
          errors.streetAddress = 'Street address must be at least 5 characters';
        } else {
          delete errors.streetAddress;
        }
        break;

      case 'state':
        if (!value.trim()) {
          errors.state = 'State is required';
        } else if (value.trim().length < 2) {
          errors.state = 'State name must be at least 2 characters';
        } else {
          delete errors.state;
        }
        break;

      case 'city':
        if (!value.trim()) {
          errors.city = 'City is required';
        } else if (value.trim().length < 2) {
          errors.city = 'City name must be at least 2 characters';
        } else {
          delete errors.city;
        }
        break;

      case 'pincode':
        if (!value) {
          errors.pincode = 'Pincode is required';
        } else if (!/^\d{6}$/.test(value)) {
          errors.pincode = 'Pincode must be 6 digits';
        } else {
          delete errors.pincode;
        }
        break;

      default:
        break;
    }

    setValidationErrors(errors);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const updatedForm = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'password' || name === 'confirmPassword') {
        updatedForm.passwordsMatch =
          name === 'password'
            ? value === prev.confirmPassword
            : prev.password === value;
      }

      return updatedForm;
    });

    // Validate field in real-time
    validateField(name, value);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return (
          formData.businessName &&
          formData.vendorName &&
          formData.email &&
          formData.phone &&
          phoneVerified
        );
      case 2:
        return (
          formData.password &&
          formData.confirmPassword &&
          formData.passwordsMatch
        );
      case 3:
        return formData.bankAccountNumber && formData.ifscCode;
      case 4:
        return formData.state && formData.city && formData.pincode;
      default:
        return false;
    }
  };

  const nextStep = async () => {
    if (validateStep(currentStep)) {
      await saveStepData(currentStep);
      setCurrentStep(currentStep + 1);
    } else {
      toast.error('Please complete all required fields');
    }
  };

  // Save step data to database
  const saveStepData = async (step) => {
    try {
      // TODO: Replace with your actual API endpoint
      // const response = await api.post('/vendor/update-vendor-onboarding', {
      //   phone: formData.phone,
      //   businessType: formData.businessType,
      //   step,
      //   formData
      // });
      console.log(`Step ${step} data saved`);
    } catch (error) {
      console.error('Error saving step data:', error);
      toast.error('Failed to save progress');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.terms || !puzzleVerified) return;

    setIsLoading(true);

    const registrationData = {
      businessName: formData.businessName,
      vendorName: formData.vendorName,
      businessEmail: formData.email,
      vendorPhone: formData.phone,
      businessType: formData.businessType,
      vendorPass: formData.password,
      bankAccNumber: formData.bankAccountNumber,
      IFSCCode: formData.ifscCode,
      accountHolderName: formData.accountHolderName,
      vendorState: formData.state,
      vendorCity: formData.city,
      pinCode: formData.pincode,
      vendorAcceptance: formData.terms.toString(),
    };

    try {
      const response = await vendorApiService.registerVendor(registrationData);
      
      if (response.success || response.message === 'success') {
        toast.success(
          `${formData.vendorName} Account Created Successfully! Awaiting admin approval.`
        );

        setFormData({
          businessName: '',
          vendorName: '',
          email: '',
          phone: '',
          businessType: 'company',
          password: '',
          confirmPassword: '',
          bankAccountNumber: '',
          ifscCode: '',
          accountHolderName: '',
          streetAddress: '',
          state: '',
          city: '',
          pincode: '',
          terms: false,
          passwordsMatch: true,
        });
        setCurrentStep(1);
        generatePuzzle();
        setPhoneVerified(false);
        setShowOtpInput(false);
        setOtp('');
        setExistingVendor(null);
        setPhoneError('');

        setTimeout(() => {
          navigate('/vendor-login');
        }, 2000);
      } else {
        toast.error('Registration failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStepDetails = () => {
    const details = {
      1: {
        title: 'Business Information',
        description:
          'Tell us about your business and provide your contact details.',
        requirements: [
          'Business Name',
          'Your Full Name',
          'Business Email',
          'Business Type (Company, Individual, etc)',
          'Contact Phone Number (Verified via OTP)',
        ],
      },
      2: {
        title: 'Security Setup',
        description: 'Create a secure password for your vendor account.',
        requirements: [
          'Strong Password (min 8 characters)',
          'Confirm Password',
          'Passwords must match',
        ],
      },
      3: {
        title: 'Bank Account Details',
        description: 'Add your bank account information for receiving payments.',
        requirements: [
          'Bank Account Number',
          'IFSC Code',
          'Account Holder Name',
        ],
      },
      4: {
        title: 'Address Details',
        description: 'Provide your business location information.',
        requirements: [
          'Street Address',
          'State',
          'City',
          'Postal Code (Pincode)',
        ],
      },
      5: {
        title: 'Review & Submit',
        description: 'Review all your information and complete registration.',
        requirements: [
          'Verify all details',
          'Solve security puzzle',
          'Accept terms & conditions',
        ],
      },
    };
    return details[currentStep] || details[1];
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`
                w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all
                ${
                  currentStep >= step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {step}
            </div>
            {step < 5 && (
              <div
                className={`
                  w-4 sm:w-8 h-1 rounded transition-all
                  ${currentStep > step ? 'bg-orange-500' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center text-blue-800">
              Business Information
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Contact Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={phoneVerified}
                      maxLength={10}
                        className={`w-full pl-4 pr-4 py-3 bg-white text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                          phoneVerified
                            ? 'border-green-500 bg-green-50'
                            : existingVendor
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                      required
                    />
                    {checkingPhone && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={
                      !formData.phone ||
                      formData.phone.length !== 10 ||
                      sendingOtp ||
                      phoneVerified ||
                      existingVendor
                    }
                    className={`px-4 py-3 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                      phoneVerified
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : existingVendor
                        ? 'bg-red-500 text-white cursor-not-allowed'
                        : !formData.phone ||
                          formData.phone.length !== 10 ||
                          sendingOtp
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {phoneVerified ? (
                      <>
                        <span>✓</span>
                        <span>Verified</span>
                      </>
                    ) : existingVendor ? (
                      <>
                        <span>🔒</span>
                        <span>Already Registered</span>
                      </>
                    ) : sendingOtp ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </div>

                {phoneError && (
                  <div
                    className={`text-sm p-3 rounded-lg ${
                      existingVendor
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    {phoneError}
                    {existingVendor && existingVendor.vendorEmail && (
                      <div className="mt-2 text-xs">
                        <p>
                          <strong>Email:</strong> {existingVendor.vendorEmail}
                        </p>
                        {existingVendor.pendingFields && (
                          <p className="mt-1">
                            <strong>Pending:</strong>{' '}
                            {existingVendor.pendingFields.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {showOtpInput && !phoneVerified && (
                  <div className="space-y-4">
                    <div className="text-center mb-3 sm:mb-4">
                      <p className="text-sm text-gray-600">
                        Enter the 6-digit OTP sent to +91 {formData.phone}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                        OTP expires in: {Math.floor(timer / 60)}:{timer % 60 < 10 ? '0' : ''}{timer % 60}
                      </p>
                    </div>
                    
                    <div className="flex justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          value={otp[index] || ""}
                          onChange={(e) => handleOtpChange(e.target.value, index)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg border rounded-lg focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                          maxLength="1"
                          inputMode="numeric"
                        />
                      ))}
                    </div>
                    
                    <div className="text-center mb-3 sm:mb-4">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={timer > 0 || sendingOtp}
                        className={`text-xs sm:text-sm ${timer > 0 || sendingOtp ? 'text-gray-400 cursor-not-allowed' : 'text-black hover:text-gray-700 font-medium'}`}
                      >
                        {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={verifyOtpCode}
                        disabled={otp.length < 6 || verifyingOtp}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                          otp.length < 6 || verifyingOtp
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {verifyingOtp ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Verifying...</span>
                          </>
                        ) : (
                          'Verify OTP'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtpInput(false);
                          setOtp("");
                          setOtpSent(false);
                        }}
                        className="px-4 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-50 transition"
                      >
                        Change Phone
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center mt-2 sm:mt-4 px-2">
                      Didn't receive OTP? Check if the number is correct or try resend
                    </p>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="businessName"
                  placeholder="Business Name"
                  value={formData.businessName}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 py-3 bg-white text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.businessName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.businessName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.businessName}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="vendorName"
                  placeholder="Vendor's Name"
                  value={formData.vendorName}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 py-3 bg-white text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.vendorName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.vendorName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.vendorName}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Business Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 py-3 bg-white text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="company">Company</option>
                  <option value="individual">Individual</option>
                  <option value="partnership">Partnership</option>
                  <option value="sole_proprietor">Sole Proprietor</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-800">
              Security
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-12 py-3 bg-white text-black border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all ${
                    !formData.passwordsMatch
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {!formData.passwordsMatch && formData.confirmPassword && (
                <p className="text-red-500 text-sm flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Passwords do not match
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-800">
              Banking Details
            </h3>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  name="bankAccountNumber"
                  placeholder="Bank Account Number"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 py-3 bg-white text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.bankAccountNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  maxLength={20}
                />
                {validationErrors.bankAccountNumber && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.bankAccountNumber}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="ifscCode"
                  placeholder="IFSC Code"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 py-3 bg-white text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.ifscCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.ifscCode && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.ifscCode}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="accountHolderName"
                  placeholder="Account Holder Name"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 py-3 bg-white text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.accountHolderName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.accountHolderName}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-800">
              Address Details
            </h3>

            <div className="space-y-4">

              <div>
                <input
                  type="text"
                  name="streetAddress"
                  placeholder="Street Address"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 bg-white text-black py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.streetAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.streetAddress && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.streetAddress}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 bg-white text-black py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.state && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.state}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 py-3 bg-white text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.city && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.city}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className={`w-full pl-4 pr-4 py-3 bg-white text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-black outline-none transition-all ${
                    validationErrors.pincode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.pincode && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {validationErrors.pincode}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-800">
              Review & Confirm
            </h3>

            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg space-y-3">
              <div className="grid grid-cols-1 text-black sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Business:</span>{' '}
                  {formData.businessName}
                </div>
                <div>
                  <span className="font-semibold">Vendor:</span>{' '}
                  {formData.vendorName}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {formData.email}
                </div>
                <div>
                  <span className="font-semibold">Account:</span> ****
                  {formData.bankAccountNumber.slice(-4)}
                </div>
                <div>
                  <span className="font-semibold">IFSC:</span>{' '}
                  {formData.ifscCode}
                </div>
                <div>
                  <span className="font-semibold">Location:</span>{' '}
                  {formData.city}, {formData.state}
                </div>
              </div>
            </div>

            {/* Puzzle Verification */}
            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <span>🛡️</span>
                <h4 className="font-semibold text-blue-800">
                  Security Verification
                </h4>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-blue-700">
                  Please solve this simple math problem to verify you're human:
                </p>

                <div className="flex items-center space-x-3">
                  <div className="bg-white text-black font-semibold p-3 rounded-lg border-2 border-blue-300 font-mono text-lg">
                    {puzzle.num1} + {puzzle.num2} = ?
                  </div>

                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && verifyPuzzle()}
                    placeholder="Answer"
                    className="w-20 p-2 border bg-white text-black border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                  />

                  <button
                    type="button"
                    onClick={verifyPuzzle}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Verify
                  </button>

                  <button
                    type="button"
                    onClick={generatePuzzle}
                    className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                    title="Generate new puzzle"
                  >
                    🔄
                  </button>
                </div>

                {puzzleVerified && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <span>✓</span>
                    <span className="text-sm font-medium">
                      Verification successful!
                    </span>
                  </div>
                )}

                {userAnswer &&
                  !puzzleVerified &&
                  userAnswer !== '' && (
                    <div className="text-red-600 text-sm">
                      Incorrect answer. Please try again.
                    </div>
                  )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div
              className={`flex items-center space-x-3 p-4 rounded-lg transition-all ${
                puzzleVerified
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-gray-100 border border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                disabled={!puzzleVerified}
                className={`w-5 h-5 rounded focus:ring-2 ${
                  puzzleVerified
                    ? 'text-orange-500 border-2 border-orange-300 focus:ring-orange-500'
                    : 'text-gray-400 border-2 border-gray-300 cursor-not-allowed'
                }`}
              />
              <label
                className={`text-sm flex-1 ${
                  puzzleVerified ? 'text-gray-700' : 'text-gray-500'
                }`}
              >
                I agree to the{' '}
                <a
                  href="/vendors-agreement"
                  className={
                    puzzleVerified
                      ? 'text-orange-600 hover:underline'
                      : 'text-gray-400 cursor-not-allowed'
                  }
                  onClick={!puzzleVerified ? (e) => e.preventDefault() : undefined}
                >
                  Terms & Conditions
                </a>
              </label>
            </div>

            {!puzzleVerified && (
              <p className="text-sm text-gray-500 text-center">
                Please complete the security verification above to proceed
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const stepDetails = getStepDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 mt-14 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl sm:text-3xl">👤</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Vendor Registration
          </h1>
          <p className="text-gray-600 mt-2">
            Join our platform and start your journey
          </p>
        </div>

        {/* Progress Indicator */}
        {renderStepIndicator()}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left Sidebar - Step Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-20 border border-gray-200">
              {/* Step Title */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {currentStep}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {stepDetails.title}
                  </h2>
                </div>
                <p className="text-gray-600 text-sm">{stepDetails.description}</p>
              </div>

              {/* Requirements */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
                  What you need:
                </h3>
                <ul className="space-y-2">
                  {stepDetails.requirements.map((req, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      </div>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Progress
                  </span>
                  <span className="text-xs font-bold text-black">
                    {currentStep}/5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Login Link - Prominent */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-700 mb-3">
                  Already have an account?
                </p>
                <a
                  href="/vendor-login"
                  className="block w-full text-center bg-gradient-to-r from-blue-500 to-blue-800 text-white py-3 px-4 rounded-lg font-semibold hover:from-gray-800 hover:to-black transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Sign In Here
                </a>
              </div>
            </div>
          </div>

          {/* Right Side - Form Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
              <form onSubmit={handleSubmit}>
                {renderStep()}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={!validateStep(currentStep)}
                      className={`px-6 py-2 border rounded-lg transition-all ${
                        validateStep(currentStep)
                          ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                      }`}
                      title={
                        !validateStep(currentStep)
                          ? 'Please complete all required fields in this section first'
                          : 'Go to previous section'
                      }
                    >
                      Previous
                    </button>
                  )}

                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!validateStep(currentStep)}
                      className={`ml-auto px-6 py-2 rounded-lg font-semibold transition-all ${
                        validateStep(currentStep)
                          ? 'bg-blue-900 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-blue-500 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        !formData.terms || !puzzleVerified || isLoading
                      }
                      className={`ml-auto px-6 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
                        formData.terms && puzzleVerified && !isLoading
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <span>✓</span>
                          <span>Register</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

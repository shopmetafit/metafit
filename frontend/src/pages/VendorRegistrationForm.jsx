import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { toast } from "sonner";
import VendorFormInput from "../components/Vendor/VendorFormInput";

const VendorRegistrationForm = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Redirect if not logged in
  if (!user) {
    navigate("/login");
    return null;
  }

  // Redirect if already vendor
  if (user?.role === "vendor") {
    navigate("/vendor/dashboard");
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    businessDescription: "",
    gstNo: "",
    panNo: "",
    bankDetails: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      ifscCode: "",
    },
    pickupAddress: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
    contactPerson: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const [errors, setErrors] = useState({});
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Validation functions
  const validateGST = (gst) => {
    return /^\d{15}$/.test(gst.replace(/\D/g, ""));
  };

  const validatePAN = (pan) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  };

  const validateEmail = (email) => {
    return /^\S+@\S+\.\S+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^[0-9]{10}$/.test(phone.replace(/\D/g, ""));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      if (formData.companyName.trim().length < 3) {
        newErrors.companyName = "Company name must be at least 3 characters";
      }
      if (!formData.businessDescription.trim()) {
        newErrors.businessDescription = "Business description is required";
      }
    }

    if (step === 2) {
      if (!formData.gstNo.trim()) {
        newErrors.gstNo = "GST number is required";
      } else if (!validateGST(formData.gstNo)) {
        newErrors.gstNo = "Invalid GST format (must be 15 digits)";
      }

      if (!formData.panNo.trim()) {
        newErrors.panNo = "PAN number is required";
      } else if (!validatePAN(formData.panNo)) {
        newErrors.panNo = "Invalid PAN format (e.g., AAAAA0000A)";
      }
    }

    if (step === 3) {
      if (!formData.bankDetails.accountName.trim()) {
        newErrors["bankDetails.accountName"] = "Account name is required";
      }
      if (!formData.bankDetails.accountNumber.trim()) {
        newErrors["bankDetails.accountNumber"] = "Account number is required";
      }
      if (!formData.bankDetails.bankName.trim()) {
        newErrors["bankDetails.bankName"] = "Bank name is required";
      }
      if (!formData.bankDetails.ifscCode.trim()) {
        newErrors["bankDetails.ifscCode"] = "IFSC code is required";
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bankDetails.ifscCode)) {
        newErrors["bankDetails.ifscCode"] = "Invalid IFSC code format";
      }
    }

    if (step === 4) {
      if (!formData.pickupAddress.street.trim()) {
        newErrors["pickupAddress.street"] = "Street is required";
      }
      if (!formData.pickupAddress.city.trim()) {
        newErrors["pickupAddress.city"] = "City is required";
      }
      if (!formData.pickupAddress.state.trim()) {
        newErrors["pickupAddress.state"] = "State is required";
      }
      if (!formData.pickupAddress.pincode.trim()) {
        newErrors["pickupAddress.pincode"] = "Pincode is required";
      } else if (!/^\d{6}$/.test(formData.pickupAddress.pincode)) {
        newErrors["pickupAddress.pincode"] = "Invalid pincode (6 digits)";
      }
    }

    if (step === 5) {
      if (!formData.contactPerson.name.trim()) {
        newErrors["contactPerson.name"] = "Contact name is required";
      }
      if (!formData.contactPerson.phone.trim()) {
        newErrors["contactPerson.phone"] = "Phone number is required";
      } else if (!validatePhone(formData.contactPerson.phone)) {
        newErrors["contactPerson.phone"] = "Invalid phone number (10 digits)";
      }
      if (!formData.contactPerson.email.trim()) {
        newErrors["contactPerson.email"] = "Email is required";
      } else if (!validateEmail(formData.contactPerson.email)) {
        newErrors["contactPerson.email"] = "Invalid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name.includes(".")) {
        const [parent, child] = name.split(".");
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });

    // Clear error only if it exists
    setErrors((prev) => {
      if (prev[name]) {
        return {
          ...prev,
          [name]: "",
        };
      }
      return prev;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/vendors/register`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }, // token from localStorage.getItem("userToken")
        }
      );

      toast.success("Vendor registration submitted! Awaiting admin approval.");
      setTimeout(() => {
        navigate("/vendor/dashboard");
      }, 1500);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to register vendor";
      toast.error(message);
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Become a Vendor
          </h1>
          <p className="text-gray-600">
            Expand your business by selling on our marketplace
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                      currentStep >= step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {step === 1 && "Business"}
                    {step === 2 && "Tax"}
                    {step === 3 && "Bank"}
                    {step === 4 && "Address"}
                    {step === 5 && "Contact"}
                  </p>
                  {step < 5 && (
                    <div
                      className={`flex-1 h-1 mx-2 mt-4 ${
                        currentStep > step ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Business Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Business Information
                </h2>

                <VendorFormInput
                  label="Company Name"
                  name="companyName"
                  placeholder="Enter your business/company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  error={errors.companyName}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="businessDescription"
                    value={formData.businessDescription}
                    onChange={handleChange}
                    placeholder="Describe your business in 50-200 words"
                    rows="4"
                    autoComplete="off"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.businessDescription
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  />
                  {errors.businessDescription && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.businessDescription}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Tax Info */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Tax Information
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    <strong>Required for vendor verification.</strong> We verify
                    GST and PAN details with government databases.
                  </p>
                </div>

                <VendorFormInput
                  label="GST Number"
                  name="gstNo"
                  placeholder="27AABCT6055K1Z0"
                  value={formData.gstNo}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "gstNo",
                        value: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  error={errors.gstNo}
                  required
                />
                <p className="text-xs text-gray-500">
                  15-digit GST number issued by government
                </p>

                <VendorFormInput
                  label="PAN Number"
                  name="panNo"
                  placeholder="AAAPK1234A"
                  value={formData.panNo}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "panNo",
                        value: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  error={errors.panNo}
                  required
                />
                <p className="text-xs text-gray-500">
                  Format: AAAAA0000A (10 characters)
                </p>
              </div>
            )}

            {/* Step 3: Bank Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Bank Details
                </h2>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-900">
                    <strong>Used for payouts.</strong> Your earnings will be
                    transferred to this account monthly.
                  </p>
                </div>

                <VendorFormInput
                  label="Account Holder Name"
                  name="bankDetails.accountName"
                  placeholder="Name as per bank account"
                  value={formData.bankDetails.accountName}
                  onChange={handleChange}
                  error={errors["bankDetails.accountName"]}
                  required
                />

                <VendorFormInput
                  label="Account Number"
                  name="bankDetails.accountNumber"
                  type="password"
                  placeholder="Enter your account number"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleChange}
                  error={errors["bankDetails.accountNumber"]}
                  required
                  showToggle
                  isVisible={showAccountNumber}
                  onToggleVisibility={() => setShowAccountNumber(!showAccountNumber)}
                />

                <VendorFormInput
                  label="Bank Name"
                  name="bankDetails.bankName"
                  placeholder="e.g., HDFC Bank, ICICI Bank"
                  value={formData.bankDetails.bankName}
                  onChange={handleChange}
                  error={errors["bankDetails.bankName"]}
                  required
                />

                <VendorFormInput
                  label="IFSC Code"
                  name="bankDetails.ifscCode"
                  placeholder="HDFC0001234"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "bankDetails.ifscCode",
                        value: e.target.value.toUpperCase(),
                      },
                    })
                  }
                  error={errors["bankDetails.ifscCode"]}
                  required
                />
                <p className="text-xs text-gray-500">
                  11-character code. First 4 letters are bank code, 5th is 0,
                  last 6 are branch code.
                </p>
              </div>
            )}

            {/* Step 4: Pickup Address */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Pickup Address
                </h2>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-purple-900">
                    <strong>Warehouse/Pickup Location.</strong> Where our
                    logistics partner will collect orders from.
                  </p>
                </div>

                <VendorFormInput
                  label="Street Address"
                  name="pickupAddress.street"
                  placeholder="e.g., 123 Market Street"
                  value={formData.pickupAddress.street}
                  onChange={handleChange}
                  error={errors["pickupAddress.street"]}
                  required
                />

                <VendorFormInput
                  label="City"
                  name="pickupAddress.city"
                  placeholder="e.g., Delhi"
                  value={formData.pickupAddress.city}
                  onChange={handleChange}
                  error={errors["pickupAddress.city"]}
                  required
                />

                <VendorFormInput
                  label="State"
                  name="pickupAddress.state"
                  placeholder="e.g., Delhi"
                  value={formData.pickupAddress.state}
                  onChange={handleChange}
                  error={errors["pickupAddress.state"]}
                  required
                />

                <VendorFormInput
                  label="Pincode"
                  name="pickupAddress.pincode"
                  placeholder="e.g., 110001"
                  value={formData.pickupAddress.pincode}
                  onChange={handleChange}
                  error={errors["pickupAddress.pincode"]}
                  required
                />
              </div>
            )}

            {/* Step 5: Contact Person */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Contact Person
                </h2>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-orange-900">
                    <strong>Primary Contact.</strong> We'll use this to reach
                    you regarding your vendor account.
                  </p>
                </div>

                <VendorFormInput
                  label="Full Name"
                  name="contactPerson.name"
                  placeholder="Contact person's name"
                  value={formData.contactPerson.name}
                  onChange={handleChange}
                  error={errors["contactPerson.name"]}
                  required
                />

                <VendorFormInput
                  label="Phone Number"
                  name="contactPerson.phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formData.contactPerson.phone}
                  onChange={handleChange}
                  error={errors["contactPerson.phone"]}
                  required
                />

                <VendorFormInput
                  label="Email Address"
                  name="contactPerson.email"
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.contactPerson.email}
                  onChange={handleChange}
                  error={errors["contactPerson.email"]}
                  required
                />

                <div className="bg-gray-100 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Review Your Information
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <strong>Company:</strong> {formData.companyName}
                    </p>
                    <p>
                      <strong>GST:</strong> {formData.gstNo}
                    </p>
                    <p>
                      <strong>PAN:</strong> {formData.panNo}
                    </p>
                    <p>
                      <strong>Location:</strong> {formData.pickupAddress.city},{" "}
                      {formData.pickupAddress.state}
                    </p>
                    <p>
                      <strong>Contact:</strong> {formData.contactPerson.name} (
                      {formData.contactPerson.phone})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  currentStep === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                }`}
              >
                Previous
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
                    loading
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Submit Registration</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-900">
                ⚠️ <strong>Important:</strong> Ensure all information is
                accurate. Your vendor account will be reviewed by our team
                within 24-48 hours. You'll receive an email notification once
                approved.
              </p>
            </div>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Why Become a Vendor?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex space-x-4">
              <div className="text-3xl">📦</div>
              <div>
                <h3 className="font-semibold text-gray-800">Reach More Customers</h3>
                <p className="text-gray-600 text-sm">
                  Access our growing customer base and expand your sales
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="text-3xl">💰</div>
              <div>
                <h3 className="font-semibold text-gray-800">Competitive Commission</h3>
                <p className="text-gray-600 text-sm">
                  Industry-leading commission rates as low as 10%
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="text-3xl">📊</div>
              <div>
                <h3 className="font-semibold text-gray-800">Analytics Dashboard</h3>
                <p className="text-gray-600 text-sm">
                  Track sales, earnings, and performance metrics
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="text-3xl">🚚</div>
              <div>
                <h3 className="font-semibold text-gray-800">Logistics Support</h3>
                <p className="text-gray-600 text-sm">
                  We handle shipping and logistics for you
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistrationForm;

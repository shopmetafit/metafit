import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { AlertCircle, CheckCircle, Loader, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import VendorFormInput from "../components/Vendor/VendorFormInput";

const AdminAddVendor = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    // Redirect if not admin
    if (user?.role !== "admin") {
        navigate("/");
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
    const [touched, setTouched] = useState({});
    const [showAccountNumber, setShowAccountNumber] = useState(false);

    // Validation functions
    // const validateGST = (gst) => {
    //     return /^\d{2}[A-Z0-9]{10}\d[A-Z]\d$/.test(gst.toUpperCase());
    // };

    const validatePAN = (pan) => {
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
    };

    const validateEmail = (email) => {
        return /^\S+@\S+\.\S+$/.test(email);
    };

    const validatePhone = (phone) => {
        return /^[0-9]{10}$/.test(phone.replace(/\D/g, ""));
    };

    const validateAccountNumber = (accountNumber) => {
        return /^\d+$/.test(accountNumber);
    };

    // Helper to show error only if field is touched
    const getFieldError = (fieldName) => {
        return touched[fieldName] ? errors[fieldName] : "";
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
            // if (formData.gstNo.trim() && !validateGST(formData.gstNo)) {
            //     newErrors.gstNo = "Invalid GST format (must be 15 digits)";
            // }

            if (formData.panNo.trim() && !validatePAN(formData.panNo)) {
                newErrors.panNo = "Invalid PAN format (e.g., AAAAA0000A)";
            }
        }

        if (step === 3) {
            if (!formData.bankDetails.accountName.trim()) {
                newErrors["bankDetails.accountName"] = "Account name is required";
            }
            if (!formData.bankDetails.accountNumber.trim()) {
                newErrors["bankDetails.accountNumber"] = "Account number is required";
            } else if (!validateAccountNumber(formData.bankDetails.accountNumber)) {
                newErrors["bankDetails.accountNumber"] = "Account number must contain only digits";
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

        // Mark field as touched
        setTouched((prev) => ({
            ...prev,
            [name]: true,
        }));

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
                `${import.meta.env.VITE_BACKEND_URL}/api/vendors/admin/create`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Vendor created and approved successfully!");
            setTimeout(() => {
                navigate("/admin/vendors");
            }, 1500);
        } catch (error) {
            const message =
                error.response?.data?.message || "Failed to create vendor";
            toast.error(message);
            console.error("Vendor creation error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/admin/vendors")}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-8 font-semibold"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Vendors</span>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Add New Vendor
                    </h1>
                    <p className="text-gray-600">
                        Create and approve a new vendor account
                    </p>
                </div>

                {/* Form Container */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <form onSubmit={handleSubmit}>
                        {/* Step Indicator */}
                        <div className="flex justify-between mb-8">
                            {[1, 2, 3, 4, 5].map((step) => (
                                <div
                                    key={step}
                                    className={`flex items-center ${step < 5 ? "flex-1" : ""}`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                            currentStep >= step
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-300 text-gray-600"
                                        }`}
                                    >
                                        {step}
                                    </div>
                                    {step < 5 && (
                                        <div
                                            className={`flex-1 h-1 mx-2 ${
                                                currentStep > step
                                                    ? "bg-blue-600"
                                                    : "bg-gray-300"
                                            }`}
                                        ></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Step Content */}
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                    Company Information
                                </h2>

                                <VendorFormInput
                                    label="Company Name"
                                    name="companyName"
                                    placeholder="e.g., Tech Solutions Pvt. Ltd"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    error={getFieldError("companyName")}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Description *
                                    </label>
                                    <textarea
                                        name="businessDescription"
                                        placeholder="Describe your business, products, and services"
                                        value={formData.businessDescription}
                                        onChange={handleChange}
                                        rows="5"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    ></textarea>
                                    {getFieldError("businessDescription") && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {getFieldError("businessDescription")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Tax Details */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                                    Tax Information
                                </h2>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-blue-900">
                                        <strong>GST & PAN Details.</strong> These are optional but
                                        recommended for tax purposes.
                                    </p>
                                </div>

                                <VendorFormInput
                                    label="GST Number"
                                    name="gstNo"
                                    placeholder="e.g., 27AAPCS5055K1ZO"
                                    value={formData.gstNo}
                                    onChange={handleChange}
                                    error={getFieldError("gstNo")}
                                />

                                <VendorFormInput
                                    label="PAN Number"
                                    name="panNo"
                                    placeholder="e.g., AAAAA0000A"
                                    value={formData.panNo}
                                    onChange={handleChange}
                                    error={getFieldError("panNo")}
                                />
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
                                        <strong>Payment Disbursement.</strong> We'll transfer your
                                        earnings to this account.
                                    </p>
                                </div>

                                <VendorFormInput
                                    label="Account Holder Name"
                                    name="bankDetails.accountName"
                                    placeholder="Name as per bank account"
                                    value={formData.bankDetails.accountName}
                                    onChange={handleChange}
                                    error={getFieldError("bankDetails.accountName")}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Account Number *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showAccountNumber ? "text" : "password"}
                                            name="bankDetails.accountNumber"
                                            placeholder="16-18 digit account number"
                                            value={formData.bankDetails.accountNumber}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowAccountNumber(!showAccountNumber)
                                            }
                                            className="absolute right-3 top-3 text-gray-500"
                                        >
                                            {showAccountNumber ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    {getFieldError("bankDetails.accountNumber") && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {getFieldError("bankDetails.accountNumber")}
                                        </p>
                                    )}
                                </div>

                                <VendorFormInput
                                    label="Bank Name"
                                    name="bankDetails.bankName"
                                    placeholder="e.g., State Bank of India"
                                    value={formData.bankDetails.bankName}
                                    onChange={handleChange}
                                    error={getFieldError("bankDetails.bankName")}
                                    required
                                />

                                <VendorFormInput
                                    label="IFSC Code"
                                    name="bankDetails.ifscCode"
                                    placeholder="e.g., SBIN0001234"
                                    value={formData.bankDetails.ifscCode}
                                    onChange={handleChange}
                                    error={getFieldError("bankDetails.ifscCode")}
                                    required
                                />
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
                                        <strong>Warehouse/Pickup Location.</strong> Where logistics
                                        partner will collect orders from.
                                    </p>
                                </div>

                                <VendorFormInput
                                    label="Street Address"
                                    name="pickupAddress.street"
                                    placeholder="e.g., 123 Market Street"
                                    value={formData.pickupAddress.street}
                                    onChange={handleChange}
                                    error={getFieldError("pickupAddress.street")}
                                    required
                                />

                                <VendorFormInput
                                    label="City"
                                    name="pickupAddress.city"
                                    placeholder="e.g., Delhi"
                                    value={formData.pickupAddress.city}
                                    onChange={handleChange}
                                    error={getFieldError("pickupAddress.city")}
                                    required
                                />

                                <VendorFormInput
                                    label="State"
                                    name="pickupAddress.state"
                                    placeholder="e.g., Delhi"
                                    value={formData.pickupAddress.state}
                                    onChange={handleChange}
                                    error={getFieldError("pickupAddress.state")}
                                    required
                                />

                                <VendorFormInput
                                    label="Pincode"
                                    name="pickupAddress.pincode"
                                    placeholder="e.g., 110001"
                                    value={formData.pickupAddress.pincode}
                                    onChange={handleChange}
                                    error={getFieldError("pickupAddress.pincode")}
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
                                        the vendor regarding their account.
                                    </p>
                                </div>

                                <VendorFormInput
                                    label="Full Name"
                                    name="contactPerson.name"
                                    placeholder="Contact person's name"
                                    value={formData.contactPerson.name}
                                    onChange={handleChange}
                                    error={getFieldError("contactPerson.name")}
                                    required
                                />

                                <VendorFormInput
                                    label="Phone Number"
                                    name="contactPerson.phone"
                                    type="tel"
                                    placeholder="10-digit mobile number"
                                    value={formData.contactPerson.phone}
                                    onChange={handleChange}
                                    error={getFieldError("contactPerson.phone")}
                                    required
                                />

                                <VendorFormInput
                                    label="Email Address"
                                    name="contactPerson.email"
                                    type="email"
                                    placeholder="contact@example.com"
                                    value={formData.contactPerson.email}
                                    onChange={handleChange}
                                    error={getFieldError("contactPerson.email")}
                                    required
                                />

                                <div className="bg-gray-100 rounded-lg p-4 mt-6">
                                    <h3 className="font-semibold text-gray-800 mb-3">
                                        Review Information
                                    </h3>
                                    <div className="space-y-2 text-sm text-gray-700">
                                        <p>
                                            <strong>Company:</strong> {formData.companyName}
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
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            <span>Create & Approve Vendor</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Disclaimer */}
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-900">
                                ℹ️ <strong>Note:</strong> The vendor will be created and automatically
                                approved. They can immediately start adding products.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminAddVendor;

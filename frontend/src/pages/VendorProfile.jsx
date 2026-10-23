import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  Phone,
  User,
  Mail,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Save,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { vendorApiService } from "../services/vendorApi";

export default function VendorProfile() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [vendorData, setVendorData] = useState(null);

  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
    contactPerson: "",
    contactPhone: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("vendorToken");
    if (!token) {
      toast.error("Please login to access your vendor profile");
      navigate("/vendor-login");
      return;
    }

    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setServerError("");
      const response = await vendorApiService.getVendorProfile();

      if (response?.success && response.vendor) {
        const v = response.vendor;
        setVendorData(v);

        // Pre-fill form from existing pickupAddress or fallback to vendor root fields
        const addr = v.pickupAddress || {};
        setFormData({
          street: addr.street || "",
          city: addr.city || v.city || "",
          state: addr.state || v.state || "",
          pincode: addr.pincode || v.pincode || "",
          contactPerson: addr.contactPerson || v.vendorName || "",
          contactPhone: addr.contactPhone || v.phone || "",
        });
      } else {
        throw new Error(response?.message || "Failed to load vendor profile");
      }
    } catch (err) {
      console.error("Error loading vendor profile:", err);
      const msg = err.message || "Failed to load profile. Please try again.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errs = {};
    const street = formData.street.trim();
    const city = formData.city.trim();
    const state = formData.state.trim();
    const pincode = formData.pincode.trim().replace(/\s/g, "");
    const contactPerson = formData.contactPerson.trim();
    const contactPhone = formData.contactPhone.trim().replace(/\D/g, "");

    if (!street) {
      errs.street = "Street address is required";
    } else if (street.length < 5) {
      errs.street = "Street address must be at least 5 characters long";
    }

    if (!city) {
      errs.city = "City is required";
    }

    if (!state) {
      errs.state = "State is required";
    }

    if (!pincode) {
      errs.pincode = "PIN code is required";
    } else if (!/^\d{6}$/.test(pincode)) {
      errs.pincode = "Please enter a valid 6-digit Indian PIN code";
    }

    if (!contactPerson) {
      errs.contactPerson = "Contact person / warehouse manager name is required";
    }

    if (!contactPhone) {
      errs.contactPhone = "Contact phone number is required";
    } else if (contactPhone.length < 10) {
      errs.contactPhone = "Please enter a valid 10-digit phone number";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSuccessBanner("");
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the errors in the form before saving");
      return;
    }

    try {
      setIsSaving(true);
      setServerError("");
      setSuccessBanner("");

      const payload = {
        pickupAddress: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim().replace(/\s/g, ""),
          contactPerson: formData.contactPerson.trim(),
          contactPhone: formData.contactPhone.trim(),
        },
      };

      const response = await vendorApiService.updateVendorProfile(payload);

      if (response?.success && response.vendor) {
        setVendorData(response.vendor);
        setSuccessBanner("Pickup address updated successfully! Courier partners will use this location for parcel pickups.");
        toast.success("Pickup address saved successfully!");

        // Update local storage so other dashboard pages reflect latest address
        try {
          const rawInfo = localStorage.getItem("vendorInfo");
          if (rawInfo) {
            const parsed = JSON.parse(rawInfo);
            parsed.pickupAddress = response.vendor.pickupAddress;
            parsed.city = response.vendor.city;
            parsed.state = response.vendor.state;
            parsed.pincode = response.vendor.pincode;
            localStorage.setItem("vendorInfo", JSON.stringify(parsed));
          }
        } catch {
          // Ignore parse errors on cached info
        }
      } else {
        throw new Error(response?.message || "Failed to save pickup address");
      }
    } catch (err) {
      console.error("Error updating pickup address:", err);
      const msg = err.message || err.error || "Failed to save pickup address. Please try again.";
      setServerError(msg);
      if (err.errors) {
        setErrors(err.errors);
      }
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePickupAddress = async () => {
    try {
      setIsRemoving(true);
      setServerError("");
      setSuccessBanner("");

      const response = await vendorApiService.removeVendorPickupAddress();

      if (response?.success && response.vendor) {
        setVendorData(response.vendor);
        // Reset form address fields
        setFormData({
          street: "",
          city: response.vendor.city || "",
          state: response.vendor.state || "",
          pincode: response.vendor.pincode || "",
          contactPerson: response.vendor.vendorName || "",
          contactPhone: response.vendor.phone || "",
        });
        setErrors({});
        setShowRemoveModal(false);

        // Update local storage so dashboard reflects unconfigured state immediately
        try {
          const rawInfo = localStorage.getItem("vendorInfo");
          if (rawInfo) {
            const parsed = JSON.parse(rawInfo);
            parsed.pickupAddress = null;
            localStorage.setItem("vendorInfo", JSON.stringify(parsed));
          }
        } catch {
          // Ignore parse errors on cached info
        }

        setSuccessBanner(
          "Pickup address removed successfully. BlueDart parcel pickups and AWB generation will remain paused until a valid warehouse location is configured."
        );
        toast.success("Pickup address removed successfully");
      } else {
        throw new Error(response?.message || "Failed to remove pickup address");
      }
    } catch (err) {
      console.error("Error removing pickup address:", err);
      const msg = err.message || err.error || "Failed to remove pickup address. Please try again.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-gray-600 font-medium">Loading vendor profile...</p>
      </div>
    );
  }

  const hasConfiguredAddress = Boolean(vendorData?.pickupAddress?.street);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/vendor-dashboard")}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Vendor Profile & Warehouse Settings
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your business profile and configure the physical pickup location for courier parcel handoffs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                vendorData?.status === "approved"
                  ? "bg-green-100 text-green-800"
                  : vendorData?.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Account: {vendorData?.status?.toUpperCase() || "PENDING"}
            </span>
          </div>
        </div>

        {/* Success / Error Banners */}
        {successBanner && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start space-x-3 text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Success</p>
              <p>{successBanner}</p>
            </div>
          </div>
        )}

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3 text-red-800 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Error</p>
              <p>{serverError}</p>
            </div>
          </div>
        )}

        {/* Business Overview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Registered Business Details
              </h2>
            </div>
            <span className="text-xs text-gray-500">Read-Only</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-500 text-xs flex items-center mb-1">
                <Building2 className="w-3.5 h-3.5 mr-1" /> Business Name
              </p>
              <p className="font-medium text-gray-900">{vendorData?.businessName || "—"}</p>
            </div>

            <div>
              <p className="text-gray-500 text-xs flex items-center mb-1">
                <User className="w-3.5 h-3.5 mr-1" /> Authorized Vendor
              </p>
              <p className="font-medium text-gray-900">{vendorData?.vendorName || "—"}</p>
            </div>

            <div>
              <p className="text-gray-500 text-xs flex items-center mb-1">
                <Mail className="w-3.5 h-3.5 mr-1" /> Registered Email
              </p>
              <p className="font-medium text-gray-900 break-all">{vendorData?.email || "—"}</p>
            </div>

            <div>
              <p className="text-gray-500 text-xs flex items-center mb-1">
                <Phone className="w-3.5 h-3.5 mr-1" /> Primary Phone
              </p>
              <p className="font-medium text-gray-900">{vendorData?.phone || "—"}</p>
            </div>

            <div>
              <p className="text-gray-500 text-xs flex items-center mb-1">
                <Percent className="w-3.5 h-3.5 mr-1" /> Platform Commission
              </p>
              <p className="font-medium text-gray-900">{vendorData?.platformCommission ?? 10}%</p>
            </div>

            <div>
              <p className="text-gray-500 text-xs flex items-center mb-1">
                <MapPin className="w-3.5 h-3.5 mr-1" /> Registered Region
              </p>
              <p className="font-medium text-gray-900">
                {vendorData?.city ? `${vendorData.city}, ${vendorData.state || ""}` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Pickup Address Configuration Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Warehouse / Physical Pickup Address
                </h2>
                <p className="text-xs text-gray-500">
                  Required by BlueDart and logistics partners to dispatch drivers for parcel collection.
                </p>
              </div>
            </div>

            <div>
              {hasConfiguredAddress ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Address Configured
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Setup Required
                </span>
              )}
            </div>
          </div>

          {hasConfiguredAddress && (
            <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 text-sm">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">Current Saved Pickup Location</p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {vendorData.pickupAddress.street}, {vendorData.pickupAddress.city}, {vendorData.pickupAddress.state} - {vendorData.pickupAddress.pincode}
                    <span className="block text-emerald-700 mt-0.5 font-medium">
                      Contact: {vendorData.pickupAddress.contactPerson} ({vendorData.pickupAddress.contactPhone})
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRemoveModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 bg-white hover:bg-red-50 text-xs font-semibold rounded-lg shadow-2xs transition self-start sm:self-center whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 text-red-500" />
                Remove Address
              </button>
            </div>
          )}

          {!hasConfiguredAddress && (
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-3.5 flex items-start space-x-3 text-amber-900 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Action Required for Order Fulfillment</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  You have not configured a physical pickup address yet. Courier waybills (AWBs) cannot be generated for your packages until a valid street address, PIN code, and contact person are saved.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Street Address */}
            <div>
              <label htmlFor="street" className="block text-sm font-semibold text-gray-700 mb-1">
                Street Address / Building / Plot No. <span className="text-red-500">*</span>
              </label>
              <textarea
                id="street"
                name="street"
                rows={3}
                value={formData.street}
                onChange={handleChange}
                placeholder="e.g. Unit 4B, Building C, Industrial Tech Park, Ring Road"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.street
                    ? "border-red-400 focus:ring-red-200 bg-red-50/20"
                    : "border-gray-300 focus:border-emerald-600 focus:ring-emerald-100"
                }`}
              />
              {errors.street && (
                <p className="text-xs text-red-600 mt-1">{errors.street}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Enter your exact physical dispatch location so the pickup courier can locate the warehouse.
              </p>
            </div>

            {/* City & State Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Pune"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.city
                      ? "border-red-400 focus:ring-red-200 bg-red-50/20"
                      : "border-gray-300 focus:border-emerald-600 focus:ring-emerald-100"
                  }`}
                />
                {errors.city && (
                  <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.state
                      ? "border-red-400 focus:ring-red-200 bg-red-50/20"
                      : "border-gray-300 focus:border-emerald-600 focus:ring-emerald-100"
                  }`}
                />
                {errors.state && (
                  <p className="text-xs text-red-600 mt-1">{errors.state}</p>
                )}
              </div>
            </div>

            {/* Pincode & Contact Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pincode" className="block text-sm font-semibold text-gray-700 mb-1">
                  6-Digit PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 411001"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.pincode
                      ? "border-red-400 focus:ring-red-200 bg-red-50/20"
                      : "border-gray-300 focus:border-emerald-600 focus:ring-emerald-100"
                  }`}
                />
                {errors.pincode && (
                  <p className="text-xs text-red-600 mt-1">{errors.pincode}</p>
                )}
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700 mb-1">
                  Warehouse Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.contactPhone
                      ? "border-red-400 focus:ring-red-200 bg-red-50/20"
                      : "border-gray-300 focus:border-emerald-600 focus:ring-emerald-100"
                  }`}
                />
                {errors.contactPhone && (
                  <p className="text-xs text-red-600 mt-1">{errors.contactPhone}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  The pickup rider will call this number when arriving at your facility.
                </p>
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-semibold text-gray-700 mb-1">
                Contact Person / Dispatch Manager <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="e.g. Rajesh Kumar (Warehouse Supervisor)"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.contactPerson
                    ? "border-red-400 focus:ring-red-200 bg-red-50/20"
                    : "border-gray-300 focus:border-emerald-600 focus:ring-emerald-100"
                }`}
              />
              {errors.contactPerson && (
                <p className="text-xs text-red-600 mt-1">{errors.contactPerson}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="order-2 sm:order-1 flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
                {hasConfiguredAddress && (
                  <button
                    type="button"
                    onClick={() => setShowRemoveModal(true)}
                    disabled={isSaving || isRemoving}
                    className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 bg-red-50/40 hover:bg-red-100/70 font-semibold text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-2xs"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5 text-red-600" />
                    Remove Pickup Address
                  </button>
                )}
                <span className="text-xs text-gray-500">
                  {hasConfiguredAddress
                    ? "Changes apply immediately to future courier pickups."
                    : "Configuring an address enables courier parcel pickups."}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSaving || isRemoving}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm order-1 sm:order-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Address...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Pickup Address
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Confirmation Modal */}
        {showRemoveModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div
              className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Remove Pickup Address?
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to remove your saved courier pickup address?
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                <div className="flex items-center font-semibold text-amber-950">
                  <AlertTriangle className="w-4 h-4 mr-1 text-amber-600 flex-shrink-0" />
                  Logistics Impact Warning
                </div>
                <p>
                  BlueDart courier parcel pickups and AWB generation will be temporarily paused for your orders until a new verified address is saved.
                </p>
              </div>

              {vendorData?.pickupAddress?.street && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700">
                  <p className="font-semibold text-gray-800">Address to be removed:</p>
                  <p className="mt-0.5 text-gray-600">
                    {vendorData.pickupAddress.street}, {vendorData.pickupAddress.city},{" "}
                    {vendorData.pickupAddress.state} - {vendorData.pickupAddress.pincode}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRemoveModal(false)}
                  disabled={isRemoving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemovePickupAddress}
                  disabled={isRemoving}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition shadow-sm"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Yes, Remove Address
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

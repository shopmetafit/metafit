import { useState, useEffect } from "react";
import { X, Loader2, Home, Briefcase, MapPin, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const AddEditAddressModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState({
    addressType: "Home",
    fullName: "",
    phone: "",
    house: "",
    area: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
  });

  const [errors, setErrors] = useState({});
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        addressType: initialData.addressType || "Home",
        fullName: initialData.fullName || "",
        phone: initialData.phone || "",
        house: initialData.house || "",
        area: initialData.area || "",
        landmark: initialData.landmark || "",
        city: initialData.city || "",
        district: initialData.district || "",
        state: initialData.state || "",
        pincode: initialData.pincode || "",
        country: initialData.country || "India",
        isDefault: Boolean(initialData.isDefault),
      });
    } else {
      setFormData({
        addressType: "Home",
        fullName: "",
        phone: "",
        house: "",
        area: "",
        landmark: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        country: "India",
        isDefault: false,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const fetchLocationByPincode = async (cleanPin) => {
    if (cleanPin.length !== 6) return;
    setIsPincodeLoading(true);

    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${cleanPin}`);
      if (response.data && response.data[0]?.Status === "Success" && response.data[0]?.PostOffice?.length > 0) {
        const postOffice = response.data[0].PostOffice[0];
        const detectedCity = postOffice.District || postOffice.Division || postOffice.Block || postOffice.Name || "";
        const detectedState = postOffice.State || "";
        const detectedDistrict = postOffice.District || "";

        setFormData((prev) => ({
          ...prev,
          city: detectedCity || prev.city,
          state: detectedState || prev.state,
          district: detectedDistrict || prev.district,
          country: "India",
        }));
        setErrors((prev) => ({ ...prev, pincode: null }));
        toast.success(`📍 Auto-filled ${detectedCity}${detectedState ? `, ${detectedState}` : ""}!`);
        return;
      }
      throw new Error("Pincode lookup failed");
    } catch (err) {
      // Fallback lookup
      try {
        const fallbackRes = await axios.get(`https://api.zippopotam.us/in/${cleanPin}`);
        if (fallbackRes.data && fallbackRes.data.places?.length > 0) {
          const place = fallbackRes.data.places[0];
          setFormData((prev) => ({
            ...prev,
            city: place["place name"] || prev.city,
            state: place["state"] || prev.state,
            country: "India",
          }));
          toast.success(`📍 Auto-filled ${place["place name"]}!`);
        }
      } catch (fallbackErr) {
        console.warn("Pincode lookup error:", fallbackErr);
      }
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, pincode: val }));
    const cleanPin = val.trim().replace(/\D/g, "");
    if (cleanPin.length === 6) {
      fetchLocationByPincode(cleanPin);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = "Full name is required";
    
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (cleanPhone.length < 10 || cleanPhone.length > 12) {
      errs.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.house.trim()) errs.house = "House / Flat / Building is required";
    if (!formData.area.trim()) errs.area = "Area / Street details are required";
    
    const cleanPin = formData.pincode.replace(/\D/g, "");
    if (!formData.pincode.trim()) {
      errs.pincode = "Pincode is required";
    } else if (cleanPin.length !== 6) {
      errs.pincode = "Pincode must be 6 digits";
    }

    if (!formData.city.trim()) errs.city = "City is required";
    if (!formData.state.trim()) errs.state = "State is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 overflow-hidden text-left border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">
            {initialData ? "Edit Address" : "Add New Address"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Address Type selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Address Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: "Home", icon: Home },
                { type: "Work", icon: Briefcase },
                { type: "Other", icon: MapPin },
              ].map(({ type, icon: Icon }) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFormData({ ...formData, addressType: type })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    formData.addressType === type
                      ? "border-[#047ca8] bg-blue-50 text-[#047ca8] shadow-xs"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full p-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-[#047ca8]/20 focus:border-[#047ca8] outline-none ${
                  errors.fullName ? "border-red-400 bg-red-50/50" : "border-gray-200"
                }`}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full p-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-[#047ca8]/20 focus:border-[#047ca8] outline-none ${
                  errors.phone ? "border-red-400 bg-red-50/50" : "border-gray-200"
                }`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* House / Building & Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Flat, House No., Building, Company *
            </label>
            <input
              type="text"
              placeholder="e.g. Flat 402, Sunshine Apartments"
              value={formData.house}
              onChange={(e) => setFormData({ ...formData, house: e.target.value })}
              className={`w-full p-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-[#047ca8]/20 focus:border-[#047ca8] outline-none ${
                errors.house ? "border-red-400 bg-red-50/50" : "border-gray-200"
              }`}
            />
            {errors.house && <p className="text-red-500 text-xs mt-1">{errors.house}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Area, Street, Sector, Village *
            </label>
            <input
              type="text"
              placeholder="e.g. MG Road, Sector 14"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className={`w-full p-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-[#047ca8]/20 focus:border-[#047ca8] outline-none ${
                errors.area ? "border-red-400 bg-red-50/50" : "border-gray-200"
              }`}
            />
            {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Landmark (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Near City Mall"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#047ca8]/20 focus:border-[#047ca8] outline-none"
            />
          </div>

          {/* Pincode & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  PIN Code *
                </label>
                {isPincodeLoading && (
                  <span className="text-[11px] text-[#047ca8] font-medium flex items-center animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" /> Auto-filling...
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit PIN code"
                value={formData.pincode}
                onChange={handlePincodeChange}
                className={`w-full p-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-[#047ca8]/20 focus:border-[#047ca8] outline-none ${
                  errors.pincode ? "border-red-400 bg-red-50/50" : "border-gray-200"
                }`}
              />
              {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Town / City *
              </label>
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full p-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-[#047ca8]/20 focus:border-[#047ca8] outline-none ${
                  errors.city ? "border-red-400 bg-red-50/50" : "border-gray-200"
                }`}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
          </div>

          {/* State & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                District (Optional)
              </label>
              <input
                type="text"
                placeholder="District"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#047ca8]/20 focus:border-[#047ca8] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                State *
              </label>
              <input
                type="text"
                placeholder="State (e.g. Rajasthan)"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={`w-full p-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-[#047ca8]/20 focus:border-[#047ca8] outline-none ${
                  errors.state ? "border-red-400 bg-red-50/50" : "border-gray-200"
                }`}
              />
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>
          </div>

          {/* Country & Default Checkbox */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="w-full sm:w-auto flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                readOnly
                className="w-full p-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="isDefaultCheck"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 text-[#047ca8] focus:ring-[#047ca8] rounded border-gray-300 cursor-pointer"
              />
              <label htmlFor="isDefaultCheck" className="text-xs font-semibold text-gray-700 cursor-pointer">
                Make this my default address
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#047ca8] hover:bg-[#036d94] text-white font-bold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Save Address
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditAddressModal;

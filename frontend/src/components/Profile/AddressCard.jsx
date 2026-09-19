import { Home, Briefcase, MapPin, Check, Edit2, Trash2, Star } from "lucide-react";

const AddressCard = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isSelected = false,
  onSelect = null,
  selectable = false,
}) => {
  const {
    _id,
    addressType = "Home",
    fullName,
    phone,
    house,
    area,
    landmark,
    city,
    district,
    state,
    pincode,
    country = "India",
    isDefault,
  } = address;

  const getTypeIcon = () => {
    switch (String(addressType).toLowerCase()) {
      case "work":
        return <Briefcase className="h-4 w-4 text-purple-600" />;
      case "other":
        return <MapPin className="h-4 w-4 text-emerald-600" />;
      default:
        return <Home className="h-4 w-4 text-blue-600" />;
    }
  };

  const fullAddrStr = [house, area, landmark, city, district, state, pincode, country]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      onClick={selectable && onSelect ? () => onSelect(address) : undefined}
      className={`bg-white rounded-xl border transition-all p-4 text-left relative flex flex-col justify-between ${
        selectable ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "border-[#047ca8] ring-2 ring-[#047ca8]/20 bg-blue-50/20 shadow-md"
          : isDefault
          ? "border-emerald-300 bg-emerald-50/10 shadow-sm"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700 capitalize">
            {getTypeIcon()}
            <span>{addressType}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isDefault && (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Check className="h-3 w-3" /> Default
              </span>
            )}
            {selectable && (
              <input
                type="radio"
                name="selectedAddress"
                checked={isSelected}
                onChange={() => onSelect && onSelect(address)}
                className="h-4 w-4 text-[#047ca8] focus:ring-[#047ca8] cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* Recipient Details */}
        <p className="font-bold text-gray-900 text-base mb-1">{fullName}</p>
        <p className="text-xs text-gray-600 font-medium mb-2">📞 +91 {phone}</p>

        {/* Address Lines */}
        <div className="text-xs text-gray-600 space-y-0.5 leading-relaxed">
          <p className="font-medium text-gray-800">{house}, {area}</p>
          {landmark && <p className="text-gray-500">Landmark: {landmark}</p>}
          <p>{city}{district ? `, ${district}` : ""}, {state} - <span className="font-semibold text-gray-800">{pincode}</span></p>
          <p className="text-gray-400">{country}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {!selectable && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4 gap-2">
          {!isDefault ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault && onSetDefault(_id);
              }}
              className="inline-flex items-center gap-1 text-xs text-[#047ca8] hover:text-[#036589] font-medium py-1 px-2 rounded hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Star className="h-3.5 w-3.5" /> Set Default
            </button>
          ) : (
            <span className="text-[11px] text-emerald-600 font-medium italic">Primary Address</span>
          )}

          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(address);
              }}
              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Address"
              aria-label="Edit Address"
            >
              <Edit2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(_id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Address"
              aria-label="Delete Address"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressCard;

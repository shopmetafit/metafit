import { memo } from "react";
import { Eye, EyeOff } from "lucide-react";

const VendorFormInput = memo(
  ({
    label,
    name,
    type = "text",
    placeholder,
    value,
    onChange,
    error,
    required = false,
    icon: Icon,
    showToggle = false,
    onToggleVisibility = null,
    isVisible = false,
  }) => {
    const inputType = type === "password" ? (isVisible ? "text" : "password") : type;

    return (
      <div className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-3 text-gray-400 pointer-events-none" size={20} />
          )}
          <input
            id={name}
            type={inputType}
            name={name}
            value={value || ""}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete="off"
            className={`w-full px-4 py-2 ${
              Icon ? "pl-10" : ""
            } ${showToggle ? "pr-10" : ""} border rounded-lg focus:outline-none focus:ring-2 transition ${
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {showToggle && onToggleVisibility && (
            <button
              type="button"
              onClick={onToggleVisibility}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
            >
              {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

VendorFormInput.displayName = "VendorFormInput";

export default VendorFormInput;

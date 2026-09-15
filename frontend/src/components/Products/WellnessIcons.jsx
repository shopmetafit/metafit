import React from "react";

export const WellnessIcon = ({ id, className = "w-4 h-4 flex-shrink-0" }) => {
  const iconId = (id || "").toLowerCase().trim();

  switch (iconId) {
    case "all":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="#0FB7A3" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill="#3B82F6" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill="#F59E0B" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill="#8B5CF6" />
        </svg>
      );

    case "hair-care":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F5F3FF" />
          <path d="M7 6C8.5 9 10 11 12 12C14 11 15.5 9 17 6" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 12C7 16 10 19 12 20C14 19 17 16 19 12" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill="#A78BFA" />
          <path d="M16 8L19 5" stroke="#0FB7A3" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "hair-oils-tonics":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FFFBEB" />
          <path d="M12 4C12 4 6.5 10 6.5 14.5C6.5 17.5 9 20 12 20C15 20 17.5 17.5 17.5 14.5C17.5 10 12 4 12 4Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="10" cy="13" r="1.2" fill="#B45309" />
          <path d="M12 10V16" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "shampoos-cleansers":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F0F9FF" />
          <rect x="8" y="9" width="8" height="11" rx="2.5" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.6" />
          <path d="M10 9V5H14V9" stroke="#0369A1" strokeWidth="1.6" />
          <path d="M10 5H6" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="15.5" cy="5.5" r="1" fill="#0EA5E9" />
        </svg>
      );

    case "hair-masks-colors":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#ECFDF5" />
          <path d="M5 11C5 16 8.5 19 12 19C15.5 19 19 16 19 11H5Z" fill="#A7F3D0" stroke="#059669" strokeWidth="1.8" />
          <path d="M9 8L15 4" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="14" r="1.5" fill="#047857" />
        </svg>
      );

    case "skin-care":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FDF2F8" />
          <path d="M12 4L13.5 8.5L18 10L13.5 11.5L12 16L10.5 11.5L6 10L10.5 8.5L12 4Z" fill="#FBCFE8" stroke="#DB2777" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="18" cy="17" r="2" fill="#F472B6" />
        </svg>
      );

    case "face-wash-cleansers":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F0FDFA" />
          <circle cx="9" cy="10" r="3.5" fill="#CCFBF1" stroke="#0D9488" strokeWidth="1.6" />
          <circle cx="15.5" cy="14.5" r="4.5" fill="#99F6E4" stroke="#0F766E" strokeWidth="1.6" />
          <circle cx="15" cy="7.5" r="2" fill="#5EEAD4" />
        </svg>
      );

    case "ubtan-face-packs":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FFFBEB" />
          <path d="M5 12C5 16.5 8.2 19.5 12 19.5C15.8 19.5 19 16.5 19 12H5Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          <path d="M9 8L15 4.5" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="15" r="1.5" fill="#D97706" />
        </svg>
      );

    case "creams-serums-gels":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FFF1F2" />
          <rect x="7.5" y="9" width="9" height="11" rx="2.5" fill="#FECDD3" stroke="#E11D48" strokeWidth="1.8" />
          <path d="M10 9V5.5H14V9" stroke="#BE123C" strokeWidth="1.6" />
          <path d="M12 2V5.5" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "soaps-body-care":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F5F3FF" />
          <rect x="5" y="9" width="14" height="9" rx="3.5" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="1.8" />
          <circle cx="8" cy="6" r="1.8" fill="#C4B5FD" />
          <circle cx="15" cy="5" r="2.2" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="1.2" />
        </svg>
      );

    case "health-devices":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#EFF6FF" />
          <rect x="4.5" y="6" width="15" height="12" rx="3" fill="#BFDBFE" stroke="#2563EB" strokeWidth="1.8" />
          <path d="M7 12H9.5L11 8.5L13 15.5L14.5 12H17" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "insulin-coolers":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#ECFEFF" />
          <rect x="7" y="5" width="10" height="14" rx="2.5" fill="#A5F3FC" stroke="#0891B2" strokeWidth="1.8" />
          <path d="M12 9V15M9 12H15" stroke="#0E7490" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="1.5" fill="#0891B2" />
        </svg>
      );

    case "steamers-therapy":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F8FAFC" />
          <path d="M6 18C6 14.5 8.7 12 12 12C15.3 12 18 14.5 18 18H6Z" fill="#CBD5E1" stroke="#475569" strokeWidth="1.8" />
          <path d="M9.5 8.5C9.5 6.5 10.5 5.5 10.5 4M12 9C12 7 13 6 13 4.5M14.5 8.5C14.5 6.5 15.5 5.5 15.5 4" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case "diagnostic-wellness":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FEF2F2" />
          <circle cx="12" cy="12" r="6.5" fill="#FECACA" stroke="#DC2626" strokeWidth="1.8" />
          <path d="M12 8V12L14.5 13.5" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case "nutrition-supplements":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F0FDF4" />
          <path d="M12 4C8 4 5 7 5 11.5C5 16 8.5 20 12 20C15.5 20 19 16 19 11.5C19 7 16 4 12 4Z" fill="#BBF7D0" stroke="#16A34A" strokeWidth="1.8" />
          <path d="M12 4V7" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
          <path d="M9.5 12L11.5 14L15 9.5" stroke="#15803D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "protein-energy":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FEFCE8" />
          <path d="M13 3L6 13H12L11 21L18 11H12L13 3Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );

    case "millet-snacks":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FFF7ED" />
          <circle cx="12" cy="12" r="7" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.8" />
          <circle cx="9.5" cy="10" r="1" fill="#9A3412" />
          <circle cx="14.5" cy="10.5" r="1.2" fill="#9A3412" />
          <circle cx="11.5" cy="14.5" r="1" fill="#9A3412" />
        </svg>
      );

    case "sweeteners-jaggery":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FFFBEB" />
          <path d="M7 8C7 6.5 9.2 5 12 5C14.8 5 17 6.5 17 8V17C17 18.5 14.8 20 12 20C9.2 20 7 18.5 7 17V8Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          <path d="M5.5 8H18.5" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="13" r="2" fill="#F59E0B" />
        </svg>
      );

    case "ayurveda-panchakarma":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#ECFDF5" />
          <path d="M12 3C12 3 7 8.5 7 13.5C7 16.5 9.2 19 12 20.5C14.8 19 17 16.5 17 13.5C17 8.5 12 3 12 3Z" fill="#A7F3D0" stroke="#059669" strokeWidth="1.8" />
          <path d="M12 8V16M9.5 11.5L12 14L14.5 11.5" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "microgreens":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F0FDF4" />
          <path d="M12 19V11M12 11C12 7.5 8 6.5 8 10C8 11.8 10.5 12.5 12 11ZM12 11C12 7.5 16 6.5 16 10C16 11.8 13.5 12.5 12 11Z" fill="#BBF7D0" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 19H18" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "ayurvedic-herbs":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#ECFDF5" />
          <path d="M6 10.5C6 15 8.7 18.5 12 18.5C15.3 18.5 18 15 18 10.5H6Z" fill="#A7F3D0" stroke="#059669" strokeWidth="1.8" />
          <path d="M9 6L15 10" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="14" r="1.5" fill="#047857" />
        </svg>
      );

    case "panchakarma-therapy":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FFFBEB" />
          <path d="M8 8C8 5.5 10 4 12 4C14 4 16 5.5 16 8C16 10.5 18.5 12.5 18.5 16C18.5 18.5 15.5 20.5 12 20.5C8.5 20.5 5.5 18.5 5.5 16C5.5 12.5 8 10.5 8 8Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          <circle cx="12" cy="14.5" r="1.8" fill="#B45309" />
        </svg>
      );

    case "pain-relief":
    case "pain-relief-potli":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FFF7ED" />
          <path d="M12 4C8.5 4 6 7 6 11C6 15 8.5 18 12 19.5C15.5 18 18 15 18 11C18 7 15.5 4 12 4Z" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.8" />
          <path d="M9 11.5H15M12 8.5V14.5" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "baby-kids":
    case "baby-skincare":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F0F9FF" />
          <circle cx="12" cy="10" r="5" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.8" />
          <path d="M7 18C8.5 15.5 10 14.5 12 14.5C14 14.5 15.5 15.5 17 18" stroke="#0369A1" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="10" cy="9.5" r="0.9" fill="#0369A1" />
          <circle cx="14" cy="9.5" r="0.9" fill="#0369A1" />
        </svg>
      );

    case "womens-care":
    case "menstrual-hygiene":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#FDF2F8" />
          <circle cx="12" cy="9" r="4.5" fill="#FBCFE8" stroke="#DB2777" strokeWidth="1.8" />
          <path d="M12 13.5V20.5M9.5 17.5H14.5" stroke="#BE185D" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F1F5F9" />
          <circle cx="12" cy="12" r="4" fill="#94A3B8" />
        </svg>
      );
  }
};

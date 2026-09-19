import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const welcomeItems = [
  {
    title: "Why Choose M Wellness Bazaar?",
    body: "We source only the highest quality, authentic wellness products from trusted suppliers worldwide. Every product undergoes rigorous quality checks for purity, potency, and effectiveness.",
  },
  {
    title: "Our Comprehensive Product Range",
    body: "From energy-boosting supplements and nutritional powerhouses to skincare products infused with natural ingredients, stress-relief solutions, Ayurvedic remedies, and fitness accessories — we've got you covered.",
  },
  {
    title: "Quality Assurance & Authenticity Guarantee",
    body: "All our wellness products are 100% authentic and sourced directly from manufacturers or authorized distributors. We never compromise on quality or sell counterfeit items.",
  },
  {
    title: "Fast & Free Shipping",
    body: "We offer fast shipping on all orders, with free shipping on qualifying purchases. Our efficient logistics network ensures your products reach you quickly and in pristine condition.",
  },
];

const WelcomeAccordion = ({ isOpen, onToggle }) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isMainOpen = isOpen !== undefined ? isOpen : internalOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      {/* Main Accordion Header */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isMainOpen}
        aria-controls="welcome-accordion-body"
        className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors cursor-pointer select-none group focus:outline-none focus:ring-2 focus:ring-[#0FB7A3]/40"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-teal-800 transition-colors leading-snug pr-2">
          Welcome to M Wellness Bazaar — Your Premium Wellness Destination
        </h2>
        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 ml-3 group-hover:bg-teal-100 transition-colors">
          {isMainOpen ? (
            <Minus className="w-5 h-5 text-[#0FB7A3]" />
          ) : (
            <Plus className="w-5 h-5 text-[#0FB7A3]" />
          )}
        </div>
      </button>

      {/* Main Accordion Content */}
      {isMainOpen && (
        <div
          id="welcome-accordion-body"
          className="px-5 pb-6 sm:px-8 sm:pb-8 border-t border-gray-100 animate-in fade-in duration-300"
        >
          <div className="space-y-4 text-sm sm:text-base text-gray-600 leading-relaxed mt-4">
            <p>
              At M Wellness Bazaar, we believe that true wellness is a journey, not a destination. Our carefully curated collection of premium wellness products is designed to support your path to vibrant health, blending ancient healing wisdom with modern scientific innovation.
            </p>
            {welcomeItems.map((item) => (
              <div key={item.title} className="pt-2 border-t border-gray-50">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default WelcomeAccordion;

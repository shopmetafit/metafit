import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "Are your wellness products authentic and safe?",
    answer:
      "Yes, all our products are sourced from trusted manufacturers and go through strict quality checks to ensure safety and effectiveness.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery usually takes 3–7 business days depending on your location. Tracking details are shared after dispatch.",
  },
  {
    question: "Can I return or replace a product?",
    answer:
      "Yes, returns or replacements are available for damaged, expired, or incorrect products within 7 days of delivery.",
  },
  {
    question: "Do you offer Cash on Delivery (COD)?",
    answer:
      "Yes, COD is available on selected products and locations. You can check availability during checkout.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "You can reach our support team via the Contact Us page or email. We usually respond within 24 hours.",
  },
];

const FAQSection = ({ isOpen, onToggle }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const isMainOpen = isOpen !== undefined ? isOpen : internalOpen;

  const handleMainToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  const toggleFAQ = (index, e) => {
    e.stopPropagation();
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      {/* Level 1 Main Accordion Header */}
      <button
        type="button"
        onClick={handleMainToggle}
        aria-expanded={isMainOpen}
        aria-controls="faq-accordion-body"
        className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors cursor-pointer select-none group focus:outline-none focus:ring-2 focus:ring-[#0FB7A3]/40"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-teal-800 transition-colors">
          Frequently Asked Questions
        </h2>
        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 ml-3 group-hover:bg-teal-100 transition-colors">
          {isMainOpen ? (
            <Minus className="w-5 h-5 text-[#0FB7A3]" />
          ) : (
            <Plus className="w-5 h-5 text-[#0FB7A3]" />
          )}
        </div>
      </button>

      {/* Level 1 Main Accordion Body */}
      {isMainOpen && (
        <div
          id="faq-accordion-body"
          className="px-5 pb-6 sm:px-8 sm:pb-8 border-t border-gray-100 animate-in fade-in duration-300"
        >
          <p className="text-gray-600 text-sm sm:text-base mt-4 mb-6">
            Everything you need to know about our products and services.
          </p>

          {/* Level 2 Individual Question Accordions */}
          <div className="max-w-3xl space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 transition-colors hover:border-teal-200 bg-white"
              >
                <button
                  type="button"
                  onClick={(e) => toggleFAQ(index, e)}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer"
                >
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base pr-2">
                    {faq.question}
                  </h3>
                  {openIndex === index ? (
                    <Minus className="w-4 h-4 text-[#0FB7A3] flex-shrink-0" />
                  ) : (
                    <Plus className="w-4 h-4 text-[#0FB7A3] flex-shrink-0" />
                  )}
                </button>

                {openIndex === index && (
                  <p
                    id={`faq-answer-${index}`}
                    className="mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed pt-2 border-t border-gray-100 animate-in fade-in duration-200"
                  >
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default FAQSection;

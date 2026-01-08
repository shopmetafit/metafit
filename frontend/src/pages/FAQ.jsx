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

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mt-16 bg-white rounded-xl shadow-sm p-6 sm:p-10">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
        Frequently Asked Questions
      </h2>
      <p className="text-center text-gray-600 mb-10">
        Everything you need to know about our products and services.
      </p>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 cursor-pointer"
            onClick={() => toggleFAQ(index)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">
                {faq.question}
              </h3>
              {openIndex === index ? (
                <Minus className="w-5 h-5 text-[#0FA958]" />
              ) : (
                <Plus className="w-5 h-5 text-[#0FA958]" />
              )}
            </div>

            {openIndex === index && (
              <p className="mt-3 text-gray-600">
                {faq.answer}
              </p>
            )}
          </div>
        ))}
      </div>

      
    </section>
  );
};

export default FAQSection;

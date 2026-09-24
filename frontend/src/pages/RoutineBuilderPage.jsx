import React from "react";
import RoutineBuilder from "../components/Products/RoutineBuilder";
import SEO from "../components/SEO/SEO";
import { Sparkles, ShieldCheck, Zap, Heart, Clock, Award, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ROUTINE_FAQS = [
  {
    q: "Why is a synchronized Morning & Evening routine better than taking random supplements?",
    a: "Nutrient bioavailability depends heavily on circadian rhythms. For instance, energizing adaptogens and digestive cleansers are best absorbed in the morning with food, whereas cellular recovery herbs (like Ashwagandha or Magnesium) optimize restorative REM sleep when taken at night.",
  },
  {
    q: "Are the recommended products 100% genuine and safe?",
    a: "Yes! Every single product on Wellness Bazaar is sourced directly from certified brands, manufactured in GMP/Ayush-compliant facilities, and adheres to strict FSSAI quality standards.",
  },
  {
    q: "Can I remove or swap a product in my routine stack?",
    a: "Absolutely! Once your personalized stack is generated, you can uncheck any product or click on its title to explore alternative options before adding to your cart.",
  },
  {
    q: "How long should I follow the routine to see noticeable results?",
    a: "Most wellness practitioners recommend staying consistent with your daily routine stack for at least 30 to 60 days to allow your body's cellular metabolism and tissue repair to fully balance.",
  },
];

const RoutineBuilderPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fbf9] via-white to-[#f0f9f6] py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Personalized Wellness Routine & Stack Matcher | M Wellness Bazaar"
        description="Take our 30-second wellness quiz to discover your synchronized Morning & Evening daily routine stack with certified Ayurvedic and nutritional products."
        keywords="wellness routine, supplement stack, daily routine quiz, personalized wellness, morning evening routine, ayurveda routine"
      />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Breadcrumbs & Intro Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100/70 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>AI-Powered Wellness Matching</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
            Design Your Perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#022824] via-[#047ca8] to-[#0FB7A3]">Daily Wellness Routine</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Eliminate guesswork. Match certified supplements, Ayurvedic formulations, and health products crafted for your specific goals.
          </p>
        </div>

        {/* The Interactive Routine Builder App */}
        <RoutineBuilder />

        {/* 3 Pillars of Personalized Wellness */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-white rounded-2xl p-6 border border-teal-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 mb-3">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Synergistic Bio-Availability</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              We pair compatible ingredients that enhance absorption rather than clashing with each other.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-teal-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Circadian Timing Optimization</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Morning activation for peak cognitive performance; evening replenishment for deep tissue recovery.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-teal-100 shadow-sm flex flex-col items-center text-center">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">100% Verified Quality</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Directly sourced from trusted manufacturers with batch-tested certificates and zero adulteration.
            </p>
          </div>
        </div>

        {/* Routine Builder FAQs */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROUTINE_FAQS.map((faq, idx) => (
              <div key={idx} className="space-y-1.5 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 flex items-start gap-2">
                  <span className="text-teal-600 font-black">Q.</span>
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-gray-600 pl-5 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineBuilderPage;

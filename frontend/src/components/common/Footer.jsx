import { useState, useEffect, useRef } from "react";
import { Send, ChevronDown, Phone, Mail, Check, Facebook, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setEmail("");
      }, 3000);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-[#047ca8] to-[#06b6d4] rounded-lg flex items-center justify-center shadow-lg">
                <Send className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Newsletter</h3>
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed mt-20">
              Be the first to hear about new products, exclusive events, and special offers.
            </p>
            <div className="bg-gradient-to-r from-amber-400/20 to-orange-400/20 border mt-20 border-amber-400/40 p-3 rounded-lg mb-4 backdrop-blur">
              <p className="text-xs font-semibold text-amber-100 mb-0">
                ✨ Sign up to get exclusive 10% off on your first order
              </p>
            </div>
            {/* <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 text-sm border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#047ca8] focus:border-transparent transition-all"
              />
              <button
                onClick={handleSubscribe}
                className="w-full mt-2 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] hover:from-[#036488] hover:to-[#0592b0] text-white px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Subscribe Now
              </button>
            </div> */}
            {isSubscribed && (
              <p className="text-emerald-300 text-xs mt-2 flex items-center animate-pulse">
                <Check className="h-4 w-4 mr-2" /> Successfully subscribed!
              </p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-5 pb-2 border-b border-slate-700">
              Shop
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-slate-300 hover:text-teal-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                  Protein Bite
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-300 hover:text-teal-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                  Respyr Device
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-300 hover:text-teal-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                  Super Food
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-300 hover:text-teal-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                  Metafit Product
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-5 pb-2 border-b border-slate-700">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/contact" className="text-sm text-slate-300 hover:text-teal-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                  Contact us
                </a>
              </li>
              <li>
                <a href="/about" className="text-sm text-slate-300 hover:text-teal-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-300 hover:text-teal-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                  Ayurvedic Products
                </a>
              </li>
              <li>
                <a href="/faq" className="text-sm text-slate-300 hover:text-teal-400 transition-colors duration-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></span>
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-5 pb-2 border-b border-slate-700">
              Get in Touch
            </h3>
            
            <p className="text-xs text-slate-300 font-medium mb-3">Follow us on social media</p>
            <div className="flex items-center space-x-3 mb-6">
              <a
                href="https://www.facebook.com/mwellnessbazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-110 shadow-lg"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/mwellnessbazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-white hover:from-pink-600 hover:to-rose-600 transition-all duration-300 transform hover:scale-110 shadow-lg"
              >
                <Instagram className="h-5 w-5" />
              </a>
              {/* <a
                href="https://www.linkedin.com/company/meta-fit-wellness/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 shadow-lg"
              >
                <Linkedin className="h-5 w-5" />
              </a> */}
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                <Phone className="h-5 w-5 text-[#047ca8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Call us</p>
                  <a href="tel:+919982498555" className="text-sm font-semibold text-white hover:text-[#06b6d4] transition-colors">
                    +91 9982498555
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                <Mail className="h-5 w-5 text-[#047ca8] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Email us</p>
                  <a href="mailto:info@metafitwellness.com" className="text-sm font-semibold text-white hover:text-[#06b6d4] transition-colors break-all">
                    info@metafitwellness.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 bg-gradient-to-r from-[#047ca8]/10 to-[#06b6d4]/10 backdrop-blur-sm p-4 rounded-lg border border-[#047ca8]/20 hover:border-[#047ca8]/40 transition-all">
              <div className="h-12 w-12 bg-gradient-to-br from-[#047ca8] to-[#06b6d4] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Quality Guaranteed</h4>
                <p className="text-xs text-slate-300">Premium wellness products</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-gradient-to-r from-[#047ca8]/10 to-[#06b6d4]/10 backdrop-blur-sm p-4 rounded-lg border border-[#047ca8]/20 hover:border-[#047ca8]/40 transition-all">
              <div className="h-12 w-12 bg-gradient-to-br from-[#047ca8] to-[#06b6d4] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Secure Payments</h4>
                <p className="text-xs text-slate-300">100% secure transactions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-gradient-to-r from-[#047ca8]/10 to-[#06b6d4]/10 backdrop-blur-sm p-4 rounded-lg border border-[#047ca8]/20 hover:border-[#047ca8]/40 transition-all">
              <div className="h-12 w-12 bg-gradient-to-br from-[#047ca8] to-[#06b6d4] rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Free Shipping</h4>
                <p className="text-xs text-slate-300">On orders over ₹999</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-950 to-slate-900 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 text-sm">
            <p className="text-slate-300">
              Copyright © 2025 <span className="font-semibold text-white">MetaFit Wellness</span>. All Rights Reserved
            </p>

            <p className="text-slate-400 italic text-xs font-medium">
              ✨ From Ancient Healing to Modern Wellness
            </p>

            <div className="relative inline-block text-left" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center px-4 py-1.5 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md transition-colors"
              >
                Policies <ChevronDown className={`ml-1.5 h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 rounded-lg bg-white shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <ul className="py-1 text-xs">
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        🔒 Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        💰 Refund Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        📦 Shipping Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        📋 Terms & Conditions
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        💵 Pricing Policy
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
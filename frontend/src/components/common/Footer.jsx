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
    <footer className="bg-gradient-to-b from-cyan-50 to-cyan-100 border-t border-cyan-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 bg-teal-500 rounded-lg flex items-center justify-center">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Newsletter</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Be the first to hear about new products, exclusive events, and online offers.
              </p>
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-100">
                <p className="font-medium text-sm text-teal-700 mb-3">
                  🎁 Sign up to get 10% off your first order
                </p>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 pr-32 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={handleSubscribe}
                    className="absolute right-1 top-1 bottom-1 bg-teal-500 text-white px-6 text-sm rounded-md hover:bg-teal-600 transition-all duration-300 transform hover:scale-105"
                  >
                    Subscribe
                  </button>
                </div>
                {isSubscribed && (
                  <p className="text-teal-600 text-sm mt-2 flex items-center">
                    <Check className="h-4 w-4 mr-1" /> Successfully subscribed!
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-teal-500 inline-block">
              Shop
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <a href="#" className="hover:text-teal-600 transition-all duration-300 hover:translate-x-1 inline-block">
                  Protein Bite
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-600 transition-all duration-300 hover:translate-x-1 inline-block">
                  Respyr Device
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-600 transition-all duration-300 hover:translate-x-1 inline-block">
                  Super Food
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-600 transition-all duration-300 hover:translate-x-1 inline-block">
                  Metafit Product
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-teal-500 inline-block">
              Support
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li>
                <a href="#" className="hover:text-teal-600 transition-all duration-300 hover:translate-x-1 inline-block">
                  Contact us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-600 transition-all duration-300 hover:translate-x-1 inline-block">
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-600 transition-all duration-300 hover:translate-x-1 inline-block">
                  Ayurvedic Products
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-teal-600 transition-all duration-300 hover:translate-x-1 inline-block">
                  Our Specific Products
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-teal-500 inline-block">
              Get in Touch
            </h3>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Follow us on social media</p>
              <div className="flex items-center space-x-3">
                <a
                  href="https://www.facebook.com/profile.php?id=61565468193885"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all duration-300 transform hover:scale-110"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://www.instagram.com/metafitwellness/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-500 hover:via-pink-500 hover:to-orange-500 hover:text-white transition-all duration-300 transform hover:scale-110"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/meta-fit-wellness/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="space-y-3 text-gray-700">
              <div className="flex items-start space-x-3 group">
                <div className="h-8 w-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Phone className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Call us</p>
                  <a href="tel:+919982498555" className="font-medium hover:text-teal-600 transition-colors">
                    +91 9982498555
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 group">
                <div className="h-8 w-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                  <Mail className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email us</p>
                  <a href="mailto:info@metafitwellness.com" className="font-medium hover:text-teal-600 transition-colors break-all">
                    info@metafitwellness.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Quality Guaranteed</h4>
              <p className="text-sm text-gray-600">Premium wellness products</p>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Secure Payments</h4>
              <p className="text-sm text-gray-600">100% secure transactions</p>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Free Shipping</h4>
              <p className="text-sm text-gray-600">On orders over ₹999</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm">
              Copyright © 2025 <span className="text-teal-400 font-medium">Metafitwellness</span>. All Rights Reserved
            </p>

            <p className="text-sm text-gray-400 italic">
              From Ancient Healing to AI Living
            </p>

            <div className="relative inline-block text-left" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-300"
              >
                Policies <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-56 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-3 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        🔒 Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-3 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        💰 Refund Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-3 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        📦 Shipping Policy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-3 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                      >
                        📋 Terms & Conditions
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-3 hover:bg-teal-50 hover:text-teal-600 transition-colors"
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
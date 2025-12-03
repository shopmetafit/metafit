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
    <footer className="bg-gradient-to-b from-teal-600 to-teal-700">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                <Send className="h-4 w-4 text-teal-600" />
              </div>
              <h3 className="text-base font-semibold text-white">Newsletter</h3>
            </div>
            <p className="text-sm text-teal-50 mb-4">
              Be the first to hear about new products, exclusive events, and online offers.
            </p>
            <div className="bg-orange-100 border border-orange-300 p-3 rounded-lg mb-3">
              <p className="text-xs font-medium text-orange-800 mb-0">
                🎁 Sign up to get 10% off your first order
              </p>
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-sm border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                onClick={handleSubscribe}
                className="w-full mt-2 bg-white text-teal-600 px-4 py-2 text-sm font-medium rounded-md hover:bg-teal-50 transition-colors"
              >
                Subscribe
              </button>
            </div>
            {isSubscribed && (
              <p className="text-white text-xs mt-2 flex items-center">
                <Check className="h-3 w-3 mr-1" /> Successfully subscribed!
              </p>
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-4 pb-1">
              Shop
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-teal-50 hover:text-white transition-colors">
                  Protein Bite
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-teal-50 hover:text-white transition-colors">
                  Respyr Device
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-teal-50 hover:text-white transition-colors">
                  Super Food
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-teal-50 hover:text-white transition-colors">
                  Metafit Product
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-4 pb-1">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-teal-50 hover:text-white transition-colors">
                  Contact us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-teal-50 hover:text-white transition-colors">
                  About us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-teal-50 hover:text-white transition-colors">
                  Ayurvedic Products
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-teal-50 hover:text-white transition-colors">
                  Our Specific Products
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-4 pb-1">
              Get in Touch
            </h3>
            
            <p className="text-xs text-teal-50 mb-2">Follow us on social media</p>
            <div className="flex items-center space-x-2 mb-4">
              <a
                href="https://www.facebook.com/profile.php?id=61565468193885"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 bg-white rounded-md flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/metafitwellness/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 bg-white rounded-md flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/meta-fit-wellness/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 bg-white rounded-md flex items-center justify-center hover:bg-blue-700 hover:text-white transition-all"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Phone className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-teal-50">Call us</p>
                  <a href="tel:+919982498555" className="text-sm font-medium text-white hover:text-teal-100 transition-colors">
                    +91 9982498555
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-teal-50">Email us</p>
                  <a href="mailto:info@metafitwellness.com" className="text-sm font-medium text-white hover:text-teal-100 transition-colors break-all">
                    info@metafitwellness.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3 bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
              <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Quality Guaranteed</h4>
                <p className="text-xs text-teal-50">Premium wellness products</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
              <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Secure Payments</h4>
                <p className="text-xs text-teal-50">100% secure transactions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-lg">
              <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Free Shipping</h4>
                <p className="text-xs text-teal-50">On orders over ₹999</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black bg-opacity-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 text-sm">
            <p className="text-white">
              Copyright © 2025 <span className="font-medium">Metafitwellness</span>. All Rights Reserved
            </p>

            <p className="text-teal-100 italic text-xs">
              From Ancient Healing to AI Living
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
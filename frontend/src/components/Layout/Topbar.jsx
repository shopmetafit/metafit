import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, Linkedin, Phone, Menu, X } from 'lucide-react';
import wellnessLogo from '../../assets/Wellness.png';

const Topbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`w-full z-50 transition-all duration-300 ${
      scrolled ? 'shadow-xl' : 'shadow-md'
    }`}>
      {/* Main Top Bar - Compact */}
      <div className="bg-gradient-to-r from-cyan-300 via-sky-200 to-cyan-300">
        <div className="container mx-auto flex justify-between items-center py-4 px-4 md:px-6">
          
          {/* Left: Metafit Wellness Logo + Social Icons */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Metafit Wellness Logo */}
            <a
              href="https://metafitwellness.com/"
              className="group flex items-center gap-2 transform transition-all duration-300 hover:scale-105"
            >
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 rounded-full">
                  <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-teal-800 leading-tight">Metafit</div>
                <div className="text-xs text-teal-600 font-medium"></div>
              </div>
            </a>

            {/* Social Icons - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <a
                href="https://www.facebook.com/profile.php?id=61565468193885"
                className="group p-2 rounded-full bg-white hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 text-blue-600" fill="currentColor" />
              </a>
              
              <a
                href="https://www.instagram.com/metafitwellness/?igsh=NDl0ZzlzYzdrY2tk"
                className="group p-2 rounded-full bg-white hover:bg-pink-50 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 text-pink-600" />
              </a>
              
              <a
                href="https://www.linkedin.com/company/meta-fit-wellness/"
                className="group p-2 rounded-full bg-white hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4 text-blue-700" fill="currentColor" />
              </a>
            </div>
          </div>

          {/* Center: Your Original Wellness Logo */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <a href="/" className="group block">
              <div className="relative">
                {/* Replace this with your actual wellness.jfif image */}
                <img 
                  src={wellnessLogo} 
                  alt="Wellness Bazaar" 
                  className="h-24 w-auto object-contain transition-all duration-300 transform group-hover:scale-105 drop-shadow-lg group-hover:drop-shadow-xl"
                />
                {/* In your actual code, use:
                <img 
                  src={wellness} 
                  alt="Wellness Bazaar" 
                  className="h-14 w-auto object-contain transition-all duration-300 transform group-hover:scale-105"
                />
                */}
              </div>
            </a>
          </div>

          {/* Right: Phone Button Only */}
          <div className="flex items-center gap-2">
            {/* Phone Button - Desktop */}
            <a
              href="tel:+919982498555"
              className="hidden md:flex items-center gap-2 text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 px-5 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700"></div>
              <Phone className="h-4 w-4 relative z-10" />
              <span className="font-semibold text-sm relative z-10">+91 998 249 8555</span>
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full bg-white hover:bg-teal-50 shadow-md transition-all transform hover:scale-110"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-teal-700" />
              ) : (
                <Menu className="h-6 w-6 text-teal-700" />
              )}
            </button>
          </div>
        </div>
      </div>



      {/* Mobile Menu - Compact */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t-2 border-teal-400 shadow-xl animate-slideDown">
          <div className="container mx-auto py-6 px-4">
            {/* Center Logo - Mobile */}
            <div className="mb-4 text-center">
              <a href="/" className="inline-block">
                <img 
                  src={wellnessLogo} 
                  alt="Wellness Bazaar" 
                  className="h-20 w-auto object-contain mx-auto"
                />
                {/* Use in your code: <img src={wellness} alt="Wellness Bazaar" className="h-12 w-auto object-contain mx-auto" /> */}
              </a>
            </div>

            {/* Social Links - Mobile */}
            <div className="flex justify-center gap-3 mb-4">
              <a
                href="https://www.facebook.com/profile.php?id=61565468193885"
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors shadow-md"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5 text-blue-600" fill="currentColor" />
              </a>
              <a
                href="https://www.instagram.com/metafitwellness/?igsh=NDl0ZzlzYzdrY2tk"
                className="p-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors shadow-md"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-pink-600" />
              </a>
              <a
                href="https://www.linkedin.com/company/meta-fit-wellness/"
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors shadow-md"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-blue-700" fill="currentColor" />
              </a>
            </div>

            {/* Contact Button - Mobile */}
            <a
              href="tel:+919982498555"
              className="flex items-center justify-center gap-2 text-white bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-3 rounded-full shadow-lg w-full font-semibold"
            >
              <Phone className="h-5 w-5" />
              <span>+91 998 249 8555</span>
            </a>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default Topbar;
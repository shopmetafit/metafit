import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const WhatsAppChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = '918302270668'; // WhatsApp phone number with country code
  const message = 'Hello! I would like to know more about your wellness products and services.';

  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* Chat Popup */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideUp border border-teal-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">Metafit Wellness</div>
              <div className="text-xs text-green-100 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
                Usually replies instantly
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="hover:bg-green-700 p-1 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 bg-gray-50 min-h-64 flex flex-col">
            {/* Welcome Message */}
            <div className="mb-4">
              <div className="bg-green-100 text-green-800 p-3 rounded-lg text-sm max-w-xs">
                <p className="font-semibold mb-2">Hi there!</p>
                <p>We're here to help. Chat with us on WhatsApp to get quick answers about our wellness products and services.</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2 flex-1">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-gray-700">Fast & Instant Replies</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-gray-700">Product Information</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-sm text-gray-700">Support & Guidance</span>
              </div>
            </div>
          </div>

          {/* Footer Button */}
          <div className="bg-white border-t border-gray-200 p-3">
            <button
              onClick={handleWhatsAppClick}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Send className="h-4 w-4" />
              Chat on WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={`group relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center overflow-hidden ${
          isOpen
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gradient-to-br from-green-500 via-green-600 to-teal-600 hover:shadow-3xl'
        }`}
        aria-label="WhatsApp Chat"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700"></div>

        {/* Pulsing Glow */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-pulse"></div>
        )}

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {isOpen ? (
            <X className="h-7 w-7 text-white" />
          ) : (
            <>
              <MessageCircle className="h-7 w-7 text-white" />
              {/* Badge */}
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
                1
              </span>
            </>
          )}
        </div>

        {/* Hover Text */}
        {!isOpen && (
          <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Chat with us
          </div>
        )}
      </button>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WhatsAppChat;

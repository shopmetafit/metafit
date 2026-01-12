import { Link } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import herosectionImage from "../../assets/herosection.png";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={herosectionImage}
          alt="Metafit Wellness"
          className="w-full h-[400px] md:h-[500px] lg:h-[600px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
        <div className="text-center text-white px-4 md:px-6 py-8 max-w-4xl animate-fadeIn">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Transform Your Wellness Journey
          </h1>

          {/* Engaging Tagline */}
          <p className="text-lg md:text-xl mb-8 text-gray-100 max-w-2xl mx-auto font-light">
            Discover premium wellness products that blend ancient healing wisdom with modern innovation. Your path to vibrant health starts here.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-10">
            <Link
              to="/collections/all"
              className="group relative px-10 md:px-14 py-4 md:py-5 text-lg md:text-xl font-bold text-white rounded-full overflow-hidden transition-all duration-300 transform hover:scale-110"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0fa958] via-[#06b6d4] via-[#0fa958] to-[#06b6d4] bg-[length:200%_100%] group-hover:animate-pulse animate-gradient"></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white rounded-full blur-xl transition-opacity duration-300"></div>
              
              {/* Content */}
              <div className="relative flex items-center justify-center gap-2">
                <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
                <span>Explore Wellness Collection</span>
                <ChevronRight size={22} className="group-hover:translate-x-2 transition-transform" />
              </div>
              
              {/* Shadow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0fa958] to-[#06b6d4] -z-10 blur-lg opacity-60 group-hover:opacity-100 transition-opacity"></div>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-gray-200 mt-10">
            <div className="flex items-center gap-2">
              <span className="text-teal-400 font-bold">✓</span>
              <span>Premium Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-teal-400 font-bold">✓</span>
              <span>Fast Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-teal-400 font-bold">✓</span>
              <span>100% Authentic</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient-shift {
          0% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
          100% {
            background-position: 0% center;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-gradient {
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;

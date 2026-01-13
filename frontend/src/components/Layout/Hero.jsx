import { Link } from "react-router-dom";
import { ChevronRight, Sparkles, Award, Truck, Gift, Check } from "lucide-react";
import herosectionImage from "../../assets/hero2.png";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 z-0">
        {/* Gradient 1 */}
        <div className="absolute inset-0 animate-gradient-move opacity-60">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/40 via-teal-500/30 to-cyan-600/40"></div>
        </div>
        
        {/* Gradient 2 */}
        <div className="absolute inset-0 animate-gradient-move-reverse opacity-50">
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/30 via-blue-500/20 to-indigo-600/30"></div>
        </div>
      </div>

      {/* Background Image with Enhanced Overlay */}
      <div className="absolute inset-0 z-10">
        <img
          src={herosectionImage}
          alt="Metafit Wellness"
          className="w-full h-[400px] md:h-[500px] lg:h-[600px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-transparent to-teal-900/20"></div>
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
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm mt-12">
            <div className="group px-4 md:px-6 py-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105 cursor-default">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-green-400 group-hover:animate-pulse" />
                <span className="font-semibold text-green-100">Premium Quality</span>
              </div>
            </div>

            <div className="group px-4 md:px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/50 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/50 transition-all duration-300 transform hover:scale-105 cursor-default">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-teal-400 group-hover:animate-pulse" />
                <span className="font-semibold text-teal-100">Fast Shipping</span>
              </div>
            </div>


            <div className="group px-4 md:px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/50 transition-all duration-300 transform hover:scale-105 cursor-default">
              <div className="flex items-center gap-2">
                <Check size={18} className="text-amber-400 group-hover:animate-pulse" />
                <span className="font-semibold text-amber-100">100% Authentic</span>
              </div>
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
        @keyframes gradient-move {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(30px, -30px) scale(1.1);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        @keyframes gradient-move-reverse {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, 40px) scale(1.1);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-gradient {
          animation: gradient-shift 3s ease infinite;
        }
        .animate-gradient-move {
          animation: gradient-move 8s ease-in-out infinite;
        }
        .animate-gradient-move-reverse {
          animation: gradient-move-reverse 10s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;

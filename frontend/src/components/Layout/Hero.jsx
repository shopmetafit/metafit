import { Link } from "react-router-dom";
import heroImg from "../../assets/products.webp";
const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <img
        src={heroImg}
        alt="Metafit"
        className="w-full h-[400px] md:h-[600px] lg:h-[750px] object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/30 to-black/40 flex items-center justify-center">
        <div className="text-center text-white p-6 animate-fadeIn">
          <div className="mb-4 inline-block">
            <span className="text-sm md:text-base font-semibold tracking-widest text-teal-300 uppercase">
              Premium Wellness Products
            </span>
          </div>
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-tighter uppercase mb-6 leading-tight">
            WELLNESS
            <br /> 
            <span className="bg-gradient-to-r from-[#047ca8] via-[#0892aa] to-[#06b6d4] bg-clip-text text-transparent">BAZAR</span>
          </h1>
          <p className="text-base md:text-xl mb-8 text-gray-200 max-w-2xl mx-auto font-light">
            Explore our curated collection of wellness products with fast worldwide shipping
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/collections/all"
              className="bg-gradient-to-r from-[#047ca8] to-[#06b6d4] hover:from-[#036488] hover:to-[#0592b0] text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Shop Now
            </Link>
            <Link
              to="/collections/all"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300"
            >
              Browse Collection
            </Link>
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
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </section>
  );
};

export default Hero;

import Hero from "../components/Layout/Hero";
import FeaturesSection from "../components/Products/FeaturesSection";
import GenderCollectionSection from "../components/Products/GenderCollectionSection";
import NewArrivals from "../components/Products/NewArrivals";
import ProductDetails from "../components/Products/ProductDetails";
import ProductGrid from "../components/Products/ProductGrid";
import CategoryGrid from "../components/Products/categoryGrid";
import FeaturedCollection from "../components/Products/featuredCollection";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productSlice";
import axios from "axios";
import { useState, useEffect } from "react";

const Home = () => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [bestSellerProduct, setBestSellerProduct] = useState(null);

  useEffect(() => {
    //fetch product from specific collection
    dispatch(
      fetchProductsByFilters({
        search: "a",
        limit: 8,
      })
    );
    // fetch best seller product
    const fetchBestSeller = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/best-seller`
        );
        setBestSellerProduct(response.data);
      } catch (error) {
        
      }
    };
    fetchBestSeller();
  }, [dispatch]);

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-white">
      <Hero />
      
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
          {/* Category Section */}
          <section className="py-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <CategoryGrid />
          </section>

          {/* Gender Collection */}
          <section className="py-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            <GenderCollectionSection />
          </section>

          {/* New Arrivals */}
          <section className="py-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-900 mb-3 animate-in fade-in slide-in-from-left duration-700">
                New Arrivals
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] mx-auto animate-in fade-in scale-in duration-700 delay-300"></div>
            </div>
            <NewArrivals />
          </section>

          {/* Best Seller Section */}
          <section className="py-12 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 md:px-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 hover:shadow-lg transition-shadow">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-900 mb-3 animate-in fade-in slide-in-from-right duration-700">
                ⭐ Best Seller
              </h2>
              <p className="text-center text-gray-600 text-lg animate-in fade-in duration-700 delay-100">Our most loved wellness product</p>
              <div className="w-20 h-1 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] mx-auto mt-4 animate-in fade-in scale-in duration-700 delay-300"></div>
            </div>
            {bestSellerProduct ? (
              <ProductDetails productId={bestSellerProduct._id} />
            ) : (
              <p className="text-center text-gray-500"> Loading best seller product...</p>
            )}
          </section>

          {/* Featured Products */}
          <section className="py-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-900 mb-3 animate-in fade-in slide-in-from-left duration-700">
                Popular Choices
              </h2>
              <p className="text-center text-gray-600 text-lg animate-in fade-in duration-700 delay-100">Handpicked products loved by our community</p>
              <div className="w-20 h-1 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] mx-auto mt-4 animate-in fade-in scale-in duration-700 delay-300"></div>
            </div>
            <ProductGrid products={products} loading={loading} error={error} />
          </section>

          {/* Featured Collections */}
          <section className="py-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
            <FeaturedCollection />
          </section>

          {/* Features Section */}
          <section className="py-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-600">
            <FeaturesSection />
          </section>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scaleX(0);
          }
          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        .animate-in {
          animation: fadeIn forwards;
        }

        .fade-in {
          animation-name: fadeIn;
        }

        .slide-in-from-bottom-6 {
          animation-name: slideInFromBottom;
        }

        .slide-in-from-left {
          animation-name: slideInFromLeft;
        }

        .slide-in-from-right {
          animation-name: slideInFromRight;
        }

        .scale-in {
          animation-name: scaleIn;
        }

        .duration-700 {
          animation-duration: 700ms;
        }

        .delay-100 {
          animation-delay: 100ms;
        }

        .delay-200 {
          animation-delay: 200ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-400 {
          animation-delay: 400ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-600 {
          animation-delay: 600ms;
        }
      `}</style>
    </div>
  );
};

export default Home;

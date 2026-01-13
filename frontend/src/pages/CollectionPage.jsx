import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaFilter } from "react-icons/fa";
import { Truck, Shield, RotateCcw, Search, Grid, List, X } from "lucide-react";

import FilterSidebar from "../components/Products/FilterSidebar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";
import heroImg from "../assets/products.webp";

import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters, setFilters } from "../redux/slices/productSlice";
import FAQSection from "./FAQ";

const CollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState(""); // Initialize with empty string
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const navigate = useNavigate();
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const queryParams = Object.fromEntries([...searchParams]);

  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProductsByFilters({ collection, ...queryParams }));
  }, [dispatch, collection, searchParams]);

  useEffect(() => {
    // Update searchTerm state when the 'search' query parameter changes in the URL
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    navigate(`/collections/all/?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pr-20">
      {/* Mobile filter button */}
      {!isSidebarOpen && (
        <div className="lg:hidden fixed bottom-4 right-50 z-50">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-[#0FA958] text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105"
          >
            <FaFilter size={20} />
          </button>
        </div>
      )}

      {/* Sidebar for mobile */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          {/* Sidebar */}
          <div className="relative bg-white w-80 max-w-[calc(100%-4rem)] h-full shadow-xl">
            <div className="h-full flex flex-col">
              <div className="p-6 flex justify-between items-center border-b">
                <h2 className="text-xl font-semibold">Filters</h2>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              <FilterSidebar />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
            Our Collection
          </h1>
          <p className="text-lg text-center text-gray-600">
            Find the best wellness products for a healthier you.
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar for desktop */}
          <aside className="hidden lg:block lg:w-80 lg:min-w-[320px] lg:sticky lg:top-6 lg:self-start">
            <FilterSidebar />
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex-1 w-full sm:w-auto mb-4 sm:mb-0">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0FA958]"
                  />
                  {/* Optionally add a search button */}
                  {/* <button type="submit" className="absolute right-0 top-0 h-full px-4 bg-[#0FA958] text-white rounded-r-lg">Search</button> */}
                </form>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-gray-600 whitespace-nowrap">
                  Showing {products?.length || 0} products
                </p>
                <SortOptions />
              </div>
            </div>
            
            <ProductGrid products={products} loading={loading} error={error} viewMode={viewMode} />
          
          <FAQSection/>

          {/* SEO Content Section */}
          <section className="mt-16 mb-12 p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome to M Wellness Bazar - Your Premium Wellness Destination</h2>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                At M Wellness Bazar, we believe that true wellness is a journey, not a destination. Our carefully curated collection of premium wellness products is designed to support your path to vibrant health, blending ancient healing wisdom with modern scientific innovation. Whether you're looking to boost your immunity, enhance your energy levels, or create a comprehensive wellness routine, our collection offers something for everyone.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Why Choose M Wellness Bazar Products?</h3>
              <p>
                We understand that the wellness market is flooded with countless options, making it challenging to find products you can truly trust. That's why M Wellness Bazar has dedicated itself to sourcing only the highest quality, authentic wellness products from trusted suppliers worldwide. Every product in our collection undergoes rigorous quality checks to ensure it meets our strict standards for purity, potency, and effectiveness. We believe in transparency, which is why we provide detailed information about each product's sourcing, ingredients, and benefits.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Our Comprehensive Product Range</h3>
              <p>
                Our collection spans multiple wellness categories to address various health needs. From energy-boosting supplements and nutritional powerhouses to skincare products infused with natural ingredients, stress-relief solutions, and fitness accessories - we've got you covered. Whether you're interested in Ayurvedic remedies passed down through generations, modern superfoods, or scientifically-formulated nutritional supplements, our diverse range ensures you'll find exactly what your body needs. Each category is thoughtfully organized to make your shopping experience smooth and enjoyable.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Quality Assurance & Authenticity Guarantee</h3>
              <p>
                We stand behind every product we sell. All our wellness products are 100% authentic and sourced directly from manufacturers or authorized distributors. We never compromise on quality, and we never sell counterfeit or substandard items. Our commitment to authenticity means you can purchase with complete confidence, knowing that you're investing in your health with genuine, high-quality products. Additionally, we maintain strict hygiene standards in our warehousing and packaging to ensure your products arrive in perfect condition.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Fast & Free Shipping on Your Wellness Purchases</h3>
              <p>
                We understand that when you're ready to start your wellness journey, you don't want to wait. That's why we offer fast shipping on all orders, with free shipping options available for qualifying purchases. Our efficient logistics network ensures your products reach you quickly, safely, and in pristine condition. We partner with reliable shipping providers to guarantee timely delivery across the country. With our user-friendly tracking system, you'll always know exactly where your order is.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Personalized Wellness Shopping Experience</h3>
              <p>
                Shopping for wellness products has never been easier. Our advanced filtering system allows you to refine products by category, price range, brand, and more. Whether you're a wellness expert or just beginning your health journey, our intuitive platform makes discovering the perfect products simple. Browse customer reviews and ratings to learn from others' experiences, and don't hesitate to reach out to our knowledgeable customer support team if you need personalized recommendations. We're here to help you make informed decisions for your health.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Join the M Wellness Bazar Community</h3>
              <p>
                Becoming an M Wellness Bazar customer means joining a community of health-conscious individuals committed to improving their well-being. Stay updated with our latest wellness tips, product launches, and exclusive offers. Our blog and social media channels are packed with valuable content about nutrition, fitness, mental wellness, and holistic health practices. We believe in empowering our customers with knowledge so you can make the best choices for your wellness journey. Start exploring our collection today and discover why thousands of wellness enthusiasts trust M Wellness Bazar for their premium wellness needs.
              </p>
            </div>
          </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CollectionPage;
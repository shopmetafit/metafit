import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaFilter } from "react-icons/fa";
import { Truck, Shield, RotateCcw, Search, Grid, List, Star, ShoppingCart, Heart } from "lucide-react";

import FilterSidebar from "../components/Products/FilterSidebar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";
import heroImg from "../assets/products.webp";

import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters, setFilters } from "../redux/slices/productSlice";

const categories = [
    { name: "All Products", link: "/collections/all", icon: "🌱" },
    { name: "New Launches", link: "/collections/all", icon: "⭐", badge: "NEW" },
    { name: "Healthy Bars", link: "/collections/all", icon: "🍫" },
    { name: "Digital Wellness Gadgets", link: "/collections/all", icon: "⚡" },
    { name: "Daily Shuddhi Kit", link: "/collections/all", icon: "🌿" },
    { name: "Yoga Equipment", link: "/collections/all", icon: "🧘", badge: "COMING SOON" },
    { name: "Ayurveda Products", link: "/collections/all", icon: "🌿", badge: "COMING SOON" },
    { name: "Diet Plans", link: "/collections/all", icon: "💪" },
  ];

const CollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const queryParams = Object.fromEntries([...searchParams]);

  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  // Fetch products on mount or when filters change
  useEffect(() => {
    dispatch(fetchProductsByFilters({ collection, ...queryParams }));
  }, [dispatch, collection, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchProductsByFilters({ search: searchTerm }));
    navigate(`/collections/all/?search=${searchTerm}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Updated to match second UI */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">M Wellness Bazaar</h1>
          <p className="text-xl text-teal-100 mb-8">
            Premium quality wellness products for your healthy lifestyle journey
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span>Free shipping over ₹999</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Quality guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              <span>7-day returns</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters Bar - New UI */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-4">
              {/* <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <FaFilter className="w-4 h-4" />
                Filters
              </button> */}
              
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'text-gray-600'} rounded-l-lg transition-colors`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-gray-600'} rounded-r-lg transition-colors`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Category Pills */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.link}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-600"
              >
                {category.icon && <span>{category.icon}</span>}
                <span>{category.name}</span>
                {category.badge && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    category.badge === 'NEW' ? 'bg-teal-500 text-white' : 'bg-gray-400 text-white'
                  }`}>
                    {category.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          {/* <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <FilterSidebar />
              
              <h3 className="font-semibold text-gray-800 mb-4 mt-6">Features</h3>
              <div className="space-y-2">
                {['Organic', 'Eco-Friendly', 'Vegan', 'Lab Tested', 'Chemical Free'].map((feature) => (
                  <label key={feature} className="flex items-center gap-2">
                    <input type="checkbox" className="accent-teal-600" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div> */}

          {/* Products Grid/List */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {products?.length || 0} products
              </p>
              {/* <div className="hidden lg:block">
                <SortOptions />
              </div> */}
            </div>
            
            {/* Products Display - Using your original ProductGrid component */}
            <ProductGrid products={products} loading={loading} error={error} />
          </div>
        </div>

        {/* Trust Badges Section - New */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Why Choose Our Wellness Products?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Quality Assured</h3>
              <p className="text-sm text-gray-600">All products are lab-tested and certified for purity</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Fast Delivery</h3>
              <p className="text-sm text-gray-600">Free shipping on orders above ₹999 across India</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Easy Returns</h3>
              <p className="text-sm text-gray-600">7-day hassle-free return policy</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Expert Curated</h3>
              <p className="text-sm text-gray-600">Products selected by wellness experts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;
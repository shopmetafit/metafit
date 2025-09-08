import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaFilter } from "react-icons/fa";
import { Truck, Shield, RotateCcw } from "lucide-react";

import FilterSidebar from "../components/Products/FilterSidebar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";
import heroImg from "../assets/products.webp";

import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters, setFilters } from "../redux/slices/productSlice";

const categories = [
  { name: "All Products", link: "/collections/all" },
  { name: "New Products Launch", link: "/collections/all" },
  { name: "Yoga Equipment", link: "/collections/all" },
  { name: "Ayurvedic Products", link: "/collections/all" },
  { name: "Fitness Accessories", link: "/collections/all" },
  { name: "Aromatherapy", link: "/collections/all" },
  { name: "Wellness Books", link: "/collections/all" },
];

const CollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with Hero Image */}
      <div className="relative w-full">
        <img
          src={heroImg}
          alt="Metafit"
          className="w-full h-auto md:h-[400px] lg:h-[500px] object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center">
          <div className="max-w-7xl mx-auto px-4 py-16 text-white">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-center lg:text-left">
              M Wellness Bazaar
            </h1>
            <p className="hidden sm:block text-base sm:text-xl text-gray-200 mb-6">
              Premium quality wellness products for your healthy lifestyle journey
            </p>

            {/* Features */}
            <div className="hidden sm:flex flex-wrap gap-8 text-sm justify-center lg:justify-start mb-10">
              <div className="flex items-center gap-2">
                <Truck className="w-6 h-6" />
                <span>Free shipping over ₹999</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                <span>Quality guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-6 h-6" />
                <span>7-day returns</span>
              </div>
            </div>

            {/* Category Navbar */}
            <div className="absolute bottom-0 left-0 w-full flex justify-center pb-4 sm:pb-6">
              <nav className="overflow-x-auto flex items-center gap-3 py-2 px-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    to={cat.link}
                    className={`flex-shrink-0 snap-start px-3 py-1.5 sm:px-5 sm:py-2.5 
                      rounded-full font-medium text-sm sm:text-base transition
                      ${
                        cat.name === "New Products Launch"
                          ? "bg-yellow-400 text-black shadow-lg"
                          : "text-gray-800 hover:bg-teal-600 hover:text-white"
                      }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-4xl mx-auto px-6 py-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full p-4 border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
        />
      </form>

      {/* Mobile Filter Button */}
      <div className="lg:hidden px-6 mb-4">
        <button
          onClick={() => setIsSideBarOpen(!isSideBarOpen)}
          className="w-full flex items-center justify-center gap-2 bg-black text-white p-3 rounded-full shadow"
        >
          <FaFilter /> <span>Filters</span>
        </button>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-6 pb-12 flex flex-col lg:flex-row gap-6 min-h-[600px] lg:min-h-screen">
        {/* Sidebar */}
        <aside
          className={`bg-white lg:sticky lg:top-24 lg:self-start
            lg:w-64 p-6 rounded-lg shadow-md flex flex-col flex-shrink-0
            transition-all duration-300 ease-in-out
            ${isSideBarOpen
              ? "max-h-screen"
              : "max-h-0 overflow-hidden lg:max-h-full lg:overflow-visible"
            }`}
        >
          <FilterSidebar />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-h-[600px] lg:min-h-screen lg:min-w-0">
          <SortOptions />
          <ProductGrid products={products} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;

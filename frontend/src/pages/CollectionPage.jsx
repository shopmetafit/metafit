import { useEffect, useState } from "react";
import { FaFilter } from "react-icons/fa";
import FilterSidebar from "../components/Products/FilterSidebar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";
import heroImg from "../assets/products.webp";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductsByFilters,
  setFilters,
} from "../redux/slices/productSlice";
import { Truck, Shield, RotateCcw } from "lucide-react";

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
  const navigate = useNavigate();
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const queryParams = Object.fromEntries([...searchParams]);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchProductsByFilters({ search: searchTerm }));
    navigate(`/collections/all/?search=${searchTerm}`);
  };

  useEffect(() => {
    dispatch(fetchProductsByFilters({ collection, ...queryParams }));
  }, [dispatch, collection, searchParams]);

  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with Hero Image */}
      <div className="relative w-full">
        <img
          src={heroImg}
          alt="Metafit"
         className="w-full h-auto md:h-[400px] lg:h-[500px] object-cover"

        />
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-black/40 flex items-center">
          <div className="max-w-7xl mx-auto px-6 py-16 text-white">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-center lg:text-left">
              M Wellness Bazaar
            </h1>
            <p className="text-lg sm:text-2xl text-gray-200 mb-10 text-center lg:text-left">
              Premium quality wellness products for your healthy lifestyle
              journey
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-8 text-sm justify-center lg:justify-start mb-10">
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
            <div className="absolute bottom-0 left-0 w-full flex justify-center pb-6">
              <nav className="overflow-x-auto flex items-center gap-4 py-3 px-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    to={cat.link}
                    className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold transition
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

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-6 pb-12 gap-6">
        {/* Sidebar */}
        <div
          className={`bg-white lg:w-64 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] 
  p-6 rounded-lg shadow-md flex flex-col transition-all duration-300 ease-in-out
  ${isSideBarOpen ? "max-h-screen" : "max-h-0 overflow-hidden lg:max-h-full"}`}
        >
          Scrollable filters
          <div className="flex-1 overflow-y-auto">
            <FilterSidebar />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <SortOptions />
          <ProductGrid products={products} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;

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
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchProductsByFilters({ search: searchTerm }));
    navigate(`/collections/all/?search=${searchTerm}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pr-20">
      {/* Mobile filter button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-20">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-[#0FA958] text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105"
        >
          <FaFilter size={20} />
        </button>
      </div>

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

        <div className="flex items-start gap-8">
          {/* Sidebar for desktop */}
          <aside className="hidden lg:block lg:w-80 lg:min-w-[320px]">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default CollectionPage;
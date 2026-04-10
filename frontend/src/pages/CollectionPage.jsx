import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaFilter } from "react-icons/fa";
import { Search, SlidersHorizontal, X, ChevronRight, LayoutGrid, List } from "lucide-react";

import FilterSidebar from "../components/Products/FilterSidebar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";

import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productSlice";
import FAQSection from "./FAQ";

const CollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const { collection } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParams = Object.fromEntries([...searchParams]);

  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProductsByFilters({ collection, ...queryParams }));
  }, [dispatch, collection, searchParams]);

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }
    navigate(`/collections/all?${params.toString()}`);
  };

  // Active filter chips derived from URL params
  const activeFilters = [];
  if (queryParams.category) activeFilters.push({ key: "category", label: queryParams.category });
  if (queryParams.brand) activeFilters.push({ key: "brand", label: `Brand: ${queryParams.brand}` });
  if (queryParams.search) activeFilters.push({ key: "search", label: `"${queryParams.search}"` });
  if (queryParams.minPrice || queryParams.maxPrice) {
    activeFilters.push({
      key: "price",
      label: `₹${queryParams.minPrice || 0} – ₹${queryParams.maxPrice || "∞"}`,
    });
  }

  const removeFilter = (key) => {
    const params = new URLSearchParams(searchParams);
    if (key === "price") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  // Derive a page title from the active category or collection
  const pageTitle = queryParams.category
    ? queryParams.category.replace(/\b\w/g, (c) => c.toUpperCase())
    : "All Wellness Products";

  return (
    <div className="min-h-screen bg-[#f0f2f2]">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#047ca8] hover:underline">Home</Link>
          <ChevronRight className="h-3 w-3 flex-shrink-0" />
          <Link to="/collections/all" className="hover:text-[#047ca8] hover:underline">Shop</Link>
          {queryParams.category && (
            <>
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
              <span className="text-gray-800 font-medium capitalize">{queryParams.category}</span>
            </>
          )}
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-4 flex gap-4 items-start">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-[105px] self-start">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#232f3e] text-white px-4 py-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Refine Results
              </h2>
            </div>
            <FilterSidebar />
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* ── Top Bar ── */}
          <div className="bg-white rounded-lg shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Page title + count */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base md:text-lg font-bold text-gray-900 truncate capitalize">
                {pageTitle}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {loading ? "Loading..." : `${products?.length || 0} results`}
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex rounded-md overflow-hidden border border-gray-300 focus-within:border-[#047ca8] transition-colors w-full sm:w-64">
              <input
                type="text"
                placeholder="Search in results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 text-sm focus:outline-none text-gray-800 min-w-0"
              />
              <button
                type="submit"
                className="bg-[#0FB7A3] hover:bg-[#0DA28E] px-3 flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Search className="h-4 w-4 text-white" />
              </button>
            </form>

            {/* Sort */}
            <div className="flex-shrink-0">
              <SortOptions />
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-[#232f3e] text-white text-sm font-semibold rounded-md hover:bg-[#37475a] transition-colors flex-shrink-0"
            >
              <FaFilter size={14} />
              Filters
            </button>
          </div>

          {/* ── Active Filter Chips ── */}
          {activeFilters.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm px-4 py-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 font-medium flex-shrink-0">Active filters:</span>
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 bg-[#e8f4f8] border border-[#b3d9e8] text-[#047ca8] text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  <span className="capitalize">{f.label}</span>
                  <button
                    onClick={() => removeFilter(f.key)}
                    className="hover:text-red-500 transition-colors ml-0.5"
                    aria-label={`Remove ${f.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {activeFilters.length > 1 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold underline ml-1 flex-shrink-0"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* ── Product Grid ── */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <ProductGrid products={products} loading={loading} error={error} />
          </div>

          {/* ── FAQ ── */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <FAQSection />
          </div>

          {/* ── SEO Content ── */}
          <section className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
              Welcome to M Wellness Bazaar — Your Premium Wellness Destination
            </h2>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                At M Wellness Bazaar, we believe that true wellness is a journey, not a destination. Our carefully curated collection of premium wellness products is designed to support your path to vibrant health, blending ancient healing wisdom with modern scientific innovation.
              </p>
              {[
                {
                  title: "Why Choose M Wellness Bazaar?",
                  body: "We source only the highest quality, authentic wellness products from trusted suppliers worldwide. Every product undergoes rigorous quality checks for purity, potency, and effectiveness.",
                },
                {
                  title: "Our Comprehensive Product Range",
                  body: "From energy-boosting supplements and nutritional powerhouses to skincare products infused with natural ingredients, stress-relief solutions, Ayurvedic remedies, and fitness accessories — we've got you covered.",
                },
                {
                  title: "Quality Assurance & Authenticity Guarantee",
                  body: "All our wellness products are 100% authentic and sourced directly from manufacturers or authorized distributors. We never compromise on quality or sell counterfeit items.",
                },
                {
                  title: "Fast & Free Shipping",
                  body: "We offer fast shipping on all orders, with free shipping on qualifying purchases. Our efficient logistics network ensures your products reach you quickly and in pristine condition.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          <div className="w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col">
            <div className="bg-[#232f3e] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Refine Results
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterSidebar />
            </div>
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-full bg-[#0FB7A3] hover:bg-[#0DA28E] text-white font-bold py-3 rounded-lg transition-colors"
              >
                Show {products?.length || 0} Results
              </button>
            </div>
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default CollectionPage;

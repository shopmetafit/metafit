import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";

import FilterSidebar from "../components/Products/FilterSidebar";
import GoalBar from "../components/Products/GoalBar";
import ProductGrid from "../components/Products/ProductGrid";

import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productSlice";
import FAQSection from "./FAQ";

import SEO from "../components/SEO/SEO";

const categorySlugToName = {
  "ayurvedic-devices": "Ayurvedic Devices",
  "health-monitoring": "Health Monitoring",
  "snacks-and-protein": "Snacks & Protein",
  "skin-and-body-care": "Skin & Body Care",
  "panchakarma-equipment": "Panchakarma Equipment",
  "accessories": "Accessories",
};

const CollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const observerRef = useRef(null);

  const navigate = useNavigate();
  const { collection, categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParams = Object.fromEntries([...searchParams]);

  // Derive resolved category name from slug or query param
  const activeCategory = categorySlug
    ? (categorySlugToName[categorySlug] || categorySlug.replace(/-/g, " "))
    : queryParams.category;

  useEffect(() => {
    if (searchParams.get("sidebar") === "true") {
      setIsSidebarOpen(true);
    }
  }, [searchParams]);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    if (searchParams.get("sidebar") === "true") {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("sidebar");
      setSearchParams(newParams, { replace: true });
    }
  };

  const dispatch = useDispatch();
  const {
    products,
    loading,
    loadingMore,
    hasMore,
    totalProducts,
    currentPage,
    error,
    wellnessGoals,
  } = useSelector((state) => state.products);

  // Initial load or when filters change -> reset to page 1
  useEffect(() => {
    const params = { collection, ...queryParams };
    if (activeCategory) {
      params.category = activeCategory;
    }
    delete params.location;
    dispatch(fetchProductsByFilters(params));
  }, [dispatch, collection, categorySlug, searchParams]);

  // Load next batch when user scrolls near the bottom
  const loadNextBatch = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const params = {
        collection,
        ...queryParams,
        page: (currentPage || 1) + 1,
        limit: PAGE_LIMIT,
      };
      delete params.location;
      dispatch(fetchProductsByFilters(params));
    }
  }, [
    dispatch,
    collection,
    queryParams,
    currentPage,
    hasMore,
    loading,
    loadingMore,
  ]);

  // Infinite scroll Intersection Observer
  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextBatch();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadNextBatch]);



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

  // Active filter count for badge in GoalBar
  const activeFilterCount = Object.keys(queryParams).filter(
    (k) => ["brand", "minPrice", "maxPrice", "search", "category", "subCategory"].includes(k) && queryParams[k]
  ).length;

  // Prevent body scroll when filter drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  // Close drawer on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSidebarOpen) {
        closeSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  // Active filter chips derived from URL params (Sidebar filters like brand, search, price)
  const activeFilters = [];
  if (queryParams.category && !queryParams.goal) {
    activeFilters.push({ key: "category", label: `Category: ${queryParams.category}` });
  }
  if (queryParams.brand) activeFilters.push({ key: "brand", label: `Brand: ${queryParams.brand}` });
  if (queryParams.search) activeFilters.push({ key: "search", label: `Search: "${queryParams.search}"` });

  if (queryParams.minPrice || queryParams.maxPrice) {
    activeFilters.push({
      key: "price",
      label: `Price: ₹${queryParams.minPrice || 0} – ₹${queryParams.maxPrice || "∞"}`,
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
    setSearchParams(new URLSearchParams());
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    const params = new URLSearchParams(searchParams);
    params.delete('location');
    setSearchParams(params);
  };

  // Dynamic SEO metadata
  const hasFilterParams = Object.keys(queryParams).some(
    (k) => ["brand", "minPrice", "maxPrice", "search", "material"].includes(k)
  );

  const displayCategoryName = activeCategory
    ? activeCategory.replace(/\b\w/g, (c) => c.toUpperCase())
    : "All Products";

  const seoTitle = (categorySlug || activeCategory)
    ? `${displayCategoryName} — Shop Authentic ${displayCategoryName}`
    : "Wellness & Healthcare Product Catalog";

  const seoDescription = activeCategory
    ? `Explore our collection of authentic ${displayCategoryName} at M Wellness Bazaar. High-quality healthcare, wellness products & fast shipping across India.`
    : "Browse the complete collection of authentic wellness products, health monitors, Ayurvedic devices, and supplements at M Wellness Bazaar.";

  const canonicalPath = categorySlug
    ? `/category/${categorySlug}`
    : "/collections/all";

  const robotsDirective = hasFilterParams ? "noindex, follow" : "index, follow";

  return (
    <div className="min-h-screen bg-[#f0f2f2]">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalPath}
        robots={robotsDirective}
      />

      <div className="max-w-screen-2xl mx-auto px-4 pt-2 pb-4">
        {/* ── Main Content Container ── */}
        <div className="w-full space-y-2">
          {/* ── Health & Wellness Goal Bar + Refine Results Trigger ── */}
          <GoalBar
            onOpenFilter={() => setIsSidebarOpen(true)}
            activeFilterCount={activeFilterCount}
          />

          {/* ── Active Secondary Filter Chips (Only shown when Brand, Price, Search are active) ── */}
          {activeFilters.length > 0 && (
            <div className="bg-white rounded-lg shadow-xs border border-slate-200/80 px-3 py-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium flex-shrink-0">Filters:</span>
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-[#0a8274] text-xs font-medium px-2 py-0.5 rounded-md"
                >
                  <span>{f.label}</span>
                  <button
                    onClick={() => removeFilter(f.key)}
                    className="hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                    aria-label={`Remove ${f.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {activeFilters.length > 1 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-500 hover:text-red-700 font-medium underline ml-1 flex-shrink-0 cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Mobile Product Header */}
          <div className="lg:hidden flex items-center justify-between bg-white px-4 py-2 rounded-lg shadow-xs">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">SHOP</p>
              <h1 className="text-lg font-bold text-gray-900">
                All Products <span className="text-gray-500 font-normal text-sm">({totalProducts || products?.length || 0})</span>
              </h1>
            </div>
          </div>

          {/* ── Full-Width Product Grid ── */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <ProductGrid
              products={products}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
            />
            {/* Infinite Scroll Sentinel for Amazon-style progressive batching */}
            <div ref={observerRef} className="h-4 w-full" />
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

      {/* ── Refine Results Right-Side Overlay Drawer (Desktop & Mobile) ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={closeSidebar}
            aria-hidden="true"
          />

          {/* Right Drawer Container */}
          <div
            className="relative w-full max-w-[400px] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 transform transition-transform"
            role="dialog"
            aria-modal="true"
            aria-label="Refine Results Filter"
          >
            {/* Header */}
            <div className="bg-[#232f3e] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#0FB7A3]" />
                <span>Refine Results</span>
              </h2>
              <button
                onClick={closeSidebar}
                className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Filter Controls */}
            <div className="flex-1 overflow-y-auto">
              <FilterSidebar />
            </div>

            {/* Drawer Footer Action */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
              <button
                onClick={closeSidebar}
                className="w-full bg-[#0FB7A3] hover:bg-[#0DA28E] text-white font-bold py-3 rounded-lg transition-colors cursor-pointer text-sm"
              >
                Show {totalProducts || products?.length || 0} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionPage;

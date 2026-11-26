import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";

import FilterSidebar from "../components/Products/FilterSidebar";
import GoalBar from "../components/Products/GoalBar";
import ProductGrid from "../components/Products/ProductGrid";
import HomePage from "../components/Home/HomePage";

import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productSlice";
import FAQSection from "./FAQ";
import WelcomeAccordion from "../components/common/WelcomeAccordion";
import LeafRevealIntro from "../components/common/LeafRevealIntro";

import SEO from "../components/SEO/SEO";
import { trackGtmViewItemList } from "../lib/gtm";

export const getProductDiscount = (product) => {
  if (!product) return 0;
  const sellingPrice = Number(product.discountPrice || product.price || 0);
  const mrpPrice = Number(product.price || 0);
  if (product.discountPrice && mrpPrice > sellingPrice && mrpPrice > 0) {
    return Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100);
  }
  return 0;
};

const categorySlugToName = {
  "ayurvedic-devices": "Ayurvedic Devices",
  "health-monitoring": "Health Monitoring",
  "snacks-and-protein": "Snacks & Protein",
  "skin-and-body-care": "Skin & Body Care",
  "panchakarma-equipment": "Panchakarma Equipment",
  "accessories": "Accessories",
};

const PAGE_LIMIT = 24;

const CollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
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

  // GA4 - view_item_list tracking on product list render
  useEffect(() => {
    if (!loading && products && products.length > 0) {
      trackGtmViewItemList({
        items: products,
        item_list_name: activeCategory || collection || "Product Catalog",
        item_list_id: categorySlug || collection || "catalog",
      });
    }
  }, [loading, products, activeCategory, collection, categorySlug]);

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



  // Filter products by real discount percentage if discount query parameters exist,
  // and sort with highest discount first when viewing deals/discounts.
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    let result = products;

    if (queryParams.discount) {
      const targetDiscount = Number(queryParams.discount);
      result = result.filter(
        (product) => getProductDiscount(product) === targetDiscount
      );
    } else if (queryParams.discountMin || queryParams.discountMax) {
      const minD = queryParams.discountMin ? Number(queryParams.discountMin) : 0;
      const maxD = queryParams.discountMax ? Number(queryParams.discountMax) : 100;
      result = result.filter((product) => {
        const d = getProductDiscount(product);
        return d >= minD && d <= maxD;
      });
    }

    const sortBy = queryParams.sortBy || queryParams.sort;
    const isDealsContext = Boolean(
      queryParams.discount ||
      queryParams.discountMin ||
      queryParams.discountMax ||
      sortBy === "discount"
    );

    // If on Today's Deals / discount filter or sortBy is explicitly 'discount',
    // sort descending by discount percentage (highest discount first)
    if (sortBy === "discount" || (isDealsContext && (!sortBy || sortBy === "priority" || sortBy === "featured"))) {
      result = [...result].sort((a, b) => {
        const discA = getProductDiscount(a);
        const discB = getProductDiscount(b);
        if (discB !== discA) {
          return discB - discA; // Highest discount percentage first
        }
        // If discount percentages are equal, show larger absolute ₹ savings first
        const priceA = Number(a.price || 0);
        const saleA = Number(a.discountPrice || a.price || 0);
        const priceB = Number(b.price || 0);
        const saleB = Number(b.discountPrice || b.price || 0);
        const savingsA = priceA - saleA;
        const savingsB = priceB - saleB;
        if (savingsB !== savingsA) {
          return savingsB - savingsA;
        }
        return (b.rating || 0) - (a.rating || 0);
      });
    }

    return result;
  }, [
    products,
    queryParams.discount,
    queryParams.discountMin,
    queryParams.discountMax,
    queryParams.sortBy,
    queryParams.sort,
  ]);

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
    (k) =>
      [
        "brand",
        "minPrice",
        "maxPrice",
        "search",
        "category",
        "subCategory",
        "discount",
        "discountMin",
        "discountMax",
      ].includes(k) && queryParams[k]
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

  // Active filter chips derived from URL params (Sidebar filters like brand, search, price, discount)
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

  if (queryParams.discount) {
    activeFilters.push({
      key: "discount",
      label: `Discount: ${queryParams.discount}% OFF`,
    });
  }
  if (queryParams.discountMin || queryParams.discountMax) {
    activeFilters.push({
      key: "discountRange",
      label: `Discount: ${queryParams.discountMin || 0}% – ${queryParams.discountMax || 100}% OFF`,
    });
  }

  const removeFilter = (key) => {
    const params = new URLSearchParams(searchParams);
    if (key === "price") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else if (key === "discount") {
      params.delete("discount");
    } else if (key === "discountRange") {
      params.delete("discountMin");
      params.delete("discountMax");
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
    (k) => ["brand", "minPrice", "maxPrice", "search", "material", "discount", "discountMin", "discountMax"].includes(k)
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

  // Pure home route (no collection, no category, no filters) -> reference-style homepage
  const isHome =
    !collection && !categorySlug && Object.keys(queryParams).length === 0;

  if (isHome) {
    return (
      <LeafRevealIntro>
        <div className="min-h-screen">
          <SEO
            title="M Wellness Bazaar — Indian wellness products, delivered"
            description="Shop women's wellness, skin & body care, healthy foods and Ayurvedic devices from trusted Indian brands."
            canonical="/"
            robots="index, follow"
          />
          <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 pt-3 pb-8">
            <HomePage />
          </div>
        </div>
      </LeafRevealIntro>
    );
  }

  return (
    <div className="min-h-screen bg-herb-background">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalPath}
        robots={robotsDirective}
      />

      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4 pt-1 pb-4">
        {/* ── Main Content Container ── */}
        <div className="w-full space-y-2">

          {/* ── Health & Wellness Goal Bar + Refine Results Trigger ── */}
          <GoalBar
            onOpenFilter={() => setIsSidebarOpen(true)}
            activeFilterCount={activeFilterCount}
          />

          {/* ── Active Secondary Filter Chips (Shown when Brand, Price, Search, or Discount filters are active) ── */}
          {activeFilters.length > 0 && (
            <div className="bg-white rounded-lg shadow-xs border border-slate-200/80 px-3 py-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium flex-shrink-0">Filters:</span>
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 bg-[#F7F1E7] border border-[#A5794F]/40 text-[#4E4033] text-xs font-bold px-2 py-0.5 rounded-md"
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
          <div className="lg:hidden flex items-center justify-between bg-white px-3.5 py-1.5 rounded-lg shadow-xs">
            <h1 className="text-base font-bold text-gray-900">
              All Products <span className="text-gray-500 font-normal text-xs">({filteredProducts?.length || totalProducts || products?.length || 0})</span>
            </h1>
          </div>

          {/* ── Full-Width Product Grid ── */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <ProductGrid
              products={filteredProducts}
              loading={loading}
              loadingMore={loadingMore}
              error={error}
            />
            {/* Infinite Scroll Sentinel for Amazon-style progressive batching */}
            <div ref={observerRef} className="h-4 w-full" />
          </div>

          {/* ── FAQ Main Accordion ── */}
          <div className="mt-6">
            <FAQSection
              isOpen={openSection === "faq"}
              onToggle={() => setOpenSection(openSection === "faq" ? null : "faq")}
            />
          </div>

          {/* ── Welcome Main Accordion ── */}
          <div className="mt-4">
            <WelcomeAccordion
              isOpen={openSection === "welcome"}
              onToggle={() => setOpenSection(openSection === "welcome" ? null : "welcome")}
            />
          </div>

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
            <div className="bg-[#292117] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#A5794F]" />
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
                className="w-full bg-[#A5794F] hover:bg-[#6E5136] text-white font-bold py-3 rounded-lg transition-colors cursor-pointer text-sm"
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

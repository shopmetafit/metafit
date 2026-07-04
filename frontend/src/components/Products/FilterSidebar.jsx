import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaLeaf,
  FaHeartbeat,
  FaAppleAlt,
  FaSpa,
  FaBed,
  FaTags,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllProducts } from "../../redux/slices/productSlice";

const categoryIcons = {
  "ayurvedic devices": <FaLeaf />,
  "health monitoring": <FaHeartbeat />,
  "snacks & protein": <FaAppleAlt />,
  "skin & body care": <FaSpa />,
  "panchakarma equipment": <FaBed />,
  "accessories": <FaTags />,
  // Add other categories here with lowercase keys
};

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { allProducts } = useSelector((state) => state.products);

  // Frontend workaround for known category typos.
  // Ideally, this should be corrected at the data source (backend/database).
  const typoCorrectionMap = {
    "protien bite": "protein bite",
    "hare care": "hair care",
    // Add other known typos here
  };

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  const uniqueBrands = allProducts.reduce((acc, product) => {
    const brand = product.brand?.trim();
    if (brand) {
      const normalizedBrand = brand.toLowerCase();
      if (!acc.find(b => b.normalizedName === normalizedBrand)) {
        acc.push({ normalizedName: normalizedBrand, displayName: brand });
      }
    }
    return acc;
  }, []);

  const uniqueCategories = allProducts.reduce((acc, product) => {
    let category = product.category?.trim();
    if (category) {
      let normalizedCategory = category.toLowerCase();
      // Apply typo correction
      if (typoCorrectionMap[normalizedCategory]) {
        normalizedCategory = typoCorrectionMap[normalizedCategory];
        // If the original category was a typo, try to find a correct displayName
        // This is a simple approach; a more robust solution might store preferred display names
        // alongside normalized names in the typoCorrectionMap.
        if (category.toLowerCase() in typoCorrectionMap) {
          category = typoCorrectionMap[category.toLowerCase()].replace(/\b\w/g, s => s.toUpperCase()); // Capitalize corrected name for display
        }
      }

      if (!acc.find(c => c.normalizedName === normalizedCategory)) {
        acc.push({ normalizedName: normalizedCategory, displayName: category });
      }
    }
    return acc;
  }, []);

  const [openSections, setOpenSections] = useState({
    category: true,
    price: true,
    brand: true,
  });

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category")?.toLowerCase() || ""
  );
  const [minPriceInput, setMinPriceInput] = useState(
    searchParams.get("minPrice") || ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    searchParams.get("maxPrice") || ""
  );
  const [selectedBrands, setSelectedBrands] = useState(
    searchParams.get("brand")?.split(',').map(b => b.toLowerCase()).filter(Boolean) || []
  );

  useEffect(() => {
    setSelectedCategory(searchParams.get("category")?.toLowerCase() || "");
    setMinPriceInput(searchParams.get("minPrice") || "");
    setMaxPriceInput(searchParams.get("maxPrice") || "");
    setSelectedBrands(
      searchParams.get("brand")?.split(',').map(b => b.toLowerCase()).filter(Boolean) || []
    );
  }, [searchParams]);

  const handleCategoryChange = (normalizedCategory) => {
    const newCategory = selectedCategory === normalizedCategory ? "" : normalizedCategory;
    setSelectedCategory(newCategory);

    // Apply filters directly
    const params = new URLSearchParams(searchParams);
    params.delete("search");

    if (newCategory) {
      params.set("category", newCategory);
    } else {
      params.delete("category");
    }

    if (selectedBrands.length > 0) {
      params.set("brand", selectedBrands.join(","));
    } else {
      params.delete("brand");
    }

    setSearchParams(params);
  };

  const handleBrandChange = (normalizedBrand) => {
    const newSelectedBrands = selectedBrands.includes(normalizedBrand)
      ? selectedBrands.filter((b) => b !== normalizedBrand)
      : [normalizedBrand]; // Only one brand can be selected
    setSelectedBrands(newSelectedBrands);

    // Apply filters directly
    const params = new URLSearchParams(searchParams);
    params.delete("search");

    if (selectedCategory) {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }

    if (newSelectedBrands.length > 0) {
      params.set("brand", newSelectedBrands.join(","));
    } else {
      params.delete("brand");
    }

    setSearchParams(params);
  };

  const resetFilters = () => {
    const params = new URLSearchParams();
    // Keep search if it exists, clear only filters
    const searchTerm = searchParams.get("search");
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    setMinPriceInput("");
    setMaxPriceInput("");
    setSearchParams(params);
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("search");

    if (minPriceInput.trim()) {
      params.set("minPrice", minPriceInput.trim());
    } else {
      params.delete("minPrice");
    }

    if (maxPriceInput.trim()) {
      params.set("maxPrice", maxPriceInput.trim());
    } else {
      params.delete("maxPrice");
    }

    setSearchParams(params);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      applyPriceFilter();
    }
  };

  return (
    <div className="w-full flex flex-col p-5 font-sans h-full overflow-y-auto scrollbar-custom">
      <div className="flex-grow pr-4 -mr-4">

        {/* Price Filter */}
        <div className="mb-8">
          <SectionHeader
            title="Price"
            isOpen={openSections.price}
            toggle={() => toggleSection("price")}
          />
          {openSections.price && (
            <div className="mt-4 px-1">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label htmlFor="min-price-input" className="text-xs text-gray-500 font-medium mb-1 block">From (₹)</label>
                  <input
                    id="min-price-input"
                    type="number"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0FA958] focus:ring-1 focus:ring-[#0FA958] transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="max-price-input" className="text-xs text-gray-500 font-medium mb-1 block">To (₹)</label>
                  <input
                    id="max-price-input"
                    type="number"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0FA958] focus:ring-1 focus:ring-[#0FA958] transition-colors"
                  />
                </div>
                <div className="self-end pb-0.5">
                  <button
                    onClick={applyPriceFilter}
                    className="bg-[#0FA958] hover:bg-[#0c8e4a] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-300 shadow-sm"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Brand Filter */}
        <div className="mb-8">
          <SectionHeader
            title="Brand"
            isOpen={openSections.brand}
            toggle={() => toggleSection("brand")}
          />
          {openSections.brand && (
            <div className="mt-4 space-y-3">
              {uniqueBrands.map((brand) => (
                <Checkbox
                  key={brand.normalizedName}
                  label={brand.displayName}
                  checked={selectedBrands.includes(brand.normalizedName)}
                  onChange={() => handleBrandChange(brand.normalizedName)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={resetFilters}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold text-base hover:bg-gray-300 transition-colors duration-300"
          >
            Reset Filters
          </button>
        </div>
      </div>

    </div>
  );
};

// Helper component for section headers
const SectionHeader = ({ title, isOpen, toggle }) => (
  <div
    className="flex justify-between items-center cursor-pointer"
    onClick={toggle}
  >
    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
    {isOpen ? (
      <FaChevronUp className="text-gray-500" />
    ) : (
      <FaChevronDown className="text-gray-500" />
    )}
  </div>
);

// Helper component for checkboxes
const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-5 w-5 rounded border-gray-300 text-[#0FA958] focus:ring-[#0FA958] focus:ring-opacity-50"
    />
    <span className="text-gray-700">{label}</span>
  </label>
);
// hello brother how are oyu 
export default FilterSidebar;

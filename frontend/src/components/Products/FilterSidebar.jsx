import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Range, getTrackBackground } from "react-range";
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
  const [priceValues, setPriceValues] = useState([
    parseInt(searchParams.get("minPrice")) || 0,
    parseInt(searchParams.get("maxPrice")) || 100000,
  ]);
  const [selectedBrands, setSelectedBrands] = useState(
    searchParams.get("brand")?.split(',').map(b => b.toLowerCase()).filter(Boolean) || []
  );

  useEffect(() => {
    setSelectedCategory(searchParams.get("category")?.toLowerCase() || "");
    setPriceValues([
      parseInt(searchParams.get("minPrice")) || 0,
      parseInt(searchParams.get("maxPrice")) || 100000,
    ]);
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
    setSearchParams(params);
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const STEP = 10;
  const MIN = 0;
  const MAX = 100000;

  return (
<div className="bg-white w-full lg:w-80 lg:min-w-[320px] h-screen flex flex-col p-6 shadow-lg font-sans">
<div className="flex-grow overflow-y-auto overscroll-contain scrollbar-custom pr-4 -mr-4">
        {/* Category Section */}
        <div className="mb-8">
          <SectionHeader
            title="Categories"
            isOpen={openSections.category}
            toggle={() => toggleSection("category")}
          />
          {openSections.category && (
            <div className="mt-4 space-y-3">
              {uniqueCategories.map((category) => (
                <div
                  key={category.normalizedName}
                  className={`flex items-center p-3 -ml-3 rounded-lg cursor-pointer transition-colors duration-200 ${selectedCategory === category.normalizedName ? 'bg-green-100' : 'hover:bg-gray-50'}`}
                  onClick={() => handleCategoryChange(category.normalizedName)}
                >
                  <div className={`mr-4 text-lg ${selectedCategory === category.normalizedName ? 'text-[#0FA958]' : 'text-gray-500'}`}>
                    {categoryIcons[category.normalizedName] || <FaTags />}
                  </div>
                  <span className={`font-medium ${selectedCategory === category.normalizedName ? 'text-[#0FA958]' : 'text-gray-800'}`}>
                    {category.displayName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Filter */}
        <div className="mb-8">
          <SectionHeader
            title="Price"
            isOpen={openSections.price}
            toggle={() => toggleSection("price")}
          />
          {openSections.price && (
            <div className="mt-6 relative px-2">
              <Range
                values={priceValues}
                step={STEP}
                min={MIN}
                max={MAX}
                onChange={(values) => setPriceValues(values)}
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    className="h-1 w-full rounded-full"
                    style={{
                      background: getTrackBackground({
                        values: priceValues,
                        colors: ["#ccc", "#0FA958", "#ccc"],
                        min: MIN,
                        max: MAX,
                      }),
                    }}
                  >
                    {children}
                  </div>
                )}
                renderThumb={({ props: thumbProps }) => {
                  const { key, ...rest } = thumbProps;
                  return (
                    <div
                      key={key}
                      {...rest}
                      className="h-5 w-5 bg-white rounded-full shadow-md border-2 border-[#0FA958] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0FA958]"
                    />
                  );
                }}
              />
              <div className="flex justify-between mt-4 text-sm text-gray-600">
                <span>₹{priceValues[0]}</span>
                <span>₹{priceValues[1]}</span>
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

export default FilterSidebar;

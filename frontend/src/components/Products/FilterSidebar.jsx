import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

import { fetchAllProducts } from "../../redux/slices/productSlice";

const FilterSidebar = () => {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [minProductPrice, setMinProductPrice] = useState(0);
  const [maxProductPrice, setMaxProductPrice] = useState(10000);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const dispatch = useDispatch();
 const { allProducts } = useSelector((state) => state.products);

  useEffect(() => {
    // Fetch all products without filters
    dispatch(fetchAllProducts({}));
  }, [dispatch]);

  // console.log("filsid28",products);

  useEffect(() => {
    if (allProducts.length > 0) {
      const prices = allProducts.map((p) => p.discountPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      setMinProductPrice(minPrice);
      setMaxProductPrice(maxPrice);
    }
  }, []);

  const [filters, setFilters] = useState({
    category: "",
    benefit: [],
    size: [],
    brand: [],
    routine: [],
    ingredient: [],
    dietaryPreference: [],
    minPrice: minProductPrice,
    maxPrice: maxProductPrice,
  });

  const [openSections, setOpenSections] = useState({
    category: false,
    routine: false,
    ingredient: false,
    dietaryPreferences: false,
    benefit: false,
    brand: false,
    size: false,
    price: false,
  });

  const resetFilters = () => {
    // Reset slider inputs to product min/max
  setMinPrice(minProductPrice);
  setMaxPrice(maxProductPrice);
    const defaultFilters = {
      category: "",
      benefit: [],
      size: [],
      brand: [],
      routine: [],
      ingredient: [],
      dietaryPreference: [],
      minPrice: minPrice,
      maxPrice: maxPrice,
    };
    setFilters(defaultFilters);
    setSearchParams({});
    navigate("");
  };

  // const [priceRange, setPriceRange] = useState([0, 10000]);
  // x.com/a=1&b=2
  const categories = [
    "Organic",
    "Eco-Friendly",
    "Vegan",
    "Lab Tested",
    "Chemical Free",
  ];

  const Ratings = ["4 Stars and up", "3 Stars and up"];

  const Routines = ["Morning", "Night", "Workout"];
  const Ingredients = ["Ashwagandha", "Collagen", "Vitamin C"];
  const DietaryPreferences = ["Vegan", "Keto", "Gluten-Free"];
  const Benefits = [
    "Sleep",
    "Immunity",
    "Stress Relief",
    "Weight loss",
    "Gain Pcod",
  ];

  const sizes = ["S", "M"];

  const brands = ["Metawellness", "Brand B", "Brand C"];

 

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    // console.log(Object.fromEntries([...searchParams]));
    //The spread syntax (...) is useful when you want to create a new array from an existing iterable, it makes shallow copy of searchParams.The spread syntax ([...entries]) is used to create a shallow copy of the array of key-value pairs.

    // Using Object.fromEntries([...entries]), you take the array,[['a', 1], ['b', 2], ['c', 3]], of key-value pairs and convert it back into an object: { a: 1, b: 2, c: 3 }.

    setFilters({
      category: params.category || "",
      size: params.size ? params.size.split(",") : [],
      benefit: params.benefit ? params.benefit.split(",") : [],
      brand: params.brand ? params.brand.split(",") : [],
      routine: params.routine ? params.routine.split(",") : [],
      ingredient: params.ingredient ? params.ingredient.split(",") : [],
      dietaryPreferences: params.dietaryPreferences
        ? params.dietaryPreferences.split(",")
        : [],
    });

  }, [searchParams]);

  const handleFilterChange = (e) => {
    const { name, value, checked, type } = e.target;
    // console.log("FiS77",e.target);

    // console.log(e);
    // console.log({ name, value, checked, type });
    let newFilters = { ...filters };

    if (type === "checkbox") {
      if (checked) {
        newFilters[name] = [...(newFilters[name] || []), value]; // add value in array.
        // console.log("sdg",newFilters[name])
      } else {
        newFilters[name] = newFilters[name].filter((item) => item !== value);
      }
    } else {
      newFilters[name] = value;
    }
    setFilters(newFilters);
    // console.log(newFilters);
    updateURLParams(newFilters);
  };

  const updateURLParams = (newFilters) => {
    const params = new URLSearchParams();
    //  newFilter contains js object {category:"Top Wear", size:["xs","xs"]}
    Object.keys(newFilters).forEach((key) => {
      if (Array.isArray(newFilters[key]) && newFilters[key].length > 0) {
        params.append(key, newFilters[key].join(","));
        //.join all the elements of an array into a single string
        // const fruits = ['apple', 'banana', 'cherry'];const result = fruits.join();
        // Output: "apple,banana,cherry"
        // console.log(result);

        // const filters = {
        //   category: 'shirts',
        //   colors: ['red', 'blue'],
        //   size: ['M', 'L'],
        //   sortBy: 'price',
        // };

        // output // ?category=shirts&colors=red,blue&size=M,L&sortBy=price
      } else if (newFilters[key]) {
        params.append(key, newFilters[key]);
      }
    });
    setSearchParams(params);
    navigate(`?${params.toString()}`);
  };

 
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="p-4">
      <div className="text-xl font-medium text-gray-800 mb-4">
        {/* Category */}
        <div className="mb-6">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("category")}
          >
            <label className="block text-gray-600 font-medium mb-2">
              Category
            </label>
            {openSections.category ? (
              <FaChevronUp className="text-gray-600" />
            ) : (
              <FaChevronDown className="text-gray-600" />
            )}
          </div>

          {openSections.category && (
            <div>
              {categories.map((category) => (
                <div key={category} className="flex items-center mb-1">
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    onChange={handleFilterChange}
                    checked={filters.category === category}
                    className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
                  />
                  <span className="text-gray-700">{category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/*  Routines filter */}
      <div className="mb-6">
        {/* Heading with toggle */}
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("routine")}
        >
          <label className="block text-gray-600 font-medium mb-2">
            Routine
          </label>
          {openSections.routine ? (
            <FaChevronUp className="text-gray-600" />
          ) : (
            <FaChevronDown className="text-gray-600" />
          )}
        </div>

        {/* Filter options */}
        {openSections.routine && (
          <div>
            {Routines.map((routine) => (
              <div key={routine} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  name="routine"
                  value={routine}
                  onChange={handleFilterChange}
                  checked={filters.routine.includes(routine)}
                  className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
                />
                <span className="text-gray-700">{routine}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/*  Ingredients filter */}
      <div className="mb-6">
        {/* Heading with toggle */}
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("ingredient")}
        >
          <label className="block text-gray-600 font-medium mb-2">
            Ingredients
          </label>
          {openSections.ingredient ? (
            <FaChevronUp className="text-gray-600" />
          ) : (
            <FaChevronDown className="text-gray-600" />
          )}
        </div>

        {/* Filter options */}
        {openSections.ingredient && (
          <div>
            {Ingredients.map((ingredient) => (
              <div key={ingredient} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  name="ingredient"
                  value={ingredient}
                  onChange={handleFilterChange}
                  checked={filters.ingredient.includes(ingredient)}
                  className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
                />
                <span className="text-gray-700">{ingredient}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/*  DietaryPreferences filter */}
      <div className="mb-6">
        {/* Heading with toggle */}
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("dietaryPreferences")}
        >
          <label className="block text-gray-600 font-medium mb-2">
            Dietary Preferences
          </label>
          {openSections.dietaryPreferences ? (
            <FaChevronUp className="text-gray-600" />
          ) : (
            <FaChevronDown className="text-gray-600" />
          )}
        </div>

        {/* Filter options */}
        {openSections.dietaryPreferences && (
          <div>
            {DietaryPreferences.map((dietaryPreference) => (
              <div key={dietaryPreference} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  name="dietaryPreferences"
                  value={dietaryPreference}
                  onChange={handleFilterChange}
                  checked={filters.dietaryPreferences.includes(
                    dietaryPreference
                  )}
                  className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
                />
                <span className="text-gray-700">{dietaryPreference}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* color filter */}
      {/* <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              name="color"
              className={`w-8 h-8 rounded-full border border-gray-300 cursor-pointer transition hover:scale-105 
                ${filters.color === color ? "ring-2 ring-blue-500" : ""}`}
              value={color}
              onClick={handleFilterChange}
              style={{ backgroundColor: color.toLowerCase() }}
            ></button>
          ))}
        </div>
      </div> */}

      {/* Benefit filter */}
      <div className="mb-6">
        {/* Heading with toggle */}
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("benefit")}
        >
          <label className="block text-gray-600 font-medium mb-2">
            Benefit
          </label>
          {openSections.benefit ? (
            <FaChevronUp className="text-gray-600" />
          ) : (
            <FaChevronDown className="text-gray-600" />
          )}
        </div>

        {/* Filter options */}
        {openSections.benefit && (
          <div>
            {Benefits.map((benefit) => (
              <div key={benefit} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  name="benefit"
                  value={benefit}
                  onChange={handleFilterChange}
                  checked={filters.benefit.includes(benefit)}
                  className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
                />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* brand filter */}
      <div className="mb-6">
        {/* Heading with toggle */}
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("brand")}
        >
          <label className="block text-gray-600 font-medium mb-2">Brand</label>
          {openSections.brand ? (
            <FaChevronUp className="text-gray-600" />
          ) : (
            <FaChevronDown className="text-gray-600" />
          )}
        </div>

        {/* Filter options */}
        {openSections.brand && (
          <div>
            {brands.map((brand) => (
              <div key={brand} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  name="brand"
                  value={brand}
                  onChange={handleFilterChange}
                  checked={filters.brand.includes(brand)}
                  className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
                />
                <span className="text-gray-700">{brand}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        {/* Heading with toggle */}
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleSection("size")}
        >
          <label className="block text-gray-600 font-medium mb-2">Size</label>
          {openSections.size ? (
            <FaChevronUp className="text-gray-600" />
          ) : (
            <FaChevronDown className="text-gray-600" />
          )}
        </div>

        {/* Filter options */}
        {openSections.size && (
          <div>
            {sizes.map((size) => (
              <div key={size} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  name="size"
                  value={size}
                  onChange={handleFilterChange}
                  checked={filters.size.includes(size)}
                  className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
                />
                <span className="text-gray-700">{size}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-6">
        <button
          className="flex justify-between items-center w-full text-gray-700 font-semibold text-base px-2 py-2 rounded-md hover:bg-gray-100"
          onClick={() => toggleSection("price")}
        >
          <span>Price</span>
          {openSections.price ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {openSections.price && (
          <div className="mt-2 space-y-4 px-2">
            {/* Scrollable Price Range (slider) */}
            <div>
              <input
                type="range"
                min={minProductPrice}
                max={maxProductPrice}
                step="10"
                value={minPrice || minProductPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <input
                type="range"
                min={minProductPrice}
                max={maxProductPrice}
                step="10"
                value={maxPrice || maxProductPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>₹{minPrice || minProductPrice}</span>
                <span>₹{maxPrice || maxProductPrice}</span>
              </div>
            </div>

            {/* Manual Min-Max Inputs */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder={`Min (${minProductPrice})`}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-20 px-2 py-1 border rounded-md text-sm"
              />
              <span>-</span>
              <input
                type="number"
                placeholder={`Max (${maxProductPrice})`}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-20 px-2 py-1 border rounded-md text-sm"
              />
            </div>
            
              <button
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    minPrice: minPrice || minProductPrice,
                    maxPrice: maxPrice || maxProductPrice,
                  };
                  setFilters(newFilters);
                  updateURLParams(newFilters);
                }}
                className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
          </div>
        )}
      </div>

      {/* Reset Filters */}
      <button
        onClick={resetFilters}
        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition font-semibold"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterSidebar;

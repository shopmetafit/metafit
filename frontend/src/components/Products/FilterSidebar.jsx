import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // console.log([...searchParams]);
  // console.log(searchParams);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    color: "",
    size: [],
    material: [],
    brand: [],
    minPrice: 0,
    maxPrice: 10000,
  });

  const [priceRange, setPriceRange] = useState([0, 10000]);
  // x.com/a=1&b=2
  const categories = ["Top Wear", "Bottom Wear"];

  const colors = [
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Purple",
    "Orange",
    "Pink",
    "Brown",
    "Black",
    "White",
    "Gray",
  ];
  const materials = [
    "Polyester",
    "Cotton",
    "Leather",
    "Plastic",
    "Glass",
    "Aluminum",
    "Brick",
    "Stone",
    "Copper",
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "7", "8", "9", "10", "11"];

  const brands = ["Nike", "Apple", "Adidas", "Samsung", "Sony", "Technosport"];

  const genders = ["Men", "Women", "Unisex"];

  useEffect(() => {
    const params = Object.fromEntries([...searchParams]);
    // console.log(Object.fromEntries([...searchParams]));
    //The spread syntax (...) is useful when you want to create a new array from an existing iterable, it makes shallow copy of searchParams.The spread syntax ([...entries]) is used to create a shallow copy of the array of key-value pairs.

    // Using Object.fromEntries([...entries]), you take the array,[['a', 1], ['b', 2], ['c', 3]], of key-value pairs and convert it back into an object: { a: 1, b: 2, c: 3 }.

    setFilters({
      category: params.category || "",
      gender: params.gender || "",
      color: params.color || "",
      size: params.size ? params.size.split(",") : [], //.split convert it into array
      material: params.material ? params.material.split(",") : [],
      brand: params.brand ? params.brand.split(",") : [],
      minPrice: params.minPrice || 0,
      maxPrice: params.maxPrice || 10000,
    });
    setPriceRange([0, params.maxPrice || 10000]);
  }, [searchParams]);

  const handleFilterChange = (e) => {
    const { name, value, checked, type } = e.target;
    // console.log("FiS77",e.target);

    // console.log(e);
    // console.log({ name, value, checked, type });
    let newFilters = { ...filters };
    // console.log("ddsg",newFilters);

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

  const handlePriceChange = (e) => {
    const newPrice = e.target.value;
    setPriceRange([0, 10000]);
    const newFilters = { ...filters, minPrice: 0, maxPrice: newPrice };
    setFilters(newFilters);
    updateURLParams(newFilters);
    // console.log("fsdds",newFilters);
  };

  return (
    <div className="p-4">
      <div className="text-xl font-medium text-gray-800 mb-4">
        {/* category filter */}
        <div className="mb-6">
          <label className="block text-gray-600 font-medium mb-2">
            Category
          </label>
          {categories.map((category) => (
            <div key={category} className="flex items-center mb-1">
              <input
                type="radio"
                name="category"
                value={category}
                onChange={handleFilterChange}
                checked={filters.category == category}
                className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
              />
              <span className="text-gray-700">{category}</span>
            </div>
          ))}
        </div>
      </div>
      {/* gender filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Gender</label>
        {genders.map((gender) => {
          return (
            <div key={gender} className="flex items-center mb-1">
              <input
                type="radio"
                name="gender"
                value={gender}
                onChange={handleFilterChange}
                checked={filters.gender == gender}
                className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-300"
              />
              <span className="text-gray-700">{gender}</span>
            </div>
          );
        })}
      </div>
      {/* color filter */}
      <div className="mb-6">
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
      </div>

      {/* Material filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">material</label>
        {materials.map((material) => (
          <div key={material} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="material"
              className="mr-2 h-4 w-4  text-blue-500 focus:ring-blue-400 border-gray-400"
              value={material}
              checked={filters.material.includes(material)}
              onChange={handleFilterChange}
            />
            <span className="text-gray-700">{material}</span>
          </div>
        ))}
      </div>

      {/* brand filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">brand</label>
        {brands.map((brand) => (
          <div key={brand} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="brand"
              className="mr-2 h-4 w-4  text-blue-500 focus:ring-blue-400 border-gray-400"
              value={brand}
              checked={filters.brand.includes(brand)}
              onChange={handleFilterChange}
            />
            <span className="text-gray-700">{brand}</span>
          </div>
        ))}
      </div>

      {/* size filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-2">Size</label>
        {sizes.map((size) => (
          <div key={size} className="flex items-center mb-1">
            <input
              type="checkbox"
              name="size"
              className="mr-2 h-4 w-4  text-blue-500 focus:ring-blue-400 border-gray-400"
              value={size}
              onChange={handleFilterChange}
              checked={filters.size.includes(size)}
            />
            <span className="text-gray-700">{size}</span>
          </div>
        ))}
      </div>
      {/* price range filter */}
      <div className="mb-6">
        <label className="block text-gray-600 font-medium mb-6">
          Price range
        </label>
        <input
          type="range"
          name="priceRange"
          min={0}
          max={10000}
          value={priceRange[1]}
          onChange={handlePriceChange}
          className="w-full h-2 bg-gray-300 rounded-lg appearance-none"
        />
        <div className="flex justify-between text-gray-600 mt-2">
          <span className="">Rs 0</span>
          <span className="">Rs{priceRange[1]}</span>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;

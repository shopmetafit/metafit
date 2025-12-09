import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import meta from "../../assets/2meta.webp"
import acup from "../../assets/acup.webp"
import panch from "../../assets/panch.webp"
import respyr from "../../assets/respyr1.webp"
import proteinBite from "../../assets/proteinBite.png"
import { useNavigate } from "react-router-dom";
import {
  setFilters,
  fetchProductsByFilters,
} from "../../redux/slices/productSlice";

const CategoryGrid = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchProductsByFilters({ search: searchTerm }));
    navigate(`/collections/all/?search=${searchTerm}`);
  };

  const categories = [
    {
      name: "Yoga",
      image: meta,
      categoryAddress: "Yoga",
    },
    
    {
      name: "Protein Bite",
      image: proteinBite,
      categoryAddress: "Women",
    },
    {
      name: "Ayurveda",
      image: acup,
      categoryAddress: "jackets",
    },
   {
      name: "Accessories",
      image: panch,
      categoryAddress: "Accessories",
    },
    {
      name: "Respyr Device",
      image: respyr,
      categoryAddress: "Tracksuits",
    },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-2">
      {/* Search Input */}
      <form onSubmit={handleSearch}>
        <div className="mb-6">
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
            type="text"
            placeholder="Search categories..."
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </form>

      {/* Scrollable Row */}
      <div className="overflow-x-auto">
        <div className="flex justify-between space-x-6">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              to={`/collections/all/?search=${cat.categoryAddress}`}
              className="flex flex-col items-center min-w-[100px] group"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border border-gray-300 shadow-sm group-hover:border-black transition">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-800 group-hover:text-black transition text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;

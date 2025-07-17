import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import bottomMen from "../../assets/bottomMen.webp";
import collarTShirt from "../../assets/collarTShirt.webp";
import jacketMen from "../../assets/jacketMen.webp";
import t_shirt_man from "../../assets/t_shirt_man.webp";
import airForceCombat from "../../assets/airForceCombat.webp";
import FullSleeveMen from "../../assets/FullSleeveMen.webp";
import traksuits from "../../assets/traksuits.webp";
import WomenTights from "../../assets/WomanTights.webp";
import accessories from "../../assets/accessories.webp";
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
    // console.log("search Term:", searchTerm);
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchProductsByFilters({ search: searchTerm }));
    navigate(`/collections/all/?search=${searchTerm}`);
  };

  const categories = [
    {
      name: "T-Shirt",
      image: t_shirt_man,
      categoryAddress: "T shirt",
    },
    {
      name: "Full Sleeve",
      image: FullSleeveMen,
      categoryAddress: "Round Neck",
    },
    {
      name: "Collar T-Shirt",
      image: collarTShirt,
      categoryAddress: "Collar T-Shirt",
    },
    {
      name: "Bottom Wear Men",
      image:  bottomMen ,
      categoryAddress: "Bottom Wear Men",
    },
    {
      name: "Women",
      image: "https://picsum.photos/500/500?random=5",
      categoryAddress: "Women",
    },
    {
      name: "Jackets",
      image: jacketMen,
      categoryAddress: "jackets",
    },
    {
      name: "Women Bottom",
      image: WomenTights,
      categoryAddress: "Women Bottom",
    },
    {
      name: "Shoes",
      image: airForceCombat,
      categoryAddress: "Shoes",
    },
    {
      name: "Accessories",
      image: accessories,
      categoryAddress: "Accessories",
    },
    {
      name: "Tracksuits",
      image: traksuits,
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
        <div className="flex space-x-6">
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

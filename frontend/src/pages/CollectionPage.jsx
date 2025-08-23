import { useEffect, useState } from "react";
import { FaFilter } from "react-icons/fa";
import FilterSidebar from "../components/Products/FilterSidebar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductsByFilters,
  setFilters,
} from "../redux/slices/productSlice";
import { Truck, Shield, RotateCcw } from "lucide-react";

const categories = [
  { name: "All Products", link: "/collections/all" },
  { name: "Supplements", link: "/collections/all" },
  { name: "Yoga Equipment", link: "/collections/all" },
  { name: "Ayurvedic Products", link: "/collections/all" },
  { name: "Fitness Accessories", link: "/collections/all" },
  { name: "Aromatherapy", link: "/collections/all" },
  { name: "Wellness Books", link: "/collections/all" },
];

const CollectionPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const queryParams = Object.fromEntries([...searchParams]);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchProductsByFilters({ search: searchTerm }));
    navigate(`/collections/all/?search=${searchTerm}`);
  };

  useEffect(() => {
    dispatch(fetchProductsByFilters({ collection, ...queryParams }));
  }, [dispatch, collection, searchParams]);

  const handleClearFilters = () => {
    navigate(`/collections/all`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-teal-600 to-teal-700 text-white w-full">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-center lg:text-left">
            Wellness Products
          </h1>
          <p className="text-lg sm:text-2xl text-teal-100 mb-10 text-center lg:text-left">
            Premium quality wellness products for your healthy lifestyle journey
          </p>

          {/* Features */}
          <div className="flex flex-wrap gap-8 text-sm justify-center lg:justify-start mb-10">
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6" />
              <span>Free shipping over ₹999</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              <span>Quality guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-6 h-6" />
              <span>30-day returns</span>
            </div>
          </div>

          {/* Category Navbar */}
          <nav className="overflow-x-auto flex items-center gap-4 py-3 px-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={cat.link}
                className="flex-shrink-0 px-6 py-3 rounded-full text-gray-800 font-semibold hover:bg-teal-600 hover:text-white transition"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-4xl mx-auto px-6 py-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full p-4 border border-gray-300 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
        />
      </form>

      {/* Mobile Filter Button */}
      <div className="lg:hidden px-6 mb-4">
        <button
          onClick={() => setIsSideBarOpen(!isSideBarOpen)}
          className="w-full flex items-center justify-center gap-2 bg-black text-white p-3 rounded-full shadow"
        >
          <FaFilter /> <span>Filters</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-6 pb-12 gap-6">
        {/* Sidebar */}
        <div
          className={`bg-white lg:w-64 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] 
  p-6 rounded-lg shadow-md flex flex-col transition-all duration-300 ease-in-out
  ${isSideBarOpen ? "max-h-screen" : "max-h-0 overflow-hidden lg:max-h-full"}`}
        >
          {/* Scrollable filters */}
          <div className="flex-1 overflow-y-auto">
            <FilterSidebar />
          </div>

          {/* Clear button pinned bottom */}
          <div className="pt-4 border-t mt-4">
            <button
              onClick={handleClearFilters}
              className="w-full bg-transparent text-gray-900 font-semibold rounded-full py-3 uppercase tracking-wide border border-gray-700 hover:bg-teal-600 hover:text-white transition"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <SortOptions />
          <ProductGrid products={products} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
};

export default CollectionPage;

// import { useEffect, useRef, useState } from "react";
// import { FaFilter } from "react-icons/fa";
// import FilterSidebar from "../components/Products/FilterSidebar";
// import SortOptions from "../components/Products/SortOptions";
// import ProductGrid from "../components/Products/ProductGrid";
// import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchProductsByFilters } from "../redux/slices/productSlice";
// import { IoMdClose } from "react-icons/io";
// import { Truck, Shield, RotateCcw } from "lucide-react";

// const CollectionPage = () => {
//   const navigate = useNavigate();
//   const { collection } = useParams();
//   const [searchParams] = useSearchParams();
//   const dispatch = useDispatch();
//   const { products, loading, error } = useSelector((state) => state.products);
//   const queryParams = Object.fromEntries([...searchParams]);

//   const sideBarRef = useRef(null);
//   // console.log("colPg20",sideBarRef.current);
//   const [isSideBarOpen, setIsSideBarOpen] = useState(false);

//   const touchStartX = useRef(0);
//   const touchEndX = useRef(0);

//   const handleTouchStart = (e) => {
//     touchStartX.current = e.touches[0].clientX;
//   };

//   const handleTouchMove = (e) => {
//     touchEndX.current = e.touches[0].clientX;
//   };

//   const handleTouchEnd = () => {
//     const deltaX = touchStartX.current - touchEndX.current;
//     if (deltaX > 50) {
//       // Swiped left
//       setIsSideBarOpen(false);
//     }
//   };

//   useEffect(() => {
//     dispatch(fetchProductsByFilters({ collection, ...queryParams }));
//   }, [dispatch, collection, searchParams]);

//   const toggleSideBAr = () => {
//     setIsSideBarOpen(!isSideBarOpen);
//   };

//   const handleClickOutSide = (e) => {
//     // console.log("collectonoage line 50",e.target);
//     // console.log("collectonoage line 51",sideBarRef.current.contains(e.target));
//     // console.log("collectonoage line 52",sideBarRef.current);
//     if (sideBarRef.current && !sideBarRef.current.contains(e.target)) {
//       // console.log("collectonoage line 54", sideBarRef.current.contains(e.target));
//       setIsSideBarOpen(false);
//     }
//   };

//   useEffect(() => {
//     // add event listner for clicks
//     document.addEventListener("mousedown", handleClickOutSide);
//     // clean event listner
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutSide);
//     };
//   }, []);

//   const handleClearFilters = () => {
//     navigate(`/collections/all`);
//   };

//   return (
//     <div>
//       <div className="flex flex-col min-h-screen relative">
//         {/* ✅ Wellness Products Header */}
//         <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white w-full">
//           <div className="px-4 py-12 max-w-7xl mx-auto">
//             <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center lg:text-left">
//               Wellness Products
//             </h1>
//             <p className="text-lg sm:text-xl text-teal-100 mb-8 text-center lg:text-left">
//               Premium quality wellness products for your healthy lifestyle
//               journey
//             </p>

//             <div className="flex flex-wrap gap-6 text-sm justify-center lg:justify-between">
//               <div className="flex items-center gap-2">
//                 <Truck className="w-5 h-5" />
//                 <span>Free shipping over ₹999</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Shield className="w-5 h-5" />
//                 <span>Quality guaranteed</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <RotateCcw className="w-5 h-5" />
//                 <span>30-day returns</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Mobile Filter Button */}
//         <div className="lg:hidden p-4 bg-white border-b sticky top-0 z-40">
//           <button
//             onClick={() => setIsSideBarOpen(!isSideBarOpen)}
//             className="w-full flex items-center justify-center gap-2 bg-black text-white p-2 rounded"
//           >
//             <FaFilter /> <span>Filters</span>
//           </button>
//         </div>

//         {/* Sidebar (now stacked under header on all screens) */}
//         <div
//           className={`bg-white overflow-y-auto transition-transform duration-300 ease-in-out
//       ${
//         isSideBarOpen ? "max-h-screen" : "max-h-0 overflow-hidden"
//       } lg:max-h-screen`}
//         >
//           <div className="p-4 border-b">
//             <FilterSidebar />
//           </div>

//           <div className="p-4 border-b">
//             <button
//               onClick={() => navigate(`/collections/all`)}
//               className="w-full bg-transparent text-gray-900 font-semibold rounded-md py-2.5 uppercase tracking-wide border border-gray-700 hover:bg-gray-800 hover:text-white transition duration-300 ease-in-out"
//             >
//               Clear All Filters
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-grow p-4 lg:p-6">
//           <h2 className="text-2xl uppercase mb-4 text-center lg:text-left">
//             All Collection
//           </h2>

//           {/* Sort Options */}
//           <div className="mb-4">
//             <SortOptions />
//           </div>

//           {/* Product Grid */}
//           <ProductGrid products={products} loading={loading} error={error} />
//         </div>
//       </div>

//       <div className="flex flex-col lg:flex-row min-h-screen relative">
//         {/* Mobile Filter Button */}
//         <div className="lg:hidden p-4 bg-white border-b sticky top-0 z-40">
//           <button
//             onClick={toggleSideBAr}
//             className="w-full flex items-center justify-center gap-2 bg-black text-white p-2 rounded"
//           >
//             <FaFilter /> <span>Filters</span>
//           </button>
//         </div>

//         {/* Sidebar (Hidden on mobile, visible on large screens) */}
//         <div
//           ref={sideBarRef}
//           onTouchStart={handleTouchStart}
//           onTouchMove={handleTouchMove}
//           onTouchEnd={handleTouchEnd}
//           className={`
//       bg-white overflow-y-auto transition-transform duration-300 ease-in-out
//       fixed inset-y-0 left-0 w-64 z-50 transform
//       ${isSideBarOpen ? "translate-x-0" : "-translate-x-full"}
//       lg:static lg:translate-x-0 lg:z-auto lg:flex-shrink-0 lg:h-auto
//     `}
//         >
//           {/* Mobile Close Button */}
//           <div className="flex justify-end p-4 lg:hidden">
//             <button
//               onClick={toggleSideBAr}
//               className="text-gray-600 hover:text-black text-2xl"
//               aria-label="Close filter sidebar"
//             >
//               <IoMdClose />
//             </button>
//           </div>

//           <FilterSidebar />

//           <div className="p-4 border-b">
//             <button
//               onClick={handleClearFilters}
//               className="
//       w-full
//       bg-transparent
//       text-gray-900
//       font-semibold
//       rounded-md
//       py-2.5
//       uppercase
//       tracking-wide
//       border border-gray-700
//       hover:bg-gray-800
//       hover:text-white
//       transition
//       duration-300
//       ease-in-out
//       focus:outline-none
//       focus:ring-2
//       focus:ring-gray-500
//       focus:ring-offset-1
//       shadow-sm
//       select-none
//     "
//             >
//               Clear All Filters
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-grow p-4">
//           <h2 className="text-2xl uppercase mb-4">All Collection</h2>

//           {/* Sort Options */}
//           <div className="mb-4">
//             <SortOptions />
//           </div>

//           {/* Product Grid */}
//           <ProductGrid products={products} loading={loading} error={error} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CollectionPage;

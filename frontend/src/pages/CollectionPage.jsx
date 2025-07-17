import { useEffect, useRef, useState } from "react";
import { FaFilter } from "react-icons/fa";
import FilterSidebar from "../components/Products/FilterSidebar";
import SortOptions from "../components/Products/SortOptions";
import ProductGrid from "../components/Products/ProductGrid";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productSlice";
import { IoMdClose } from "react-icons/io";

const CollectionPage = () => {
  const navigate = useNavigate();
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const queryParams = Object.fromEntries([...searchParams]);

  const sideBarRef = useRef(null);
  // console.log("colPg20",sideBarRef.current);
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    if (deltaX > 50) {
      // Swiped left
      setIsSideBarOpen(false);
    }
  };

  useEffect(() => {
    dispatch(fetchProductsByFilters({ collection, ...queryParams }));
  }, [dispatch, collection, searchParams]);

  const toggleSideBAr = () => {
    setIsSideBarOpen(!isSideBarOpen);
  };

  const handleClickOutSide = (e) => {
    // console.log("collectonoage line 50",e.target);
    // console.log("collectonoage line 51",sideBarRef.current.contains(e.target));
    // console.log("collectonoage line 52",sideBarRef.current);
    if (sideBarRef.current && !sideBarRef.current.contains(e.target)) {
      // console.log("collectonoage line 54", sideBarRef.current.contains(e.target));
      setIsSideBarOpen(false);
    }
  };

  useEffect(() => {
    // add event listner for clicks
    document.addEventListener("mousedown", handleClickOutSide);
    // clean event listner
    return () => {
      document.removeEventListener("mousedown", handleClickOutSide);
    };
  }, []);

  const handleClearFilters = () => {
    navigate(`/collections/all`);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen relative">
      {/* Mobile Filter Button */}
      <div className="lg:hidden p-4 bg-white border-b sticky top-0 z-40">
        <button
          onClick={toggleSideBAr}
          className="w-full flex items-center justify-center gap-2 bg-black text-white p-2 rounded"
        >
          <FaFilter /> <span>Filters</span>
        </button>
      </div>

      {/* Sidebar (Hidden on mobile, visible on large screens) */}
      <div
        ref={sideBarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
      bg-white overflow-y-auto transition-transform duration-300 ease-in-out
      fixed inset-y-0 left-0 w-64 z-50 transform
      ${isSideBarOpen ? "translate-x-0" : "-translate-x-full"}
      lg:static lg:translate-x-0 lg:z-auto lg:flex-shrink-0 lg:h-auto
    `}
      >
        {/* Mobile Close Button */}
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={toggleSideBAr}
            className="text-gray-600 hover:text-black text-2xl"
            aria-label="Close filter sidebar"
          >
            <IoMdClose />
          </button>
        </div>

        <FilterSidebar />

        <div className="p-4 border-b">
          <button
            onClick={handleClearFilters}
            className="
      w-full
      bg-transparent
      text-gray-900
      font-semibold
      rounded-md
      py-2.5
      uppercase
      tracking-wide
      border border-gray-700
      hover:bg-gray-800
      hover:text-white
      transition
      duration-300
      ease-in-out
      focus:outline-none
      focus:ring-2
      focus:ring-gray-500
      focus:ring-offset-1
      shadow-sm
      select-none
    "
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-4">
        <h2 className="text-2xl uppercase mb-4">All Collection</h2>

        {/* Sort Options */}
        <div className="mb-4">
          <SortOptions />
        </div>

        {/* Product Grid */}
        <ProductGrid products={products} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default CollectionPage;

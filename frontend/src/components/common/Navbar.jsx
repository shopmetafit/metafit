import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiBars3BottomRight,
} from "react-icons/hi2";
import SearchBar from "./SearchBar";
import CartDrawer from "../Layout/CartDrawer";
import { IoMdClose } from "react-icons/io";
import { useSelector } from "react-redux";

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const cartItemCount =
    cart?.products?.reduce((total, product) => total + product.quantity, 0) ||
    0;
  const togglerNavDrawer = () => {
    setNavDrawerOpen(!navDrawerOpen);
  };

  const togglerCartOpen = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
      <nav className="container mx-auto flex items-center justify-between py-4 px-6 ">
        <div>
          <Link to="/" className="text-2xl font-medium">
            M Wellness Bazaar
          </Link>
        </div>
        {/* // center navigation */}
        <div className="hidden md:flex space-x-6 ">
          <Link
            to="/collections/all?"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Protein Bite
          </Link>
          <Link
            to="/collections/all?"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Yoga
          </Link>
          <Link
            to="/collections/all?"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Ayurveda
          </Link>
          <Link
            to="/collections/all?"
            className="text-gray-700 hover:text-black text-sm font-medium uppercase"
          >
            Diet
          </Link>
        </div>
        {/* right icons */}
        <div className="flex items-center space-x-4">
          {user && user.role === "admin" && (
            <Link
              to="/admin"
              className="block bg-black text-white px-2 mx-2 rounded text-sm"
            >
              Admin
            </Link>
          )}

          <Link to="/profile" className="hover:text-black">
            <HiOutlineUser className="h-6 w-6 text-gray-700 " />
          </Link>

          {/* cart-button */}
          <button
            onClick={togglerCartOpen}
            className="relative hover:text-black"
          >
            <HiOutlineShoppingBag className="h-6 w-6 text-gray-700" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 bg-rabbit-red text-white text-xs rounded-full px-2 py-0.5">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* search */}
          <div className="overflow-hidden">
            <SearchBar />
          </div>
          <button onClick={togglerNavDrawer} className="md:hidden">
            <HiBars3BottomRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </nav>

      <CartDrawer drawerOpen={drawerOpen} togglerCartOpen={togglerCartOpen} />

      {/* mobile- navigation */}
      <div
        className={`fixed bg-white top-0 left-0  w-3/4  sm:w-1/2 md:w-1/3 h-full shadow-lg transform  transition-transform duration-300 z-50 ${
          navDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4 ">
          <button onClick={togglerNavDrawer}>
            <IoMdClose className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-semibold underline text-gray-600 ">
            Menu
          </h2>
          <nav className="space-y-6 mt-6">
            <Link
              to="/collections/all?gender=Men"
              onClick={togglerNavDrawer}
              className="block text-gray-600 hover:text-black"
            >
              Protein Bite
            </Link>
            <Link
              to="/collections/all?gender=Women"
              onClick={togglerNavDrawer}
              className="block text-gray-600 hover:text-black"
            >
              Yoga
            </Link>
            <Link
              to="/collections/all?category=Top Wear"
              onClick={togglerNavDrawer}
              className="block text-gray-600 hover:text-black"
            >
              Ayurveda
            </Link>
            <Link
              to="/collections/all?category=Bottom Wear"
              onClick={togglerNavDrawer}
              className="block text-gray-600 hover:text-black"
            >
              Diet
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navbar;

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, ShoppingCart, MessageCircle } from 'lucide-react';
import CartDrawer from '../Layout/CartDrawer';

const Topbar = () => {
  const { user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const cartItemCount = cart?.products?.reduce((total, p) => total + p.quantity, 0) || 0;

  const categories = [
    'All', 'Supplements', 'Wellness Devices', 'Organic Products',
    'Yoga & Fitness', 'Herbal Care', 'Personal Care',
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/collections/all${searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <>
      {/* Amazon-style Main Header */}
      <div className="bg-[#022824] text-white">
        <div className="max-w-screen-2xl mx-auto px-3 py-2.5 flex items-center gap-2 lg:gap-4">

          {/* Delivery Location - Desktop only */}
          <div className="hidden lg:flex flex-col items-start flex-shrink-0 hover:ring-1 hover:ring-white rounded px-1 py-0.5 cursor-pointer">
            <span className="text-xs text-gray-300 leading-tight">Deliver to</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-bold">India</span>
            </div>
          </div>

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:ring-1 hover:ring-white rounded px-2 py-1 flex-shrink-0 group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg transition-all group-hover:shadow-teal-400/40">
              <span className="text-white font-black text-lg">M</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-[15px] font-black text-white">M Wellness</div>
              <div className="text-xs text-teal-300 font-semibold -mt-0.5">Bazaar</div>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 rounded-md overflow-hidden shadow-sm min-w-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-100 text-gray-700 text-xs font-medium px-2 border-r border-gray-200 cursor-pointer focus:outline-none hover:bg-gray-200 transition-colors flex-shrink-0"
              style={{ maxWidth: '110px' }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wellness products, supplements, devices..."
              className="flex-1 min-w-0 px-4 py-2.5 text-sm text-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#0FB7A3] hover:bg-[#0DA28E] px-4 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <Search className="h-5 w-5 text-white" />
            </button>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-1 md:gap-1.5 ml-auto md:ml-0">

            {/* Mobile Search */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden p-2 hover:ring-1 hover:ring-white rounded transition-all"
              aria-label="Search"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* WhatsApp - Desktop */}
            <a
              href="https://wa.me/918302270668?text=Hello!%20I%20would%20like%20to%20know%20more%20about%20your%20wellness%20products."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-1.5 hover:ring-1 hover:ring-white rounded px-2 py-1 flex-shrink-0 transition-all"
            >
              <MessageCircle className="h-5 w-5 text-green-400" />
              <span className="text-xs font-medium">WhatsApp</span>
            </a>

            {/* Account & Lists */}
            <Link
              to="/profile"
              className="hidden md:flex flex-col hover:ring-1 hover:ring-white rounded px-2 py-1 flex-shrink-0 transition-all"
            >
              <span className="text-xs text-gray-300 leading-tight">
                Hello, {user ? user.name?.split(' ')[0] : 'Sign in'}
              </span>
              <div className="flex items-center gap-0.5">
                <span className="text-sm font-bold whitespace-nowrap">Account & Lists</span>
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </div>
            </Link>

            {/* Returns & Orders */}
            <Link
              to="/my-orders"
              className="hidden lg:flex flex-col hover:ring-1 hover:ring-white rounded px-2 py-1 flex-shrink-0 transition-all"
            >
              <span className="text-xs text-gray-300 leading-tight">Returns</span>
              <span className="text-sm font-bold whitespace-nowrap">& Orders</span>
            </Link>

            {/* Cart */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1 hover:ring-1 hover:ring-white rounded px-2 py-1 flex-shrink-0 transition-all"
              aria-label="Cart"
            >
              <div className="relative">
                <ShoppingCart className="h-8 w-8" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 left-4 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 leading-none">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-sm font-bold">Cart</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden px-3 pb-3">
            <form onSubmit={handleSearch} className="flex rounded-md overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wellness products..."
                className="flex-1 px-3 py-2.5 text-sm text-gray-900 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="bg-[#0FB7A3] hover:bg-[#0DA28E] px-4 flex items-center justify-center transition-colors"
              >
                <Search className="h-5 w-5 text-white" />
              </button>
            </form>
          </div>
        )}
      </div>

      <CartDrawer drawerOpen={drawerOpen} togglerCartOpen={() => setDrawerOpen(false)} />
    </>
  );
};

export default Topbar;

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
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(localStorage.getItem('userLocation') || 'India');
  const [locationInput, setLocationInput] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const cartItemCount = cart?.products?.reduce((total, p) => total + p.quantity, 0) || 0;

  const categories = [
    'All', 'Supplements', 'Wellness Devices', 'Organic Products',
    'Yoga & Fitness', 'Herbal Care', 'Personal Care',
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/collections/all${searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  const fetchLocation = () => {
    if ('geolocation' in navigator) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.state || 'Unknown Location';
            setUserLocation(city);
            localStorage.setItem('userLocation', city);
            setLocationModalOpen(false);
            navigate(`/collections/all?location=${encodeURIComponent(city)}`);
          } catch (error) {
            console.error("Error fetching location details:", error);
            alert("Failed to get location details.");
          } finally {
            setIsFetchingLocation(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Permission denied or unable to fetch location.");
          setIsFetchingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleManualLocationSubmit = (e) => {
    e.preventDefault();
    if (locationInput.trim()) {
      setUserLocation(locationInput.trim());
      localStorage.setItem('userLocation', locationInput.trim());
      setLocationModalOpen(false);
      navigate(`/collections/all?location=${encodeURIComponent(locationInput.trim())}`);
    }
  };

  const handleRemoveLocation = () => {
    setUserLocation('India');
    localStorage.removeItem('userLocation');
    setLocationModalOpen(false);
    navigate(`/collections/all`);
  };

  return (
    <>
      {/* Amazon-style Main Header */}
      <div className="bg-[#022824] text-white">
        <div className="max-w-screen-2xl mx-auto px-3 py-2.5 flex items-center gap-2 lg:gap-4">

          {/* Delivery Location - Desktop only */}
          <div 
            onClick={() => {
              setLocationInput('');
              setLocationModalOpen(true);
            }}
            className="hidden lg:flex flex-col items-start flex-shrink-0 hover:ring-1 hover:ring-white rounded px-1 py-0.5 cursor-pointer"
          >
            <span className="text-xs text-gray-300 leading-tight">Deliver to</span>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-bold truncate max-w-[120px]">{userLocation}</span>
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
            <div className="leading-tight">
              <div className="text-[13px] sm:text-[15px] font-black text-white whitespace-nowrap">M Wellness</div>
              <div className="text-[9px] sm:text-xs text-teal-300 font-semibold -mt-0.5">Bazaar</div>
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

      {/* Location Modal */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setLocationModalOpen(false)}
          />
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden flex flex-col">
            <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Choose your location</h3>
              <button onClick={() => setLocationModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <p className="text-sm text-gray-600">
                Delivery options and delivery speeds may vary for different locations.
              </p>
              
              <button 
                onClick={fetchLocation}
                disabled={isFetchingLocation}
                className="w-full flex items-center justify-center gap-2 bg-[#e8f4f8] hover:bg-[#d0ebf4] text-[#047ca8] font-semibold py-2.5 rounded-lg border border-[#b3d9e8] transition-colors"
              >
                <MapPin className="h-4 w-4" />
                {isFetchingLocation ? "Fetching location..." : "Fetch My Location"}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-medium">Or enter manually</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <form onSubmit={handleManualLocationSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Enter city or pin code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047ca8]"
                />
                <button 
                  type="submit"
                  className="bg-[#232f3e] hover:bg-[#37475a] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Apply
                </button>
              </form>

              {userLocation !== 'India' && (
                <button 
                  onClick={handleRemoveLocation}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded-lg border border-red-200 transition-colors"
                >
                  Remove Current Location
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;

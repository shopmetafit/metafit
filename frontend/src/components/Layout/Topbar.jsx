import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, ShoppingCart, Heart } from 'lucide-react';
import axios from 'axios';
import CartDrawer from '../Layout/CartDrawer';
import { fetchWishlist } from '../../redux/slices/wishlistSlice';

const Topbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cart } = useSelector((state) => state.cart);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState('cart');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(localStorage.getItem('userLocation') || 'India');
  const [locationInput, setLocationInput] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Live Search State & Cache Refs
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recent_searches') || '[]');
    } catch {
      return [];
    }
  });

  const trendingSearches = ['Protein Powder', 'Ashwagandha', 'Shilajit', 'Vitamin D3', 'Multivitamin'];

  const browserSearchCacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);

  const wishlist = useSelector((state) => state.wishlist || { products: [] });
  const wishlistCount = wishlist?.products?.length || 0;
  const cartItemCount = cart?.products?.reduce((total, p) => total + p.quantity, 0) || 0;

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, user]);

  // Save query to Recent Searches (Item #15)
  const saveRecentSearch = (queryStr) => {
    const trimmed = String(queryStr || "").trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('recent_searches', JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save recent searches:", err);
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  // Record Search Suggestion Click for Analytics (Item #16)
  const recordSuggestionClick = (productId) => {
    if (!productId) return;
    axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/products/search-analytics/click`, { productId }).catch(() => {});
  };

  // Item #13: Text Highlighting Helper
  const highlightMatch = (text, query) => {
    if (!text) return "";
    if (!query || query.trim().length === 0) return text;

    const trimmedQ = query.trim().toLowerCase();
    const strText = String(text);
    const index = strText.toLowerCase().indexOf(trimmedQ);

    if (index === -1) return strText;

    const before = strText.substring(0, index);
    const match = strText.substring(index, index + trimmedQ.length);
    const after = strText.substring(index + trimmedQ.length);

    return (
      <>
        {before}
        <span className="font-extrabold text-teal-800 bg-teal-100/70 px-0.5 rounded">{match}</span>
        {after}
      </>
    );
  };

  // Helper for Browser Cache Map with TTL Expiry (Item #3) & Max 500 Entry LRU (Item #6)
  const BROWSER_CACHE_TTL_MS = 5 * 60 * 1000;
  const BROWSER_CACHE_MAX_SIZE = 500;

  const getFromBrowserCache = (map, key) => {
    const entry = map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      map.delete(key);
      return null;
    }
    return entry.data;
  };

  const setInBrowserCache = (map, key, data) => {
    if (map.size >= BROWSER_CACHE_MAX_SIZE) {
      const oldestKey = map.keys().next().value;
      if (oldestKey) map.delete(oldestKey);
    }
    map.set(key, { data, expiresAt: Date.now() + BROWSER_CACHE_TTL_MS });
  };

  // Live Search Effect: 300ms Debounce + Min 3 Chars + Instant Local Filtering + Request Abort
  useEffect(() => {
    // Items #5 & #11: Normalize whitespace and query
    const trimmed = searchQuery.trim().toLowerCase().replace(/\s+/g, " ");

    if (trimmed.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    const cacheKey = trimmed;

    // 1. Check Exact Browser Cache (Map)
    const cachedExact = getFromBrowserCache(browserSearchCacheRef.current, cacheKey);
    if (cachedExact) {
      setSuggestions(cachedExact);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      return;
    }

    // Item #7: Instant Local Filtering (Filter matching prefix cache immediately while request is in flight)
    let localFiltered = [];
    for (let len = trimmed.length - 1; len >= 3; len--) {
      const prefixKey = trimmed.substring(0, len);
      const cachedPrefix = getFromBrowserCache(browserSearchCacheRef.current, prefixKey);
      if (cachedPrefix && cachedPrefix.length > 0) {
        localFiltered = cachedPrefix.filter((item) => {
          const itemText = `${item.name} ${item.category} ${item.subCategory} ${item.brand} ${item.wellnessGoal}`.toLowerCase();
          return itemText.includes(trimmed);
        });
        if (localFiltered.length > 0) {
          setSuggestions(localFiltered);
          setShowSuggestions(true);
          break;
        }
      }
    }

    // 2. 300ms Debounce
    const timer = setTimeout(async () => {
      // 3. Abort Previous In-flight Request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        if (localFiltered.length === 0) {
          setIsLoadingSuggestions(true);
        }
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/search-suggestions?q=${encodeURIComponent(trimmed)}`,
          { signal: abortControllerRef.current.signal }
        );

        const results = res.data?.suggestions || [];

        // Store in Browser Cache Map
        setInBrowserCache(browserSearchCacheRef.current, cacheKey, results);

        setSuggestions(results);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Search suggestion error:", err);
        }
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Click outside listener to close search dropdown (handles both Desktop & Mobile containers)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideDesktop = searchContainerRef.current && searchContainerRef.current.contains(event.target);
      const isInsideMobile = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(event.target);
      if (!isInsideDesktop && !isInsideMobile) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Item #9: Keyboard Navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        const item = suggestions[selectedIndex];
        setShowSuggestions(false);
        setSelectedIndex(-1);
        // Item #10: Do NOT clear searchQuery when product is selected
        navigate(`/product/${item._id}`);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    setSelectedIndex(-1);
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
          <div ref={searchContainerRef} className="hidden md:flex relative flex-1 min-w-0">
            <form onSubmit={handleSearch} className="flex w-full rounded-md overflow-hidden shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search products by name, category, subcategory, wellness tags..."
                className="flex-1 min-w-0 px-4 py-2.5 text-sm text-gray-900 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#0FB7A3] hover:bg-[#0DA28E] px-4 transition-colors flex items-center justify-center flex-shrink-0"
              >
                <Search className="h-5 w-5 text-white" />
              </button>
            </form>

            {/* Live Suggestions & Trending / Recent Overlay */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto font-sans text-gray-800">
                {searchQuery.trim().length === 0 ? (
                  <div className="p-3 space-y-4">
                    {/* Item #15: Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                          <span>Recent Searches</span>
                          <button
                            onClick={clearRecentSearches}
                            className="text-[10px] text-rose-500 hover:underline capitalize"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {recentSearches.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => {
                                setSearchQuery(term);
                                saveRecentSearch(term);
                                navigate(`/collections/all?search=${encodeURIComponent(term)}`);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
                            >
                              <span className="text-gray-400">🕒</span>
                              <span>{term}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Item #14: Trending Searches */}
                    <div>
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        🔥 Trending Searches
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {trendingSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setSearchQuery(term);
                              saveRecentSearch(term);
                              navigate(`/collections/all?search=${encodeURIComponent(term)}`);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs bg-teal-50/70 hover:bg-teal-100 text-teal-800 font-medium px-3 py-1.5 rounded-full border border-teal-200/60 transition-colors"
                          >
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : isLoadingSuggestions && suggestions.length === 0 ? (
                  /* Item #8: Loading Skeletons */
                  <div className="p-2 space-y-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                          <div className="h-2.5 bg-gray-150 rounded w-1/2" />
                        </div>
                        <div className="w-12 h-3 bg-gray-200 rounded flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">
                    No wellness products found for <span className="font-semibold text-gray-700">"{searchQuery}"</span>
                  </div>
                ) : (
                  <div>
                    <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <span>Product Suggestions ({suggestions.length})</span>
                      <span className="text-[10px] text-teal-600 font-medium">Use ↑ ↓ to navigate</span>
                    </div>
                    {suggestions.map((item, idx) => (
                      <div
                        key={item._id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSelectedIndex(-1);
                          // Items #15 & #16: Save recent search & click analytics
                          saveRecentSearch(searchQuery);
                          recordSuggestionClick(item._id);
                          // Item #10: Do NOT clear searchQuery when product is selected
                          navigate(`/product/${item._id}`);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 hover:bg-teal-50/70 cursor-pointer border-b border-gray-100 transition-colors group ${
                          selectedIndex === idx ? "bg-teal-100/80 font-bold border-l-4 border-l-teal-600 pl-2" : ""
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <span className="text-xs text-gray-400 font-bold">M</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-teal-700 transition-colors">
                            {/* Item #13: Highlighted text */}
                            {highlightMatch(item.name, searchQuery)}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5 flex-wrap">
                            {item.category && (
                              <span className="bg-teal-50 text-teal-700 font-medium px-1.5 py-0.5 rounded border border-teal-200/50">
                                {highlightMatch(item.category, searchQuery)}
                              </span>
                            )}
                            {item.subCategory && (
                              <span className="text-gray-400">› {highlightMatch(item.subCategory, searchQuery)}</span>
                            )}
                            {item.brand && (
                              <span className="text-slate-500 font-medium">• {highlightMatch(item.brand, searchQuery)}</span>
                            )}
                            {item.wellnessGoal && (
                              <span className="bg-amber-50 text-amber-700 font-medium px-1.5 py-0.5 rounded border border-amber-200/50">
                                {highlightMatch(item.wellnessGoal, searchQuery)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-bold text-gray-900">
                            ₹{item.discountedPrice || item.price}
                          </span>
                          {item.discountedPrice && item.discountedPrice < item.price && (
                            <span className="block text-[10px] text-gray-400 line-through">
                              ₹{item.price}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

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


            {/* Account & Lists */}
            <Link
              to="/profile"
              className="hidden md:flex flex-col hover:ring-1 hover:ring-white rounded px-2 py-1 flex-shrink-0 transition-all"
            >
              <span className="text-xs text-gray-300 leading-tight">
                Hello, {user ? user.name?.split(' ')[0] : 'Sign in'}
              </span>
              <div className="flex items-center gap-0.5">
                <span className="text-xs font-bold leading-tight">Account & Lists</span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </Link>

            {/* Orders */}
            <Link
              to="/my-orders"
              className="hidden md:flex flex-col hover:ring-1 hover:ring-white rounded px-2 py-1 flex-shrink-0 transition-all"
            >
              <span className="text-xs text-gray-300 leading-tight">Returns</span>
              <span className="text-xs font-bold leading-tight">& Orders</span>
            </Link>

            {/* Wishlist */}
            <Link
              to="/profile?tab=wishlist"
              className="flex items-center gap-1.5 hover:ring-1 hover:ring-white rounded-lg px-2 py-1 flex-shrink-0 relative transition-all group"
            >
              <div className="relative flex items-center justify-center p-0.5">
                <Heart className="h-6 w-6 text-white group-hover:scale-105 transition-transform" strokeWidth={1.75} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-[#022824] shadow-md leading-none">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-xs font-bold leading-none text-white">Wishlist</span>
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => {
                setActiveDrawerTab('cart');
                setDrawerOpen(true);
              }}
              className="flex items-center gap-1.5 hover:ring-1 hover:ring-white rounded-lg px-2 py-1 flex-shrink-0 relative transition-all group"
            >
              <div className="relative flex items-center justify-center p-0.5">
                <ShoppingCart className="h-7 w-7 text-white group-hover:scale-105 transition-transform" strokeWidth={1.75} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-amber-400 text-slate-950 text-[11px] font-black rounded-full min-w-[20px] h-[20px] px-1 flex items-center justify-center border-2 border-[#022824] shadow-md leading-none">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-xs font-bold leading-none text-white">Cart</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {mobileSearchOpen && (
          <div ref={mobileSearchContainerRef} className="md:hidden px-3 pb-3 relative">
            <form onSubmit={handleSearch} className="flex rounded-md overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
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

            {/* Mobile Suggestions & Trending / Recent Overlay */}
            {showSuggestions && (
              <div className="absolute top-full left-3 right-3 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto font-sans text-gray-800">
                {searchQuery.trim().length === 0 ? (
                  <div className="p-3 space-y-3">
                    {/* Item #15: Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
                          <span>Recent Searches</span>
                          <button
                            onClick={clearRecentSearches}
                            className="text-[10px] text-rose-500 hover:underline capitalize"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {recentSearches.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => {
                                setSearchQuery(term);
                                saveRecentSearch(term);
                                setMobileSearchOpen(false);
                                navigate(`/collections/all?search=${encodeURIComponent(term)}`);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200"
                            >
                              <span>🕒</span>
                              <span>{term}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Item #14: Trending Searches */}
                    <div>
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
                        🔥 Trending
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {trendingSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setSearchQuery(term);
                              saveRecentSearch(term);
                              setMobileSearchOpen(false);
                              navigate(`/collections/all?search=${encodeURIComponent(term)}`);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] bg-teal-50 text-teal-800 font-medium px-2.5 py-1 rounded-full border border-teal-200/60"
                          >
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : isLoadingSuggestions && suggestions.length === 0 ? (
                  /* Item #8 & #12: Mobile Skeleton Rows */
                  <div className="p-2 space-y-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex items-center gap-2.5 px-3 py-2 animate-pulse">
                        <div className="w-8 h-8 rounded bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                          <div className="h-2 bg-gray-150 rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-500">No products found</div>
                ) : (
                  <div>
                    {suggestions.map((item, idx) => (
                      <div
                        key={item._id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSelectedIndex(-1);
                          saveRecentSearch(searchQuery);
                          recordSuggestionClick(item._id);
                          setMobileSearchOpen(false);
                          // Item #10: Do NOT clear searchQuery when product is selected
                          navigate(`/product/${item._id}`);
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 hover:bg-teal-50 ${
                          selectedIndex === idx ? "bg-teal-100 font-bold border-l-4 border-l-teal-600 pl-2" : ""
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold">M</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {/* Item #13: Highlighted matching text */}
                            {highlightMatch(item.name, searchQuery)}
                          </p>
                          <p className="text-[10px] text-teal-600 truncate">
                            {highlightMatch(item.category, searchQuery)}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-gray-900">₹{item.discountedPrice || item.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <CartDrawer drawerOpen={drawerOpen} togglerCartOpen={() => setDrawerOpen(false)} activeTab={activeDrawerTab} setActiveTab={setActiveDrawerTab} />

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

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchWishlist } from "../redux/slices/wishlistSlice";
import ProductGrid from "../components/Products/ProductGrid";
import {
  Heart,
  ChevronRight,
  ShoppingBag,
  Loader2,
  Package,
  MapPin,
  User,
} from "lucide-react";

const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const wishlistState = useSelector(
    (state) => state.wishlist || { products: [], loading: false }
  );
  const wishlistProducts = wishlistState?.products || [];
  const wishlistLoading = wishlistState?.loading || false;

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      dispatch(fetchWishlist());
    }
  }, [user, navigate, dispatch]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-gray-800 antialiased py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ── Breadcrumb Navigation ── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-4 overflow-x-auto whitespace-nowrap"
        >
          <Link to="/" className="hover:text-[#022824] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
          <Link to="/profile" className="hover:text-[#022824] transition-colors">
            My Account
          </Link>
          <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
          <span className="text-gray-900 font-semibold">My Wishlist</span>
        </nav>

        {/* ── Top Account Navigation Tabs ── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-1 sm:p-1.5 mb-4 sm:mb-6 grid grid-cols-4 gap-1 sm:flex sm:items-center sm:gap-1">
          <Link
            to="/profile"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
          >
            <User className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="hidden sm:inline">Profile Information</span>
            <span className="sm:hidden font-medium">Profile</span>
          </Link>
          <Link
            to="/my-orders"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
          >
            <Package className="w-4 h-4 text-[#047ca8] shrink-0" />
            <span className="hidden sm:inline">My Orders</span>
            <span className="sm:hidden font-medium">Orders</span>
          </Link>
          <Link
            to="/my-addresses"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
          >
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Saved Addresses</span>
            <span className="sm:hidden font-medium">Addresses</span>
          </Link>
          <Link
            to="/wishlist"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1 sm:px-4 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-sm font-semibold bg-[#022824] text-white shadow-xs text-center"
          >
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400 shrink-0" />
            <span className="hidden sm:inline">My Wishlist ({wishlistProducts.length})</span>
            <span className="sm:hidden font-medium">Wishlist</span>
          </Link>
        </div>

        {/* ── Full Screen Main Wishlist Card ── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                <Heart className="h-5 w-5 text-rose-600 fill-rose-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  My Wishlist
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Items you have saved to purchase later
                </p>
              </div>
            </div>

            {wishlistProducts.length > 0 && (
              <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                {wishlistProducts.length}{" "}
                {wishlistProducts.length === 1 ? "Product" : "Products"}
              </span>
            )}
          </div>

          {/* Wishlist Content */}
          {wishlistLoading && wishlistProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#047ca8] mb-3" />
              <p className="text-sm font-medium">Loading your wishlist...</p>
            </div>
          ) : wishlistProducts.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <Heart className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Your wishlist is empty
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto mb-6">
                Explore our wellness catalog and tap the heart icon on products you want to save.
              </p>
              <Link
                to="/collections/all"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#022824] hover:bg-[#044a42] text-white font-semibold rounded-md text-xs sm:text-sm transition-all shadow-xs"
              >
                <ShoppingBag className="h-4 w-4" />
                Explore Products
              </Link>
            </div>
          ) : (
            <div>
              <ProductGrid products={wishlistProducts} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;

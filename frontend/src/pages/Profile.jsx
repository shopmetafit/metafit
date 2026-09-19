import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MyOrdersPage from "./MyOrdersPage";
import ProductGrid from "../components/Products/ProductGrid";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";
import { logout } from "../redux/slices/authSlice";
import { fetchWishlist } from "../redux/slices/wishlistSlice";
import { Package, LogOut, ChevronRight, ShoppingBag, Heart, Loader2 } from "lucide-react";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const wishlistState = useSelector((state) => state.wishlist || { products: [], loading: false });
  const wishlistProducts = wishlistState?.products || [];
  const wishlistLoading = wishlistState?.loading || false;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") === "wishlist" ? "wishlist" : "orders";

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      dispatch(fetchWishlist());
    }
  }, [user, navigate, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/login");
  };

  if (!user) return null;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen bg-[#f0f2f2]">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Link to="/" className="hover:text-[#047ca8] hover:underline">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-800 font-medium">My Account</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-800 font-medium capitalize">{activeTab}</span>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Your Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">

          {/* ── Left Sidebar ── */}
          <aside className="lg:col-span-1 space-y-3">

            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#047ca8] flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#047ca8] to-[#06b6d4] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-bold">{initials}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-xs font-semibold text-[#047ca8] bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                    {user.role || "Customer"}
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: "orders" })}
                  className={`w-full flex items-center justify-between text-sm px-3 py-2.5 rounded-lg transition-colors font-medium cursor-pointer ${
                    activeTab === "orders"
                      ? "bg-[#e8f4f8] text-[#047ca8] font-bold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#047ca8]" />
                    <span>My Orders</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: "wishlist" })}
                  className={`w-full flex items-center justify-between text-sm px-3 py-2.5 rounded-lg transition-colors font-medium cursor-pointer ${
                    activeTab === "wishlist"
                      ? "bg-rose-50 text-rose-600 font-bold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span>Wishlist</span>
                  </div>
                  {wishlistProducts.length > 0 && (
                    <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {wishlistProducts.length}
                    </span>
                  )}
                </button>

                <Link
                  to="/collections/all"
                  className="flex items-center justify-between text-sm text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#047ca8]" />
                    <span>Continue Shopping</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-600 font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>

            {/* Account info box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700 mb-2 text-sm">Account Info</p>
              <p><span className="text-gray-400">Name:</span> {user.name}</p>
              <p><span className="text-gray-400">Email:</span> {user.email}</p>
              {user.phone && <p><span className="text-gray-400">Phone:</span> {user.phone}</p>}
            </div>
          </aside>

          {/* ── Right Content Area ── */}
          <div className="lg:col-span-3">
            {activeTab === "orders" ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <MyOrdersPage />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
                    <h2 className="text-xl font-bold text-gray-900">
                      My Wishlist
                    </h2>
                  </div>
                  {wishlistProducts.length > 0 && (
                    <span className="text-xs text-gray-500 font-medium">
                      {wishlistProducts.length} {wishlistProducts.length === 1 ? "item" : "items"} saved
                    </span>
                  )}
                </div>

                {wishlistLoading && wishlistProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin text-[#047ca8] mb-2" />
                    <p className="text-sm font-medium">Loading your saved items...</p>
                  </div>
                ) : wishlistProducts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-rose-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Your wishlist is empty
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                      Explore our products and tap the heart icon on any item to save it to your wishlist.
                    </p>
                    <Link
                      to="/collections/all"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#047ca8] hover:bg-[#036e96] text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <ProductGrid products={wishlistProducts} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

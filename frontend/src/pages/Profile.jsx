import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MyOrdersPage from "./MyOrdersPage";
import { useNavigate, Link } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";
import { logout } from "../redux/slices/authSlice";
import { Package, LogOut, ChevronRight, ShoppingBag, User } from "lucide-react";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

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

              {/* Quick links */}
              <div className="space-y-1 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 text-sm text-gray-700 px-2 py-2 rounded hover:bg-gray-50 transition-colors cursor-default">
                  <Package className="h-4 w-4 text-[#047ca8]" />
                  <span className="font-medium">My Orders</span>
                </div>
                <Link
                  to="/collections/all"
                  className="flex items-center gap-2 text-sm text-gray-700 px-2 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <ShoppingBag className="h-4 w-4 text-[#047ca8]" />
                  <span className="font-medium">Continue Shopping</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-700 hover:text-red-600 font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm"
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

          {/* ── Right: Orders ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <MyOrdersPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

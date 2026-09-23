import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import MyOrdersPage from "./MyOrdersPage";
import MyAddressesPage from "./MyAddressesPage";
import ProductGrid from "../components/Products/ProductGrid";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";
import { logout, updateUserProfile } from "../redux/slices/authSlice";
import { fetchWishlist } from "../redux/slices/wishlistSlice";
import { toast } from "sonner";
import {
  Package,
  LogOut,
  ChevronRight,
  ShoppingBag,
  Heart,
  MapPin,
  Loader2,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  UserCheck,
  Edit3,
  X,
  Save,
  CheckCircle2,
  Lock,
} from "lucide-react";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const wishlistState = useSelector(
    (state) => state.wishlist || { products: [], loading: false }
  );
  const wishlistProducts = wishlistState?.products || [];
  const wishlistLoading = wishlistState?.loading || false;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab =
    tabParam === "wishlist"
      ? "wishlist"
      : tabParam === "addresses"
      ? "addresses"
      : tabParam === "orders"
      ? "orders"
      : "profile";

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      dispatch(fetchWishlist());
    }
  }, [user, navigate, dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/login");
  };

  const handleStartEdit = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (
      !formData.email.trim() ||
      !/^\S+@\S+\.\S+$/.test(formData.email.trim())
    ) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setSavingProfile(true);
      const resultAction = await dispatch(
        updateUserProfile({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        })
      );

      if (updateUserProfile.fulfilled.match(resultAction)) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error(
          resultAction.payload?.message || "Failed to update profile"
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Active Member";

  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case "orders":
        return "My Orders";
      case "wishlist":
        return "Wishlist";
      case "addresses":
        return "My Addresses";
      default:
        return "Profile Details";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 antialiased pb-12">
      {/* ── Breadcrumb Bar ── */}
      <div className="bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium overflow-x-auto whitespace-nowrap">
          <Link
            to="/"
            className="hover:text-[#022824] transition-colors flex items-center gap-1"
          >
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <button
            onClick={() => setSearchParams({ tab: "profile" })}
            className="hover:text-[#022824] transition-colors cursor-pointer"
          >
            My Account
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-[#022824] font-semibold">
            {getBreadcrumbLabel()}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Page Title & Welcome Banner */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#022824] via-[#044a42] to-[#047ca8] p-6 sm:p-7 rounded-2xl text-white shadow-lg shadow-[#022824]/10 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-xs font-semibold mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Wellness Member Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.name?.split(" ")[0]}!
            </h1>
            <p className="text-teal-100/90 text-xs sm:text-sm mt-1 max-w-xl">
              Manage your profile details, track recent orders, review wishlist items, and manage addresses.
            </p>
          </div>

          <div className="relative z-10 self-start sm:self-center shrink-0">
            <Link
              to="/collections/all"
              className="inline-flex items-center gap-2 bg-white text-[#022824] hover:bg-teal-50 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md cursor-pointer group"
            >
              <ShoppingBag className="w-4 h-4 text-[#047ca8]" />
              <span>Explore Products</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── Main Dashboard Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ── LEFT ACCOUNT SIDEBAR ── */}
          <aside className="lg:col-span-4 space-y-5">
            {/* User Profile Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 transition-all hover:shadow-sm">
              <div className="flex items-center gap-4">
                {/* Multi-color Premium User Avatar (ONLY FOR USER INITIALS - BRAND LOGO UNCHANGED) */}
                <div className="relative shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-teal-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#022824] via-[#047ca8] to-[#06b6d4] p-[2.5px] shadow-md shadow-teal-900/10">
                      <div className="w-full h-full rounded-full bg-[#022824] flex items-center justify-center border border-white/20">
                        <span className="text-white text-xl font-extrabold tracking-wider drop-shadow-xs">
                          {initials}
                        </span>
                      </div>
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                    {user.name}
                  </h2>
                  <p className="text-xs text-gray-500 truncate font-medium mt-0.5">
                    {user.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/60 text-teal-800 text-xs font-semibold capitalize">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    {user.role || "Customer"}
                  </div>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <nav className="mt-6 space-y-1.5 pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: "profile" })}
                  className={`w-full flex items-center justify-between text-xs sm:text-sm px-3.5 py-3 rounded-xl transition-all font-semibold cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-[#022824] text-white shadow-sm shadow-[#022824]/20"
                      : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck
                      className={`h-4 w-4 ${
                        activeTab === "profile"
                          ? "text-teal-300"
                          : "text-teal-600"
                      }`}
                    />
                    <span>Profile Information</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 ${
                      activeTab === "profile"
                        ? "text-teal-200"
                        : "text-gray-400"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: "orders" })}
                  className={`w-full flex items-center justify-between text-xs sm:text-sm px-3.5 py-3 rounded-xl transition-all font-semibold cursor-pointer ${
                    activeTab === "orders"
                      ? "bg-[#022824] text-white shadow-sm shadow-[#022824]/20"
                      : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package
                      className={`h-4 w-4 ${
                        activeTab === "orders"
                          ? "text-teal-300"
                          : "text-teal-600"
                      }`}
                    />
                    <span>My Orders</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 ${
                      activeTab === "orders"
                        ? "text-teal-200"
                        : "text-gray-400"
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: "wishlist" })}
                  className={`w-full flex items-center justify-between text-xs sm:text-sm px-3.5 py-3 rounded-xl transition-all font-semibold cursor-pointer ${
                    activeTab === "wishlist"
                      ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20"
                      : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart
                      className={`h-4 w-4 ${
                        activeTab === "wishlist"
                          ? "text-white fill-white"
                          : "text-rose-500"
                      }`}
                    />
                    <span>Wishlist</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {wishlistProducts.length > 0 && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          activeTab === "wishlist"
                            ? "bg-white text-rose-600"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {wishlistProducts.length}
                      </span>
                    )}
                    <ChevronRight
                      className={`h-4 w-4 ${
                        activeTab === "wishlist"
                          ? "text-white/80"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchParams({ tab: "addresses" })}
                  className={`w-full flex items-center justify-between text-xs sm:text-sm px-3.5 py-3 rounded-xl transition-all font-semibold cursor-pointer ${
                    activeTab === "addresses"
                      ? "bg-[#022824] text-white shadow-sm shadow-[#022824]/20"
                      : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin
                      className={`h-4 w-4 ${
                        activeTab === "addresses"
                          ? "text-teal-300"
                          : "text-teal-600"
                      }`}
                    />
                    <span>My Addresses</span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 ${
                      activeTab === "addresses"
                        ? "text-teal-200"
                        : "text-gray-400"
                    }`}
                  />
                </button>

                <Link
                  to="/collections/all"
                  className="flex items-center justify-between text-xs sm:text-sm text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 px-3.5 py-3 rounded-xl transition-all font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4 text-teal-600" />
                    <span>Continue Shopping</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </nav>
            </div>
          </aside>

          {/* ── RIGHT MAIN CONTENT AREA ── */}
          <main className="lg:col-span-8">
            {activeTab === "orders" ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-7">
                <MyOrdersPage />
              </div>
            ) : activeTab === "addresses" ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-7">
                <MyAddressesPage />
              </div>
            ) : activeTab === "wishlist" ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-7">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        My Saved Wishlist
                      </h2>
                      <p className="text-xs text-gray-500 font-medium">
                        Products you saved for later
                      </p>
                    </div>
                  </div>
                  {wishlistProducts.length > 0 && (
                    <span className="text-xs bg-rose-50 text-rose-600 font-bold px-3 py-1 rounded-full border border-rose-200/60">
                      {wishlistProducts.length}{" "}
                      {wishlistProducts.length === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>

                {wishlistLoading && wishlistProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin text-[#047ca8] mb-3" />
                    <p className="text-sm font-medium">
                      Loading your saved items...
                    </p>
                  </div>
                ) : wishlistProducts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-xs">
                      <Heart className="h-8 w-8 text-rose-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                      Your wishlist is empty
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm max-w-sm mx-auto mb-6">
                      Explore our products and tap the heart icon on any item to save it here.
                    </p>
                    <Link
                      to="/collections/all"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#022824] hover:bg-[#044a42] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Browse Collections
                    </Link>
                  </div>
                ) : (
                  <ProductGrid products={wishlistProducts} />
                )}
              </div>
            ) : (
              /* ── MAIN PROFILE INFORMATION SECTION ── */
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-7">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                        <span>Profile Information</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                        {isEditing
                          ? "Update your personal details below"
                          : "View and manage your account details"}
                      </p>
                    </div>

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-[#022824] text-xs font-bold transition-all border border-teal-200/80 cursor-pointer shadow-2xs hover:shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>

                  {/* EDIT MODE FORM */}
                  {isEditing ? (
                    <form onSubmit={handleSaveChanges} className="space-y-5">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Enter your full name"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#022824] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            placeholder="Enter your email address"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#022824] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#022824] focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* System Read Only Fields Warning/Context */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-gray-600 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-gray-800">
                          <Lock className="w-3.5 h-3.5 text-gray-500" />
                          <span>System Protected Fields</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                          <div>
                            <span className="text-gray-400">Account Type:</span>{" "}
                            <span className="font-semibold text-gray-700 capitalize">
                              {user.role || "Customer"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>{" "}
                            <span className="font-semibold text-emerald-600">
                              Active
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Member Since:</span>{" "}
                            <span className="font-semibold text-gray-700">
                              {memberSince}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Form Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={savingProfile}
                          className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100/80 text-gray-700 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#022824] hover:bg-[#044a42] text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {savingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 text-teal-300" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* VIEW MODE INFORMATION ROWS */
                    <div className="divide-y divide-gray-100">
                      {/* 1. Full Name (Teal Accent) */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Full Name
                            </p>
                            <p className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                              {user.name}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="self-start sm:self-center inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* 2. Email Address (Amber/Orange Accent) */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Email Address
                            </p>
                            <p className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="self-start sm:self-center inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* 3. Phone Number (Blue/Sky Accent) */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                            <Phone className="w-5 h-5 text-sky-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Phone Number
                            </p>
                            <p className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                              {user.phone || "Not specified"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartEdit}
                          className="self-start sm:self-center inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* 4. Account Type (Purple/Indigo Accent) */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Account Type
                            </p>
                            <p className="text-sm sm:text-base font-bold text-gray-900 mt-0.5 capitalize">
                              {user.role || "Customer"}
                            </p>
                          </div>
                        </div>
                        <span className="self-start sm:self-center inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-200">
                          <Lock className="w-3 h-3" />
                          <span>Read Only</span>
                        </span>
                      </div>

                      {/* 5. Account Status (Emerald Accent) */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Account Status
                            </p>
                            <p className="text-sm sm:text-base font-bold text-emerald-600 mt-0.5">
                              Active
                            </p>
                          </div>
                        </div>
                        <span className="self-start sm:self-center inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-200">
                          <Lock className="w-3 h-3" />
                          <span>Read Only</span>
                        </span>
                      </div>

                      {/* 6. Member Since (Rose/Pink Accent) */}
                      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-rose-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Member Since
                            </p>
                            <p className="text-sm sm:text-base font-bold text-gray-900 mt-0.5">
                              {memberSince}
                            </p>
                          </div>
                        </div>
                        <span className="self-start sm:self-center inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-200">
                          <Lock className="w-3 h-3" />
                          <span>Read Only</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── QUICK LINKS SECTION (Section 11) ── */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-7">
                  <div className="mb-5">
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                      Quick Links
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Fast access to your account sections & shopping
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Card 1: My Orders */}
                    <button
                      type="button"
                      onClick={() => setSearchParams({ tab: "orders" })}
                      className="flex flex-col text-left p-4 rounded-xl border border-gray-200/90 bg-gray-50/50 hover:bg-teal-50/50 hover:border-teal-300 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                    >
                      <div className="w-10 h-10 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Package className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-900 text-sm group-hover:text-[#022824] transition-colors">
                        My Orders
                      </span>
                      <span className="text-xs text-gray-500 font-medium mt-1">
                        View all your orders
                      </span>
                    </button>

                    {/* Card 2: Wishlist */}
                    <button
                      type="button"
                      onClick={() => setSearchParams({ tab: "wishlist" })}
                      className="flex flex-col text-left p-4 rounded-xl border border-gray-200/90 bg-gray-50/50 hover:bg-rose-50/50 hover:border-rose-300 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                    >
                      <div className="w-10 h-10 rounded-lg bg-rose-100/70 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Heart className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-900 text-sm group-hover:text-rose-700 transition-colors">
                        Wishlist
                      </span>
                      <span className="text-xs text-gray-500 font-medium mt-1">
                        View your wishlist
                      </span>
                    </button>

                    {/* Card 3: My Addresses */}
                    <button
                      type="button"
                      onClick={() => setSearchParams({ tab: "addresses" })}
                      className="flex flex-col text-left p-4 rounded-xl border border-gray-200/90 bg-gray-50/50 hover:bg-sky-50/50 hover:border-sky-300 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sky-100/70 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-900 text-sm group-hover:text-sky-800 transition-colors">
                        My Addresses
                      </span>
                      <span className="text-xs text-gray-500 font-medium mt-1">
                        Manage addresses
                      </span>
                    </button>

                    {/* Card 4: Continue Shopping */}
                    <button
                      type="button"
                      onClick={() => navigate("/collections/all")}
                      className="flex flex-col text-left p-4 rounded-xl border border-gray-200/90 bg-gray-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-900 text-sm group-hover:text-emerald-800 transition-colors">
                        Continue Shopping
                      </span>
                      <span className="text-xs text-gray-500 font-medium mt-1">
                        Explore more products
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;


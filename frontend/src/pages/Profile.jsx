import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Edit3,
  X,
  Save,
  CheckCircle2,
} from "lucide-react";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const wishlistState = useSelector(
    (state) => state.wishlist || { products: [], loading: false }
  );
  const wishlistProducts = wishlistState?.products || [];

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  // Backward compatibility: If URL has ?tab=, redirect to dedicated full-screen page
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam === "orders") {
      navigate("/my-orders", { replace: true });
    } else if (tabParam === "addresses") {
      navigate("/my-addresses", { replace: true });
    } else if (tabParam === "wishlist") {
      navigate("/wishlist", { replace: true });
    }
  }, [tabParam, navigate]);

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
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : "Active Member";

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
          <span className="text-gray-900 font-semibold">My Account</span>
          <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
          <span className="text-gray-900 font-semibold">Profile Information</span>
        </nav>

        {/* ── Top Account Navigation Tabs (Direct full-screen page links) ── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-1 sm:p-1.5 mb-4 sm:mb-6 grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-1">
          <Link
            to="/profile"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-semibold bg-[#022824] text-white shadow-xs text-center"
          >
            <User className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="hidden sm:inline">Profile Information</span>
            <span className="sm:hidden font-medium">Profile</span>
          </Link>
          <Link
            to="/my-orders"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
          >
            <Package className="w-4 h-4 text-[#047ca8] shrink-0" />
            <span className="hidden sm:inline">My Orders</span>
            <span className="sm:hidden font-medium">Orders</span>
          </Link>
          <Link
            to="/my-addresses"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
          >
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Saved Addresses</span>
            <span className="sm:hidden font-medium">Addresses</span>
          </Link>
        </div>

        {/* ── User Overview Bar (Clean Single Row) ── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-4 sm:p-5 mb-6 flex items-center gap-3.5 sm:gap-4">
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#022824] text-white flex items-center justify-center font-bold text-base sm:text-lg tracking-wider shadow-xs">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                {user.name}
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 capitalize shrink-0">
                {user.role || "Customer"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
          </div>
        </div>

        {/* ── Main Full-Screen Personal Information Card ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 sm:p-7">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047ca8] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047ca8] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#047ca8] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#022824] hover:bg-[#044a42] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-teal-300" />
                        <span>SAVE CHANGES</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                    className="px-5 py-2.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE (Clean Marketplace Layout) */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Name Field */}
                  <div className="p-4 bg-gray-50/70 rounded-md border border-gray-200/80">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Full Name
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-gray-900 mt-1 block">
                      {user.name || "—"}
                    </span>
                  </div>

                  {/* Email Field */}
                  <div className="p-4 bg-gray-50/70 rounded-md border border-gray-200/80">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Email Address
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-gray-900 mt-1 block truncate">
                      {user.email || "—"}
                    </span>
                  </div>

                  {/* Mobile Number */}
                  <div className="p-4 bg-gray-50/70 rounded-md border border-gray-200/80">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Mobile Number
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-gray-900 mt-1 block">
                      {user.phone || "Not specified"}
                    </span>
                  </div>

                  {/* Account Type */}
                  <div className="p-4 bg-gray-50/70 rounded-md border border-gray-200/80">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Account Type
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-gray-900 mt-1 block capitalize">
                      {user.role || "Customer"}
                    </span>
                  </div>
                </div>

                {/* Meta Information Footer (Member Since, Security Status) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>
                      Member Since: <strong className="text-gray-700">{memberSince}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-[11px]">Account Active & Verified</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Clean Bottom Logout Button ── */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-red-200 hover:border-red-300 bg-white hover:bg-red-50 text-red-600 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

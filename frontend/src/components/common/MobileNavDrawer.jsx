import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  X,
  Package,
  LayoutGrid,
  User,
  Heart,
  Sparkles,
  ChevronRight,
  Home,
  Tag,
  BookOpen,
  Store,
  Phone,
  MessageCircle,
  LogOut,
  LogIn,
  Info,
  Mail,
  HelpCircle,
} from "lucide-react";
import { logout } from "../../redux/slices/authSlice";
import { clearCart, openCartDrawer } from "../../redux/slices/cartSlice";

const defaultCategories = [
  { label: "Ayurvedic Devices", link: "/collections/all?category=ayurvedic%20devices" },
  { label: "Health Monitoring", link: "/collections/all?category=health%20monitoring" },
  { label: "Snacks & Protein", link: "/collections/all?category=snacks%20%26%20protein" },
  { label: "Skin & Body Care", link: "/collections/all?category=skin%20%26%20body%20care" },
  { label: "Panchakarma Equipment", link: "/collections/all?category=panchakarma%20equipment" },
  { label: "Herbal & Natural", link: "/collections/all?category=herbal%20%26%20natural" },
  { label: "Accessories", link: "/collections/all?category=accessories" },
];

const typoCorrectionMap = {
  "protien bite": "protein bite",
  "hare care": "hair care",
};

const MobileNavDrawer = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { allProducts } = useSelector((state) => state.products || { allProducts: [] });
  const wishlist = useSelector((state) => state.wishlist || { products: [] });
  const wishlistCount = wishlist?.products?.length || 0;

  const dynamicCategories = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return defaultCategories;

    const list = (allProducts || []).reduce((acc, product) => {
      let category = product.category?.trim();
      if (category) {
        let normalized = category.toLowerCase();
        if (typoCorrectionMap[normalized]) {
          normalized = typoCorrectionMap[normalized];
          if (category.toLowerCase() in typoCorrectionMap) {
            category = typoCorrectionMap[category.toLowerCase()].replace(/\b\w/g, (s) => s.toUpperCase());
          }
        }
        if (!acc.find((c) => c.normalizedName === normalized)) {
          acc.push({
            label: category,
            link: `/collections/all?category=${encodeURIComponent(normalized)}`,
            normalizedName: normalized,
          });
        }
      }
      return acc;
    }, []);

    return list.length > 0 ? list : defaultCategories;
  }, [allProducts]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    onClose();
    navigate("/login");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-[85%] max-w-sm bg-[#FAF7F2] h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-left duration-250">
        {/* ── Top Header / User Profile ── */}
        <div className="bg-[#443524] text-white p-4 flex items-center justify-between border-b border-[#362a1c] flex-shrink-0">
          {user ? (
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 min-w-0 group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#DAB78C] text-[#242221] font-extrabold text-sm flex items-center justify-center border-2 border-white/30 shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-300 font-medium leading-none">Hello,</p>
                <p className="text-sm font-bold text-white truncate mt-0.5 group-hover:text-[#DAB78C] transition-colors">
                  {user.name}
                </p>
                <p className="text-[11px] text-[#DAB78C] truncate mt-0.5">View Profile & Settings →</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#242221] text-white flex items-center justify-center border border-white/20 shrink-0">
                <User className="h-6 w-6 text-[#DAB78C]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-300 font-medium leading-none">Welcome</p>
                <div className="flex items-center gap-2 mt-1">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="text-xs font-bold bg-[#DAB78C] text-[#242221] px-2.5 py-1 rounded-md hover:bg-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={onClose}
                    className="text-xs font-semibold text-white hover:text-[#DAB78C] transition-colors underline"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4">
          {/* ── Quick Action Cards: Returns & Orders, My Account, Wishlist ── */}
          <div className="bg-white rounded-xl p-2.5 border border-[#EBE4D8] shadow-xs space-y-1">
            {/* Returns & Orders */}
            <Link
              to="/my-orders"
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#FAF7F2] text-[#382b1d] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#443524] text-[#DAB78C] flex items-center justify-center shrink-0 shadow-xs">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#242221] group-hover:text-[#936639] transition-colors">
                    Returns & Orders
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    Track, cancel, return or buy again
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#936639] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {/* My Account */}
            <Link
              to={user ? "/profile" : "/login"}
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#FAF7F2] text-[#382b1d] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#F3EDE2] text-[#443524] flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#242221] group-hover:text-[#936639] transition-colors">
                    Your Account
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    Manage profile, addresses & security
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#936639] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {/* Wishlist */}
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#FAF7F2] text-[#382b1d] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#FBEAEB] text-rose-600 flex items-center justify-center shrink-0">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#242221] group-hover:text-rose-600 transition-colors">
                      Your Wishlist
                    </p>
                    {wishlistCount > 0 && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    Saved items for later purchase
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>

            {/* Wellness Assistant / Routine Builder */}
            <Link
              to="/routine-builder"
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-[#F4EFE6] to-[#EAE0D0] hover:opacity-95 text-[#382b1d] transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#443524] text-[#DAB78C] flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="h-5 w-5 text-[#DAB78C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#242221]">
                    Wellness Assistant
                  </p>
                  <p className="text-[11px] text-[#785E42] truncate">
                    Get custom daily routine recommendations
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#785E42] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          </div>

          {/* ── Shop by Category Section ── */}
          <div className="bg-white rounded-xl border border-[#EBE4D8] shadow-xs overflow-hidden">
            <div className="px-3.5 py-2.5 bg-[#F4EFE6] border-b border-[#EBE4D8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-[#443524]" />
                <h3 className="text-xs font-bold text-[#443524] uppercase tracking-wider">
                  Shop by Category
                </h3>
              </div>
              <Link
                to="/collections/all"
                onClick={onClose}
                className="text-[11px] font-bold text-[#936639] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {dynamicCategories.map((cat) => (
                <Link
                  key={cat.label}
                  to={cat.link}
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-gray-700 hover:bg-[#FAF7F2] hover:text-[#936639] transition-colors"
                >
                  <span className="truncate">{cat.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* ── Browse & Highlights ── */}
          <div className="bg-white rounded-xl border border-[#EBE4D8] shadow-xs overflow-hidden">
            <div className="px-3.5 py-2 bg-[#F4EFE6] border-b border-[#EBE4D8]">
              <h3 className="text-[11px] font-bold text-[#443524] uppercase tracking-wider">
                Explore More
              </h3>
            </div>
            <div className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#FAF7F2] hover:text-[#936639] transition-colors"
              >
                <Home className="h-4 w-4 text-[#443524]" />
                <span>Home Page</span>
              </Link>
              <Link
                to="/collections/all?discountMin=10&sortBy=discount"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#FAF7F2] hover:text-[#936639] transition-colors"
              >
                <Tag className="h-4 w-4 text-emerald-600" />
                <span>Today's Deals & Discounts</span>
              </Link>
              <Link
                to="/blog"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#FAF7F2] hover:text-[#936639] transition-colors"
              >
                <BookOpen className="h-4 w-4 text-[#443524]" />
                <span>Wellness Blog & Articles</span>
              </Link>
              <Link
                to="/vendor-register"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[#FAF7F2] hover:text-[#936639] transition-colors"
              >
                <Store className="h-4 w-4 text-[#443524]" />
                <span>Become a Seller / Vendor</span>
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-amber-50 text-amber-900 font-bold hover:bg-amber-100 transition-colors"
                >
                  <Store className="h-4 w-4 text-amber-800" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>
          </div>

          {/* ── Help & Contact ── */}
          <div className="bg-white rounded-xl border border-[#EBE4D8] shadow-xs p-3 space-y-2">
            <p className="text-[11px] font-bold text-[#443524] uppercase tracking-wider">
              Help & Support
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:+918829912389"
                className="flex items-center gap-2 p-2 bg-[#FAF7F2] hover:bg-[#F3EDE2] rounded-lg text-xs font-semibold text-[#443524] transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-[#936639]" />
                <span>Call Us</span>
              </a>
              <a
                href="https://wa.me/918829912389"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-semibold text-emerald-800 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
              <Link to="/aboutUs" onClick={onClose} className="hover:underline">
                About Us
              </Link>
              <span>•</span>
              <Link to="/contactUs" onClick={onClose} className="hover:underline">
                Contact Us
              </Link>
              <span>•</span>
              <Link to="/shipping-policy" onClick={onClose} className="hover:underline">
                Shipping
              </Link>
            </div>
          </div>

          {/* ── Logout Button (if logged in) ── */}
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out ({user.name?.split(" ")[0]})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileNavDrawer;

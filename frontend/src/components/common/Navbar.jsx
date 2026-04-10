import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronRight, Phone } from "lucide-react";
import { useSelector } from "react-redux";

const categories = [
  { label: "Ayurvedic Devices", link: "/collections/all?category=ayurvedic devices" },
  { label: "Health Monitoring", link: "/collections/all?category=health monitoring" },
  { label: "Snacks & Protein", link: "/collections/all?category=snacks & protein" },
  { label: "Skin & Body Care", link: "/collections/all?category=skin & body care" },
  { label: "Panchakarma", link: "/collections/all?category=panchakarma equipment" },
  { label: "Accessories", link: "/collections/all?category=accessories" },
  { label: "Blog", link: "/blog" },
  { label: "Today's Deals", link: "/collections/all", highlight: true },
];

const moreLinks = [
  { label: "About Us", link: "/aboutUs" },
  { label: "Contact Us", link: "/contactUs" },
  { label: "My Orders", link: "/my-orders" },
  { label: "Become a Vendor", link: "/vendor-register" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      {/* Amazon-style Category Nav Bar */}
      <nav className="bg-[#0a3d35] text-white">
        <div
          className="max-w-screen-2xl mx-auto px-3 flex items-center gap-0.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* All Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 hover:bg-white/10 font-bold text-sm whitespace-nowrap flex-shrink-0 rounded transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span>All</span>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-white/20 mx-1 flex-shrink-0" />

          {/* Category Links */}
          {categories.map((cat) => (
            <Link
              key={cat.label}
              to={cat.link}
              className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap hover:bg-white/10 rounded flex-shrink-0 transition-colors ${
                cat.highlight ? "text-orange-400 font-bold" : "text-white"
              }`}
            >
              {cat.label}
            </Link>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-white/20 mx-1 flex-shrink-0" />

          {/* Phone */}
          <a
            href="tel:+918829912389"
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap hover:bg-white/10 rounded flex-shrink-0 transition-colors text-teal-200"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden xl:inline">+91 88299 12389</span>
          </a>

          {/* Admin Link */}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="px-3 py-2.5 text-sm font-medium text-amber-400 whitespace-nowrap hover:bg-white/10 rounded flex-shrink-0 transition-colors"
            >
              Admin
            </Link>
          )}

          {/* Become Vendor */}
          <Link
            to="/vendor-register"
            className="ml-auto px-3 py-2.5 text-sm font-medium text-teal-300 whitespace-nowrap hover:bg-white/10 rounded flex-shrink-0 transition-colors"
          >
            Become a Vendor
          </Link>
        </div>
      </nav>

      {/* Sidebar Mega Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Sidebar Panel */}
          <div className="w-72 sm:w-80 bg-white h-full shadow-2xl overflow-y-auto flex-shrink-0 flex flex-col">
            {/* Sidebar Header */}
            <div className="bg-gradient-to-r from-[#022824] to-[#0a3d35] text-white px-4 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="font-black text-white text-lg">M</span>
                </div>
                <div>
                  <div className="font-bold text-base leading-tight">
                    Hello, {user ? user.name?.split(" ")[0] : "Sign in"}
                  </div>
                  <div className="text-xs text-teal-300">M Wellness Bazaar</div>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Shop by Category */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Shop by Category
              </h3>
            </div>
            {categories.map((cat) => (
              <Link
                key={cat.label}
                to={cat.link}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 text-sm text-gray-800 hover:bg-teal-50 hover:text-teal-700 border-b border-gray-100 transition-colors"
              >
                <span
                  className={
                    cat.highlight ? "text-orange-500 font-semibold" : "font-medium"
                  }
                >
                  {cat.label}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}

            {/* More Links */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 mt-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                More
              </h3>
            </div>
            {moreLinks.map((item) => (
              <Link
                key={item.label}
                to={item.link}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 text-sm text-gray-800 hover:bg-teal-50 hover:text-teal-700 border-b border-gray-100 transition-colors"
              >
                <span className="font-medium">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}

            {/* Contact in Sidebar */}
            <div className="px-4 py-4 mt-auto border-t border-gray-200">
              <a
                href="tel:+918829912389"
                className="flex items-center gap-2 text-sm text-teal-700 font-semibold hover:text-teal-900 transition-colors"
              >
                <Phone className="h-4 w-4" />
                +91 88299 12389
              </a>
            </div>
          </div>

          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
};

export default Navbar;

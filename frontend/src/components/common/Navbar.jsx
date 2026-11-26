import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { X, ChevronRight, Phone, Menu, Leaf } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllProducts } from "../../redux/slices/productSlice";

const categories = [
  {
    label: "Ayurvedic Devices",
    link: "/collections/all?category=ayurvedic devices",
  },
  {
    label: "Health Monitoring",
    link: "/collections/all?category=health monitoring",
  },
  {
    label: "Snacks & Protein",
    link: "/collections/all?category=snacks & protein",
  },
  {
    label: "Skin & Body Care",
    link: "/collections/all?category=skin & body care",
  },
  {
    label: "Panchakarma",
    link: "/collections/all?category=panchakarma equipment",
  },
  {
    label: "Accessories",
    link: "/collections/all?category=accessories",
  },
];

const moreLinks = [
  {
    label: "Returns & Orders",
    link: "/my-orders",
  },
  {
    label: "Your Account",
    link: "/profile",
  },
  {
    label: "About Us",
    link: "/aboutUs",
  },
  {
    label: "Contact Us",
    link: "/contactUs",
  },
  {
    label: "Become a Vendor",
    link: "https://partner.mwellnessbazaar.com/become-vendor",
    external: true,
  },
];

const Navbar = ({ onOpenMobileNav }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const { user } = useSelector((state) => state.auth);

  const dispatch = useDispatch();

  const { allProducts } = useSelector(
    (state) => state.products || { allProducts: [] }
  );

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  const typoCorrectionMap = {
    "protien bite": "protein bite",
    "hare care": "hair care",
  };

  const dynamicCategories = useMemo(() => {
    return (allProducts || []).reduce(
      (acc, product) => {
        let category = product.category?.trim();

        if (category) {
          let normalizedCategory = category.toLowerCase();

          if (typoCorrectionMap[normalizedCategory]) {
            normalizedCategory =
              typoCorrectionMap[normalizedCategory];

            if (category.toLowerCase() in typoCorrectionMap) {
              category = typoCorrectionMap[
                category.toLowerCase()
              ].replace(/\b\w/g, (s) => s.toUpperCase());
            }
          }

          if (
            !acc.find(
              (c) => c.normalizedName === normalizedCategory
            )
          ) {
            acc.push({
              label: category,
              link: `/collections/all?category=${encodeURIComponent(
                normalizedCategory
              )}`,
              normalizedName: normalizedCategory,
            });
          }
        }

        return acc;
      },
      []
    );
  }, [allProducts]);

  const displayedCategories =
    dynamicCategories.length > 0
      ? dynamicCategories
      : categories;

  const navLinkClass =
    "px-3 py-1.5 text-sm font-medium text-white/90 whitespace-nowrap hover:text-[#DAB78C] rounded-md transition-colors flex-shrink-0";

  return (
    <>
      {/* =====================================================
          CATEGORY NAV BAR — deep brown theme matching Image 2
      ====================================================== */}

      <nav className="bg-[#443524] border-t border-b border-[#362a1c] relative z-20">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1">

          {/* ALL CATEGORIES — opens sidebar menu */}
          <button
            onClick={() => (onOpenMobileNav ? onOpenMobileNav() : setMenuOpen(true))}
            className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-white hover:text-[#DAB78C] whitespace-nowrap rounded-md flex-shrink-0 transition-colors cursor-pointer"
          >
            <Menu className="h-4 w-4 text-white" />
            <span>All categories</span>
            <ChevronRight className="h-4 w-4 text-white" />
          </button>

          {/* HOME */}
          <Link to="/" className={navLinkClass}>
            Home
          </Link>

          {/* EXPLORE */}
          <Link to="/collections/all" className={navLinkClass}>
            Explore
          </Link>

          {/* BECOME A SELLER */}
          <Link to="/vendor-register" className={navLinkClass}>
            Become a Seller
          </Link>

          {/* BLOG */}
          <Link to="/blog" className={navLinkClass}>
            Blog
          </Link>

          {/* ADMIN LINK */}
          {user?.role === "admin" && (
            <Link to="/admin" className={navLinkClass}>
              Admin
            </Link>
          )}

          {/* PHONE */}
          <a
            href="tel:+918829912389"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-sm whitespace-nowrap rounded-md flex-shrink-0 transition-colors text-white/80 hover:text-white"
          >
            <Phone className="h-3.5 w-3.5 text-[#DAB78C]" />
            <span>+91 88299 12389</span>
          </a>

          {/* TODAY'S DEALS — right aligned black pill button */}
          <Link
            to="/collections/all?discountMin=10&sortBy=discount"
            className="ml-auto bg-[#0F0D0C] hover:bg-black text-white text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full border border-white/10 transition-colors whitespace-nowrap shadow-xs"
          >
            Today's Deals
          </Link>
        </div>
      </nav>

      {/* =====================================================
          SIDEBAR MEGA MENU OVERLAY
      ====================================================== */}

      {menuOpen && (
        <div className="fixed inset-0 z-[9999] flex">

          {/* Sidebar Panel */}

          <div className="w-72 sm:w-80 bg-herb-card h-full shadow-2xl overflow-y-auto flex-shrink-0 flex flex-col">

            {/* Sidebar Header */}

            <div className="bg-herb-ink text-herb-background px-4 py-4 flex items-center justify-between flex-shrink-0">

              <div className="flex items-center gap-2">

                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/95 border border-herb-wood-light/40 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/metafit-logo.png"
                    alt="M Wellness Bazaar"
                    className="w-full h-full object-contain p-0.5"
                  />
                </div>

                <div>
                  <div className="font-display font-bold text-base leading-tight text-herb-background">
                    Hello,{" "}
                    {user
                      ? user.name?.split(" ")[0]
                      : "Sign in"}
                  </div>

                  <div className="text-xs text-herb-footer-accent">
                    M Wellness Bazaar
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-herb-background"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* =================================================
                SHOP BY CATEGORY
            ================================================= */}

            <div className="bg-herb-background px-4 py-2 border-b border-herb-border">
              <h3 className="text-xs font-bold text-herb-rustic uppercase tracking-widest">
                Shop by Category
              </h3>
            </div>

            {displayedCategories.map((cat) => (
              <Link
                key={cat.label}
                to={cat.link}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 text-sm text-herb-foreground hover:bg-herb-accent/50 hover:text-herb-ink border-b border-herb-border/60 transition-colors"
              >
                <span className="font-medium">
                  {cat.label}
                </span>

                <ChevronRight className="h-4 w-4 text-herb-wood" />
              </Link>
            ))}

            {/* =================================================
                MORE LINKS
            ================================================= */}

            <div className="bg-herb-background px-4 py-2 border-b border-herb-border mt-2">
              <h3 className="text-xs font-bold text-herb-rustic uppercase tracking-widest">
                More
              </h3>
            </div>

            {moreLinks.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.link}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 text-sm text-herb-foreground hover:bg-herb-accent/50 hover:text-herb-ink border-b border-herb-border/60 transition-colors"
                >
                  <span className="font-medium">
                    {item.label}
                  </span>

                  <ChevronRight className="h-4 w-4 text-herb-wood" />
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.link}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 text-sm text-herb-foreground hover:bg-herb-accent/50 hover:text-herb-ink border-b border-herb-border/60 transition-colors"
                >
                  <span className="font-medium">
                    {item.label}
                  </span>

                  <ChevronRight className="h-4 w-4 text-herb-wood" />
                </Link>
              )
            )}

            {/* =================================================
                CONTACT IN SIDEBAR
            ================================================= */}

            <div className="px-4 py-4 mt-auto border-t border-herb-border">

              <a
                href="tel:+918829912389"
                className="flex items-center gap-2 text-sm text-herb-rustic font-semibold hover:text-herb-ink transition-colors"
              >
                <Phone className="h-4 w-4 text-herb-wood" />

                +91 88299 12389
              </a>

            </div>
          </div>

          {/* =================================================
              BACKDROP
          ================================================= */}

          <div
            className="flex-1 bg-herb-ink/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
};

export default Navbar;

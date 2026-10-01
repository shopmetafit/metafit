import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { X, ChevronRight, Phone } from "lucide-react";
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
  {
    label: "Blog",
    link: "/blog",
  },
  {
    label: "Today's Deals",
    link: "/collections/all",
    highlight: true,
  },
];

const moreLinks = [
  {
    label: "About Us",
    link: "/aboutUs",
  },
  {
    label: "Contact Us",
    link: "/contactUs",
  },
  {
    label: "My Orders",
    link: "/my-orders",
  },
  {
    label: "Become a Vendor",
    link: "https://partner.mwellnessbazaar.com/become-vendor",
    external: true,
  },
];

const Navbar = () => {
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
      ? [
          ...dynamicCategories,
          {
            label: "Blog",
            link: "/blog",
          },
          {
            label: "Today's Deals",
            link: "/collections/all",
            highlight: true,
          },
        ]
      : categories;

  const dynamicProdCats = dynamicCategories;

  const staticProdCats = categories.filter((c) =>
    c.link.includes("category")
  );

  const displayedProdCats =
    dynamicProdCats.length > 0
      ? dynamicProdCats
      : staticProdCats;

  const navbarProdCats = displayedProdCats.slice(0, 5);

  return (
    <>
      {/* =====================================================
          AMAZON STYLE CATEGORY NAV BAR - NAVRATRI BURGUNDY THEME
      ====================================================== */}

      <nav className="bg-gradient-to-r from-[#3A0610] via-[#4A0712] to-[#650B18] text-[#FFF8E7] shadow-xs relative overflow-hidden">
        {/* Subtle Festive Golden Particle Overlay Layer */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
          <div className="absolute top-1 left-[20%] w-1 h-1 rounded-full bg-[#F2C94C] blur-[0.5px] animate-navratri-sparkle-2" />
          <div className="absolute bottom-1.5 left-[55%] w-1.5 h-1.5 rounded-full bg-[#D4A017] blur-[0.5px] animate-navratri-sparkle-1" />
          <div className="absolute top-2 right-[25%] w-1 h-1 rounded-full bg-[#F2C94C] blur-[0.5px] animate-navratri-sparkle-3" />
        </div>

        <div className="max-w-screen-2xl mx-auto px-3 flex items-center gap-0.5 overflow-x-auto no-scrollbar relative z-10">

          {/* =================================================
              HOME - LAPTOP / DESKTOP ONLY
          ================================================= */}

          <Link
            to="/"
            className="hidden lg:flex px-3 py-2.5 text-sm font-bold text-[#FFF8E7] whitespace-nowrap hover:bg-[#D4A017]/20 hover:text-[#F2C94C] rounded flex-shrink-0 transition-colors"
          >
            Home
          </Link>

          {/* Divider */}

          <div className="w-px h-5 bg-[#D4A017]/30 mx-1 flex-shrink-0" />

          {/* =================================================
              CATEGORY LINKS
          ================================================= */}

          {navbarProdCats.map((cat) => (
            <Link
              key={cat.label}
              to={cat.link}
              className="px-3 py-2.5 text-sm font-medium text-[#FFF8E7] whitespace-nowrap hover:bg-[#D4A017]/20 hover:text-[#F2C94C] rounded flex-shrink-0 transition-colors"
            >
              {cat.label}
            </Link>
          ))}

          {/* =================================================
              ALL BUTTON
          ================================================= */}

          <button
            onClick={() => setMenuOpen(true)}
            className="px-3 py-2.5 text-sm font-extrabold text-[#F2C94C] hover:bg-[#D4A017]/20 hover:text-white rounded flex-shrink-0 transition-all whitespace-nowrap flex items-center gap-0.5 cursor-pointer hover:drop-shadow-[0_0_8px_rgba(242,201,76,0.6)]"
          >
            ALL

            <ChevronRight className="h-4 w-4 text-[#F2C94C]" />
          </button>

          {/* Divider */}

          <div className="w-px h-5 bg-[#D4A017]/30 mx-1 flex-shrink-0" />

          {/* =================================================
              BLOG
          ================================================= */}

          <Link
            to="/blog"
            className="px-3 py-2.5 text-sm font-medium text-[#FFF8E7] whitespace-nowrap hover:bg-[#D4A017]/20 hover:text-[#F2C94C] rounded flex-shrink-0 transition-colors"
          >
            Blog
          </Link>

          {/* =================================================
              TODAY'S DEALS
          ================================================= */}

          <Link
            to="/collections/all"
            className="px-3 py-2.5 text-sm font-extrabold text-[#F2C94C] whitespace-nowrap hover:bg-[#D4A017]/20 rounded flex-shrink-0 transition-all hover:drop-shadow-[0_0_8px_rgba(242,201,76,0.6)]"
          >
            Today's Deals
          </Link>

          {/* Divider */}

          <div className="w-px h-5 bg-[#D4A017]/30 mx-1 flex-shrink-0" />

          {/* =================================================
              PHONE
          ================================================= */}

          <a
            href="tel:+918829912389"
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm whitespace-nowrap hover:bg-[#D4A017]/20 rounded flex-shrink-0 transition-colors text-[#FFF8E7] hover:text-[#F2C94C]"
          >
            <Phone className="h-4 w-4 text-[#D4A017]" />

            <span className="hidden xl:inline">
              +91 88299 12389
            </span>
          </a>

          {/* =================================================
              ADMIN LINK
          ================================================= */}

          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="px-3 py-2.5 text-sm font-medium text-[#F2C94C] whitespace-nowrap hover:bg-[#D4A017]/20 rounded flex-shrink-0 transition-colors"
            >
              Admin
            </Link>
          )}

          {/* =================================================
              BECOME VENDOR
          ================================================= */}

          <a
            href="https://partner.mwellnessbazaar.com/become-vendor"
            className="ml-auto px-3 py-2.5 text-sm font-semibold text-[#F2C94C] whitespace-nowrap hover:bg-[#D4A017]/20 hover:text-white rounded flex-shrink-0 transition-colors"
          >
            Become a Vendor
          </a>
        </div>
        {/* Subtle Decorative Animated Gold Gradient Bottom Line */}
        <div className="w-full h-[1.5px] navratri-gold-border opacity-70 relative z-20" />
      </nav>

      {/* =====================================================
          SIDEBAR MEGA MENU OVERLAY
      ====================================================== */}

      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex">

          {/* Sidebar Panel */}

          <div className="w-72 sm:w-80 bg-white h-full shadow-2xl overflow-y-auto flex-shrink-0 flex flex-col">

            {/* Sidebar Header */}

            <div className="bg-gradient-to-r from-[#3A0610] via-[#650B18] to-[#4A0712] text-[#FFF8E7] px-4 py-4 flex items-center justify-between flex-shrink-0">

              <div className="flex items-center gap-2">

                <div className="w-9 h-9 bg-gradient-to-br from-[#D4A017] to-[#F2C94C] rounded-lg flex items-center justify-center">
                  <span className="font-black text-[#3A0610] text-lg">
                    M
                  </span>
                </div>

                <div>
                  <div className="font-bold text-base leading-tight text-[#FFF8E7]">
                    Hello,{" "}
                    {user
                      ? user.name?.split(" ")[0]
                      : "Sign in"}
                  </div>

                  <div className="text-xs text-[#F2C94C]">
                    M Wellness Bazaar
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-[#FFF8E7]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* =================================================
                SHOP BY CATEGORY
            ================================================= */}

            <div className="bg-[#FFF8E7] px-4 py-2 border-b border-[#D4A017]/20">
              <h3 className="text-xs font-bold text-[#7A1522] uppercase tracking-widest">
                Shop by Category
              </h3>
            </div>

            {displayedCategories.map((cat) => (
              <Link
                key={cat.label}
                to={cat.link}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 text-sm text-[#3A0610] hover:bg-[#FFF8E7] hover:text-[#7A1522] border-b border-gray-100 transition-colors"
              >
                <span
                  className={
                    cat.highlight
                      ? "text-[#D4A017] font-semibold"
                      : "font-medium"
                  }
                >
                  {cat.label}
                </span>

                <ChevronRight className="h-4 w-4 text-[#D4A017]" />
              </Link>
            ))}

            {/* =================================================
                MORE LINKS
            ================================================= */}

            <div className="bg-[#FFF8E7] px-4 py-2 border-b border-[#D4A017]/20 mt-2">
              <h3 className="text-xs font-bold text-[#7A1522] uppercase tracking-widest">
                More
              </h3>
            </div>

            {moreLinks.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.link}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 text-sm text-[#3A0610] hover:bg-[#FFF8E7] hover:text-[#7A1522] border-b border-gray-100 transition-colors"
                >
                  <span className="font-medium">
                    {item.label}
                  </span>

                  <ChevronRight className="h-4 w-4 text-[#D4A017]" />
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.link}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 text-sm text-[#3A0610] hover:bg-[#FFF8E7] hover:text-[#7A1522] border-b border-gray-100 transition-colors"
                >
                  <span className="font-medium">
                    {item.label}
                  </span>

                  <ChevronRight className="h-4 w-4 text-[#D4A017]" />
                </Link>
              )
            )}

            {/* =================================================
                CONTACT IN SIDEBAR
            ================================================= */}

            <div className="px-4 py-4 mt-auto border-t border-gray-200">

              <a
                href="tel:+918829912389"
                className="flex items-center gap-2 text-sm text-[#7A1522] font-semibold hover:text-[#3A0610] transition-colors"
              >
                <Phone className="h-4 w-4 text-[#D4A017]" />

                +91 88299 12389
              </a>

            </div>
          </div>

          {/* =================================================
              BACKDROP
          ================================================= */}

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
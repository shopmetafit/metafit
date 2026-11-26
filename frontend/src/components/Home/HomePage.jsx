import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Leaf,
  ArrowRight,
  Star,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  HeartHandshake,
  Sprout,
  Heart,
  Apple,
  Pill,
  Activity,
  HeartPulse,
  Flame,
  Droplets,
  Scissors,
  Utensils,
  FlaskConical,
  Package,
} from "lucide-react";

import { fetchAllProducts } from "../../redux/slices/productSlice";
import { getProductDiscount } from "../../pages/CollectionPage";

/* ─────────────────────────────────────────────
   HERO — "Promise" (compact herbal banner matching Image 1)
───────────────────────────────────────────── */
const Hero = () => (
  <section className="relative overflow-hidden -mx-2 sm:-mx-4 -mt-3 h-[210px] sm:h-[245px] md:h-[270px] border-b border-herb-border">
    {/* Banner image */}
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: "url('/herbal-texture.jpg')" }}
      aria-hidden="true"
    />

    <div className="relative h-full px-4 sm:px-8 text-center max-w-2xl mx-auto flex flex-col items-center justify-center">
      {/* Brand Logo */}
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white shadow-sm border border-black/10 flex items-center justify-center p-1 mb-2">
        <img
          src="/metafit-logo.png"
          alt="M Wellness Bazaar"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Name */}
      <p className="font-serif text-xs sm:text-sm font-semibold text-[#1f1a14] tracking-tight">
        M Wellness Bazaar
      </p>

      {/* Thin divider */}
      <div className="w-7 h-px bg-[#1f1a14]/25 my-2" />

      {/* Promise Heading */}
      <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1f1a14] leading-none">
        Promise
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-xs sm:text-[13px] text-[#3d352c] font-normal max-w-md mx-auto">
        Thoughtfully chosen. Naturally inspired. For a healthier you.
      </p>
    </div>
  </section>
);

/* ─────────────────────────────────────────────
   DEAL CARD
───────────────────────────────────────────── */
const DealCard = ({ product }) => {
  const sellingPrice = Number(product.discountPrice || product.price || 0);
  const mrpPrice = Number(product.price || 0);
  const discount = getProductDiscount(product);
  const image =
    (product.images && product.images.length > 0 && product.images[0]?.url) ||
    "https://cdn-icons-png.flaticon.com/512/4076/4076504.png";

  const isBestseller = Boolean(
    product.isBestSeller ||
    product.tags?.includes("BESTSELLER") ||
    Number(product.soldCount || 0) >= 50
  );

  const isNewArrival = Boolean(
    product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() <
    1000 * 60 * 60 * 24 * 30
  );

  return (
    <Link
      to={`/product/${product.slug || product._id}`}
      className="group w-44 sm:w-52 flex-shrink-0 snap-start"
    >
      <div className="relative rounded-xl overflow-hidden bg-herb-card border border-herb-border group-hover:shadow-soft transition-all duration-200">
        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-herb-rustic text-herb-background text-[10px] font-bold px-2 py-0.5 rounded-full">
            {discount}% off
          </span>
        )}

        {/* Bestseller / New arrival chip */}
        {(isBestseller || isNewArrival) && (
          <span className="absolute bottom-2 left-2 z-10 bg-herb-ink/85 text-herb-footer-accent text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
            {isBestseller ? "Bestseller" : "New arrival"}
          </span>
        )}

        <div className="aspect-square w-full bg-herb-muted flex items-center justify-center p-3">
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      <div className="mt-2 px-0.5">
        {product.brand && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-herb-muted-foreground truncate">
            {product.brand}
          </p>
        )}
        <h3 className="text-xs sm:text-[13px] font-semibold text-herb-foreground leading-snug line-clamp-1 mt-0.5 group-hover:text-herb-wood-dark transition-colors">
          {product.name}
        </h3>
        {Number(product.numReviews) > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-herb-wood text-herb-wood" />
            <span className="text-[10px] font-semibold text-herb-foreground">
              {Number(product.rating).toFixed(1)}
            </span>
            <span className="text-[10px] text-herb-muted-foreground">
              ({product.numReviews})
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm font-bold text-herb-ink">
            ₹{sellingPrice.toLocaleString()}
          </span>
          {discount > 0 && (
            <span className="text-[11px] text-herb-muted-foreground line-through">
              ₹{mrpPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ─────────────────────────────────────────────
   TODAY'S DEALS
───────────────────────────────────────────── */
const TodaysDeals = ({ products }) => {
  const deals = useMemo(
    () =>
      (products || [])
        .filter((p) => getProductDiscount(p) > 0)
        .sort((a, b) => getProductDiscount(b) - getProductDiscount(a))
        .slice(0, 10),
    [products]
  );

  if (deals.length === 0) return null;

  return (
    <section id="deals" className="scroll-mt-32">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-herb-ink">
            Today's Deals
          </h2>
          <p className="text-sm text-herb-muted-foreground mt-1">
            {deals.length} offer{deals.length !== 1 && "s"} · handpicked savings for today
          </p>
        </div>
        <Link
          to="/collections/all?discountMin=10&sortBy=discount"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-herb-wood-dark hover:text-herb-ink transition-colors shrink-0"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
        {deals.map((product) => (
          <DealCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   CUSTOM CATEGORY SVG ICONS
───────────────────────────────────────────── */
const WomanIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="7.5" r="3.5" />
    <path d="M8.5 7.5c0-2.5 1.5-4.5 3.5-4.5s3.5 2 3.5 4.5c0 2 .5 3.5 1.5 5" />
    <path d="M8.5 7.5c0 2-.5 3.5-1.5 5" />
    <path d="M6.5 20.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
  </svg>
);

const HairIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 19c-1-4 0-9 2.5-12C10 5 11.5 4 12 4s2 1 3.5 3c2.5 3 3.5 8 2.5 12" />
    <path d="M9.5 20c-.5-3.5 0-8 2.5-12" />
    <path d="M14.5 20c.5-3.5 0-8-2.5-12" />
  </svg>
);

const SyrupIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="2" width="6" height="3" rx="1" />
    <path d="M10 5v2.5L7 10v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V10l-3-2.5V5" />
    <path d="M7 13h10" />
    <path d="M7 17h10" />
  </svg>
);

const PowderBowlIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 11h16c0 4.5-3.5 8-8 8s-8-3.5-8-8z" />
    <path d="M8 19l-1 2h10l-1-2" />
    <path d="M14.5 11L19 4.5" />
  </svg>
);

const FaceCareIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20.5c3.8 0 6.8-3.3 6.8-8S15.8 4 12 4 5.2 7.5 5.2 12.5 8.2 20.5 12 20.5z" />
    <path d="M9.5 11.5h.01" />
    <path d="M14.5 11.5h.01" />
    <path d="M9.5 15.2c.7.7 1.5 1 2.5 1s1.8-.3 2.5-1" />
  </svg>
);

/* ─────────────────────────────────────────────
   CATEGORY ICON RESOLVER (ACCORDING TO NAME)
───────────────────────────────────────────── */
const getCategoryIcon = (categoryName = "") => {
  const name = categoryName.toLowerCase();

  // Women's Wellness
  if (name.includes("women") || name.includes("fem") || name.includes("mother")) {
    return { icon: WomanIcon, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" };
  }
  // Syrup, Tonic, Kadha, Juice, Drops
  if (name.includes("syrup") || name.includes("tonic") || name.includes("kadha") || name.includes("juice") || name.includes("liquid")) {
    return { icon: SyrupIcon, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" };
  }
  // Hair Oil / Serum (if specifically oil/serum without general hair care, or even hair oil)
  if (name.includes("hair oil") || (name.includes("oil") && !name.includes("hair care"))) {
    return { icon: Droplets, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  }
  // Hair Care, Scalp
  if (name.includes("hair") || name.includes("scalp")) {
    return { icon: HairIcon, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  }
  // Powder, Churna, Spices, Face Pack Powder
  if (name.includes("powder") || name.includes("churna") || name.includes("spice") || name.includes("masala")) {
    return { icon: PowderBowlIcon, color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" };
  }
  // Skin, Skincare, Face, Scrub, Beauty
  if (name.includes("skin") || name.includes("face") || name.includes("beauty") || name.includes("scrub")) {
    return { icon: FaceCareIcon, color: "text-pink-600", bg: "bg-pink-50 border-pink-200" };
  }
  // Foods, Beverages, Tea, Drinks, Nutrition Snacks
  if (name.includes("food") || name.includes("beverage") || name.includes("tea") || name.includes("drink") || name.includes("snack")) {
    return { icon: Apple, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
  }
  // Nutrition & Supplements, Tablets, Capsules
  if (name.includes("nutrition") || name.includes("supplement") || name.includes("protein") || name.includes("vitamin") || name.includes("tablet") || name.includes("capsule")) {
    return { icon: Pill, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
  }
  // Pain Relief, Therapy Essentials
  if (name.includes("pain") || name.includes("relief") || name.includes("therapy") || name.includes("ortho")) {
    return { icon: Flame, color: "text-red-600", bg: "bg-red-50 border-red-200" };
  }
  // Health Monitoring, Devices
  if (name.includes("monitoring") || name.includes("device") || name.includes("meter") || name.includes("monitor")) {
    return { icon: Activity, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
  }
  // Health, General Wellness
  if (name.includes("health")) {
    return { icon: HeartPulse, color: "text-teal-600", bg: "bg-teal-50 border-teal-200" };
  }
  // Serum
  if (name.includes("serum")) {
    return { icon: Droplets, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  }
  // Plant & Herbs, Herbal
  if (name.includes("plant") || name.includes("herb")) {
    return { icon: Sprout, color: "text-green-600", bg: "bg-green-50 border-green-200" };
  }
  // Natural remedies, Ayurvedic
  if (name.includes("remed") || name.includes("ayurved")) {
    return { icon: FlaskConical, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  }
  // Combo, Pack, Kit
  if (name.includes("combo") || name.includes("pack") || name.includes("kit")) {
    return { icon: Package, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" };
  }

  // Fallback default
  return { icon: Leaf, color: "text-herb-leaf", bg: "bg-herb-secondary border-herb-border" };
};

/* ─────────────────────────────────────────────
   EXPLORE CATEGORIES
───────────────────────────────────────────── */
const ExploreCategories = ({ products }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = useMemo(() => {
    const seen = new Map();
    (products || []).forEach((p) => {
      const name = p.category?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.set(name.toLowerCase(), name);
      }
    });
    return [...seen.values()];
  }, [products]);

  if (categories.length === 0) return null;

  // 2 rows on desktop (4 columns x 2 rows = 8 items)
  const visibleCategories = isExpanded ? categories : categories.slice(0, 8);

  return (
    <section id="explore" className="scroll-mt-32">
      <h2 className="font-display text-center text-2xl sm:text-3xl font-semibold text-herb-ink mb-5">
        Explore Categories
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {visibleCategories.map((name) => {
          const { icon: CatIcon, color, bg } = getCategoryIcon(name);
          return (
            <Link
              key={name}
              to={`/collections/all?category=${encodeURIComponent(name.toLowerCase())}`}
              className="group flex items-center justify-between gap-1.5 sm:gap-2 rounded-xl border border-herb-border bg-herb-card px-2.5 sm:px-4 py-2.5 sm:py-3.5 min-h-[54px] sm:min-h-[60px] hover:border-herb-wood hover:bg-herb-accent/40 transition-colors"
            >
              <span className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${bg}`}>
                  <CatIcon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${color}`} />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-herb-foreground line-clamp-2 leading-tight group-hover:text-herb-ink transition-colors break-words">
                  {name}
                </span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-herb-wood shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
      </div>

      {categories.length > 8 && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-herb-border bg-herb-card text-sm font-semibold text-herb-ink hover:bg-herb-secondary hover:border-herb-wood transition-all duration-200 shadow-sm cursor-pointer"
          >
            <span>{isExpanded ? "Show Less" : "View More Categories"}</span>
            <ChevronDown
              className={`h-4 w-4 text-herb-wood transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                }`}
            />
          </button>
        </div>
      )}
    </section>
  );
};

/* ─────────────────────────────────────────────
   EXPLORE BRANDS
───────────────────────────────────────────── */
const ExploreBrands = ({ products }) => {
  const brands = useMemo(() => {
    const brandMap = new Map();

    (products || []).forEach((p) => {
      const rawName = p.brand?.trim();
      if (!rawName) return;
      const key = rawName.toLowerCase();

      // Total sold items for products of this brand (prioritize highest selling)
      const sold =
        Number(p.soldCount || p.sales || p.totalSold || 0) +
        (p.isBestSeller ? 25 : 0);

      if (!brandMap.has(key)) {
        brandMap.set(key, {
          name: rawName,
          totalSold: sold,
          productCount: 1,
        });
      } else {
        const existing = brandMap.get(key);
        existing.totalSold += sold;
        existing.productCount += 1;
      }
    });

    // Sort by highest sold count first (descending), then by product count
    return [...brandMap.values()].sort(
      (a, b) => b.totalSold - a.totalSold || b.productCount - a.productCount
    );
  }, [products]);

  if (brands.length === 0) return null;

  return (
    <section className="rounded-2xl bg-herb-secondary border border-herb-border px-5 py-6 sm:px-8">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-herb-ink">
            Explore Top Brands
          </h2>
          <p className="text-sm text-herb-muted-foreground mt-1">
            Indian brands we trust, thoughtfully curated
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {brands.map((brand) => (
          <Link
            key={brand.name}
            to={`/collections/all?brand=${encodeURIComponent(brand.name)}`}
            className="group flex items-center justify-between gap-2 rounded-xl border border-herb-border bg-herb-card px-4 py-3.5 hover:border-herb-wood hover:bg-herb-accent/40 transition-colors shadow-xs"
          >
            <span className="text-sm font-semibold text-herb-foreground truncate group-hover:text-herb-ink transition-colors min-w-0">
              {brand.name}
            </span>
            <ChevronRight className="h-4 w-4 text-herb-wood flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────
   WELCOME
───────────────────────────────────────────── */
const WelcomeSection = () => (
  <section className="relative overflow-hidden rounded-3xl border border-herb-border bg-gradient-to-b from-herb-card via-herb-secondary/35 to-herb-card px-6 py-10 sm:px-12 sm:py-14 text-center shadow-soft">
    {/* Subtle decorative background glow */}
    <div
      aria-hidden="true"
      className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-herb-wood-light/20 blur-3xl pointer-events-none"
    />

    <div className="relative max-w-3xl mx-auto flex flex-col items-center">
      {/* Pill Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-herb-card border border-herb-border shadow-xs text-herb-wood-dark text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-4">
        <Leaf className="w-3.5 h-3.5 text-herb-leaf flex-shrink-0" />
        <span>Your Trusted Wellness Marketplace</span>
      </div>

      {/* Main Headline */}
      <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold text-herb-ink leading-tight tracking-tight">
        Discover Wellness, Naturally
      </h2>

      {/* Elegant Sub-heading */}
      <p className="font-display text-base sm:text-lg text-herb-wood-dark italic mt-2.5 max-w-xl">
        Explore a world of conscious care with M Wellness Bazaar
      </p>

      {/* Decorative divider */}
      <div className="flex items-center justify-center gap-3 my-5 opacity-70">
        <span className="h-px w-10 sm:w-16 bg-herb-border" />
        <Sparkles className="w-3.5 h-3.5 text-herb-wood" />
        <span className="h-px w-10 sm:w-16 bg-herb-border" />
      </div>

      {/* Body description */}
      <p className="max-w-2xl text-sm sm:text-base text-herb-muted-foreground leading-relaxed">
        Discover thoughtfully curated wellness products, authentic Indian brands, and everyday essentials designed to bring balance, care, and well-being into your lifestyle.
      </p>

      {/* Trust & Value Pillars */}
      <div className="mt-7 pt-5 border-t border-herb-border/70 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm font-semibold text-herb-wood-dark">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-herb-secondary/70 border border-herb-border/80">
          <span className="w-1.5 h-1.5 rounded-full bg-herb-leaf" />
          Inspired by Tradition
        </span>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-herb-secondary/70 border border-herb-border/80">
          <span className="w-1.5 h-1.5 rounded-full bg-herb-wood" />
          Made for Modern Living
        </span>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-herb-secondary/70 border border-herb-border/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          100% Authentic Brands
        </span>
      </div>
    </div>
  </section>
);

/* ─────────────────────────────────────────────
   FAQ (always-visible, reference style)
───────────────────────────────────────────── */
const homeFaqs = [
  {
    question: "What can I discover at M Wellness Bazaar?",
    answer:
      "A considered collection of Indian wellness brands — from skin & body care and healthy foods to Ayurvedic devices and everyday wellness essentials, all quality-checked in one place.",
  },
  {
    question: "How do I check delivery to my location?",
    answer:
      "Delivery usually takes 3–7 business days depending on your location. You can set your delivery location from the header, and tracking details are shared after dispatch.",
  },
  {
    question: "Who can help with an order or return?",
    answer:
      "Our support team is here for you — raise a ticket from the Support page, chat with us on WhatsApp, or email info@metafitwellness.com. Returns are accepted within 7 days of delivery.",
  },
  {
    question: "How can my brand join M Wellness Bazaar?",
    answer:
      "We'd love to hear from you. Head to Become a Seller to onboard your brand, or write to info@metafitwellness.com with 'Affiliate enquiry' to partner with us.",
  },
];

const HomeFaq = () => (
  <section id="faq" className="scroll-mt-32 max-w-5xl mx-auto">
    <h2 className="font-display text-2xl sm:text-3xl font-semibold text-herb-ink text-center mb-6">
      Frequently Asked Questions
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
      {homeFaqs.map((faq, i) => (
        <details
          key={i}
          open
          className="group rounded-xl border border-herb-border bg-herb-card overflow-hidden hover:border-herb-wood/60 transition-colors shadow-2xs"
        >
          <summary className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer select-none text-sm sm:text-[15px] font-semibold text-herb-foreground hover:text-herb-ink transition-colors list-none">
            <span className="leading-snug">{faq.question}</span>
            <ChevronRight className="h-4 w-4 text-herb-wood flex-shrink-0 group-open:rotate-90 transition-transform" />
          </summary>
          <p className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-herb-muted-foreground leading-relaxed border-t border-herb-border pt-3 bg-herb-secondary/20">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  </section>
);

/* ─────────────────────────────────────────────
   TRUST STRIP
───────────────────────────────────────────── */
const TrustStrip = () => (
  <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {[
      {
        icon: ShieldCheck,
        title: "Quality guaranteed",
        desc: "Trusted Indian brands, quality-checked",
      },
      {
        icon: HeartHandshake,
        title: "Care at every step",
        desc: "WhatsApp & order support, 7-day returns",
      },
      {
        icon: Sprout,
        title: "Naturally inspired",
        desc: "Rooted in tradition, chosen for today",
      },
    ].map((item) => (
      <div
        key={item.title}
        className="flex items-start gap-3 rounded-xl border border-herb-border bg-herb-card px-4 py-3.5"
      >
        <item.icon className="h-5 w-5 text-herb-leaf flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-herb-ink">{item.title}</p>
          <p className="text-xs text-herb-muted-foreground mt-0.5">{item.desc}</p>
        </div>
      </div>
    ))}
  </section>
);

/* ─────────────────────────────────────────────
   HOME PAGE
───────────────────────────────────────────── */
const HomePage = () => {
  const dispatch = useDispatch();
  const { allProducts } = useSelector(
    (state) => state.products || { allProducts: [] }
  );

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  return (
    <div className="space-y-10 sm:space-y-14 pb-6">
      <Hero />
      <TodaysDeals products={allProducts} />
      <ExploreCategories products={allProducts} />
      <ExploreBrands products={allProducts} />
      <WelcomeSection />
      <TrustStrip />
      <HomeFaq />
    </div>
  );
};

export default HomePage;

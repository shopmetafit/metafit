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
   HERO — "Promise" (herbal banner)
───────────────────────────────────────────── */
const Hero = () => (
  <section className="relative overflow-hidden rounded-2xl shadow-soft border border-herb-border h-[320px] sm:h-[400px] lg:h-[460px]">
    {/* Banner image — fixed height, image stays still while page scrolls */}
    <div
      className="absolute inset-0 bg-cover bg-center md:bg-fixed"
      style={{ backgroundImage: "url('/herbal-texture.jpg')" }}
      aria-hidden="true"
    />
    {/* Light natural scrim — keeps the photo looking real, just enough darkening for text */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, rgba(23,19,13,0.55) 0%, rgba(23,19,13,0.25) 28%, rgba(23,19,13,0.3) 72%, rgba(23,19,13,0.55) 100%)",
      }}
      aria-hidden="true"
    />
    {/* Soft dark band behind the text block only */}
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="w-full max-w-2xl h-full bg-herb-ink/30 [mask-image:radial-gradient(closest-side,black_55%,transparent_100%)]" />
    </div>

    <div className="relative h-full px-6 sm:px-12 text-center max-w-3xl mx-auto flex flex-col items-center justify-center">
      <p className="text-[11px] sm:text-xs font-bold tracking-[0.35em] uppercase text-herb-footer-accent mb-4">
        Promise
      </p>
      <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-herb-background">
        M Wellness Bazaar
      </h1>
      <p className="mt-4 text-base sm:text-lg text-herb-background/90 font-light max-w-xl mx-auto">
        Thoughtfully chosen. Naturally inspired. For a healthier you.
      </p>
      <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
        {/* Primary CTA: Shop the bazaar */}
        <Link
          to="/collections/all"
          className="relative group overflow-hidden inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-white via-[#FFFDF9] to-[#F5E6CC] text-herb-ink text-sm sm:text-[15px] font-bold shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-amber-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 border border-white/80"
        >
          {/* Shimmer light sweep on hover */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
          />
          <span className="relative tracking-wide">Shop the bazaar</span>
          <ArrowRight className="h-4 w-4 relative text-herb-wood-dark group-hover:translate-x-1 transition-transform duration-300" />
        </Link>

        {/* Secondary CTA: Today's Deals */}
        <Link
          to="/collections/all?discountMin=10&sortBy=discount"
          className="relative group overflow-hidden inline-flex items-center gap-2.5 px-6 sm:px-7 py-3.5 rounded-full bg-black/40 hover:bg-black/60 border border-amber-300/60 hover:border-amber-300 text-white text-sm sm:text-[15px] font-semibold backdrop-blur-md shadow-lg shadow-black/25 hover:shadow-amber-400/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
        >
          <Sparkles className="h-4 w-4 text-amber-300 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 animate-pulse" />
          <span className="tracking-wide">Today's Deals</span>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-400/25 text-amber-200 text-[10px] font-bold border border-amber-300/40">
            Sale
          </span>
        </Link>
      </div>
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
          className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-herb-wood-dark hover:text-herb-ink transition-colors"
        >
          View all
          <ChevronRight className="h-4 w-4" />
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
   CATEGORY ICON RESOLVER (ACCORDING TO NAME)
───────────────────────────────────────────── */
const getCategoryIcon = (categoryName = "") => {
  const name = categoryName.toLowerCase();

  // Women's Wellness
  if (name.includes("women") || name.includes("fem") || name.includes("mother")) {
    return { icon: Heart, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" };
  }
  // Hair Care, Hair Oil, Scalp
  if (name.includes("hair") || name.includes("scalp")) {
    return { icon: Scissors, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  }
  // Skin, Skincare, Face, Scrub, Beauty
  if (name.includes("skin") || name.includes("face") || name.includes("beauty") || name.includes("scrub")) {
    return { icon: Sparkles, color: "text-pink-600", bg: "bg-pink-50 border-pink-200" };
  }
  // Foods, Beverages, Tea, Drinks, Nutrition Snacks
  if (name.includes("food") || name.includes("beverage") || name.includes("tea") || name.includes("drink") || name.includes("snack")) {
    return { icon: Apple, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
  }
  // Nutrition & Supplements
  if (name.includes("nutrition") || name.includes("supplement") || name.includes("protein") || name.includes("vitamin")) {
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
  // Oil, Serum, Liquid
  if (name.includes("oil") || name.includes("serum")) {
    return { icon: Droplets, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  }
  // Spices, Powders
  if (name.includes("spice") || name.includes("powder") || name.includes("masala")) {
    return { icon: Utensils, color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" };
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleCategories.map((name) => {
          const { icon: CatIcon, color, bg } = getCategoryIcon(name);
          return (
            <Link
              key={name}
              to={`/collections/all?category=${encodeURIComponent(name.toLowerCase())}`}
              className="group flex items-center justify-between gap-2 rounded-xl border border-herb-border bg-herb-card px-4 py-3.5 hover:border-herb-wood hover:bg-herb-accent/40 transition-colors"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${bg}`}>
                  <CatIcon className={`h-4 w-4 ${color}`} />
                </span>
                <span className="text-sm font-semibold text-herb-foreground truncate group-hover:text-herb-ink transition-colors">
                  {name}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-herb-wood flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
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

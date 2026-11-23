import { useState, useEffect } from "react";
import { ChevronUp, Phone, Mail, Facebook, Instagram, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const defaultTopBlogs = [
  { label: "Herbal Shampoo Hair Care", href: "/blog/herbal-shampoo-gentle-natural-hair-care-for-strong-healthy-hair" },
  { label: "Aloe Amrut Gel Rose Care", href: "/blog/aloe-amrut-gel-rose-natural-hydration-for-glowing-skin-healthy-hair-daily-care" },
  { label: "Hair Tonic Oil Routine", href: "/blog/hair-tonic-oil-ayurvedic-solution-for-strong-roots-reduced-hair-fall-healthy-scalp" },
  { label: "Moisturising Cream Guide", href: "/blog/moisturising-cream-with-pomegranate-hyaluronic-acid-deep-hydration-for-soft-glowing-skin" },
  { label: "Jalneti Pot Complete Guide", href: "/blog/jalneti-pot-a-complete-guide-to-natural-nasal-cleansing-for-better-breathing" },
];

const defaultTopProducts = [
  { label: "Respyr Device", href: "/product/693919bd5617010689065d56" },
  { label: "Jalneti Pot", href: "/product/69391b6e5617010689065d6f" },
  { label: "Eye Cup", href: "/product/69391bde5617010689065d76" },
  { label: "Herbal Shampoo", href: "/product/69393de101ea75abcd97d034" },
  { label: "Aloe Amrut Gel – Rose", href: "/product/69393d1101ea75abcd97d025" },
];

const baseFooterColumns = [
  {
    heading: "Get to Know Us",
    links: [
      { label: "Our story", href: "/aboutUs" },
      { label: "The Wellness Journal", href: "/blog" },
      { label: "Frequently asked questions", href: "/support" },
      { label: "Contact Us", href: "/contactUs" },
      { label: "My Orders", href: "/my-orders" },
    ],
  },
  {
    heading: "Grow with Us",
    links: [
      { label: "Become a Seller", href: "/vendor-register" },
      { label: "Become a Vendor", href: "https://partner.mwellnessbazaar.com/become-vendor", external: true },
      { label: "Affiliate enquiries", href: "mailto:info@metafitwellness.com?subject=Affiliate%20enquiry", external: true },
      { label: "@mwellnessbazaar", href: "https://www.instagram.com/mwellnessbazaar", external: true },
      { label: "mWellness Bazaar", href: "https://www.facebook.com/mwellnessbazaar", external: true },
    ],
  },
  {
    heading: "Here for You",
    links: [
      { label: "+91 88299 12389", href: "tel:+918829912389" },
      { label: "info@metafitwellness.com", href: "mailto:info@metafitwellness.com" },
      { label: "WhatsApp & order support", href: "https://wa.me/918829912389", external: true },
      { label: "Help & Support Tickets", href: "/support" },
      { label: "Returns & refund enquiries", href: "/refund-policy" },
    ],
  },
];

const Footer = () => {
  const [topBlogs, setTopBlogs] = useState(defaultTopBlogs);
  const [topProducts, setTopProducts] = useState(defaultTopProducts);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    let isMounted = true;
    const fetchTopData = async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) return;

      try {
        const [blogsRes, productsRes] = await Promise.allSettled([
          axios.get(`${backendUrl}/api/blogs?limit=5`),
          axios.get(`${backendUrl}/api/products?limit=5&sortBy=popularity`),
        ]);

        if (isMounted && blogsRes.status === "fulfilled" && blogsRes.value.data?.blogs?.length) {
          setTopBlogs(
            blogsRes.value.data.blogs.slice(0, 5).map((b) => ({
              label: b.title.length > 32 ? `${b.title.slice(0, 30)}…` : b.title,
              href: `/blog/${b.slug}`,
            }))
          );
        }

        if (isMounted && productsRes.status === "fulfilled") {
          const list = productsRes.value.data?.products || productsRes.value.data;
          if (Array.isArray(list) && list.length > 0) {
            setTopProducts(
              list.slice(0, 5).map((p) => ({
                label: p.name.length > 32 ? `${p.name.slice(0, 30)}…` : p.name,
                href: `/product/${p.slug || p._id}`,
              }))
            );
          }
        }
      } catch (err) {
        // Silently keep default curated lists
      }
    };

    fetchTopData();
    return () => {
      isMounted = false;
    };
  }, []);

  const allColumns = [
    baseFooterColumns[0], // Get to Know Us
    {
      heading: "Product",
      links: topProducts,
    },
    {
      heading: "Blog",
      links: topBlogs,
    },
    baseFooterColumns[1], // Grow with Us
    baseFooterColumns[2], // Here for You
  ];

  return (
    <footer className="mt-10">
      {/* ── Back to Top ── */}
      <button
        onClick={scrollToTop}
        className="w-full bg-transparent hover:bg-herb-secondary/40 text-herb-ink border-t border-herb-border text-sm font-semibold py-3.5 flex items-center justify-center gap-2 transition-colors cursor-pointer group"
      >
        <ChevronUp className="h-4 w-4 text-herb-wood group-hover:-translate-y-0.5 transition-transform" />
        <span>Back to top</span>
      </button>

      {/* ── Tagline & Links ── */}
      <div className="bg-herb-footer text-white">
        <div className="max-w-screen-2xl mx-auto px-6 pt-5 pb-8 sm:pt-6 sm:pb-9">
          <div className="text-center mb-6">
            <p className="font-display text-base sm:text-lg text-white/95 tracking-wide">
              A little care. A better every day.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-7">
            {allColumns.map((col) => (
              <div key={col.heading}>
                <div className="inline-block w-fit bg-white/10 border border-white/15 rounded-2xl px-3.5 sm:px-4 py-1.5 sm:py-2 mb-3.5 sm:mb-4">
                  <h3 className="font-display text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                    {col.heading}
                  </h3>
                </div>
                <ul className="space-y-2.5 px-1">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white/80 hover:text-white transition-colors block truncate"
                          title={link.label}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-xs text-white/80 hover:text-white transition-colors block truncate"
                          title={link.label}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

          {/* ── Trust Badges Row (unboxed, white font) ── */}
          <div className="bg-herb-footer border-t border-white/10">
            <div className="max-w-screen-2xl mx-auto px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { icon: "🌿", title: "Thoughtfully Chosen", desc: "Trusted Indian wellness brands" },
                  { icon: "🔒", title: "Secure Payments", desc: "100% safe & encrypted transactions" },
                  { icon: "📦", title: "Fast Shipping", desc: "Across India" },
                ].map((badge) => (
                  <div
                    key={badge.title}
                    className="flex items-center gap-3 py-1"
                  >
                    <span className="text-2xl flex-shrink-0">{badge.icon}</span>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">{badge.title}</p>
                      <p className="text-xs text-white/85">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bottom Bar ── */}
          <div className="bg-herb-footer border-t border-white/10">
            <div className="max-w-screen-2xl mx-auto px-6 py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-white/95 border border-white/20 flex items-center justify-center shadow-sm">
                    <img
                      src="/metafit-logo.png"
                      alt="M Wellness Bazaar"
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>
                  <div className="leading-tight">
                    <div className="font-display text-sm font-semibold text-white">M Wellness Bazaar</div>
                    <div className="text-[11px] text-white/80">MetaFit Wellness</div>
                  </div>
                </Link>

                {/* Social Links */}
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.facebook.com/mwellnessbazaar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center border border-white/15 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4 text-white" />
                  </a>
                  <a
                    href="https://www.instagram.com/mwellnessbazaar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center border border-white/15 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4 text-white" />
                  </a>
                  <a
                    href="https://wa.me/918829912389"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center border border-white/15 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4 text-white" />
                  </a>
                  <a
                    href="tel:+918829912389"
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center border border-white/15 transition-colors"
                    aria-label="Phone"
                  >
                    <Phone className="h-4 w-4 text-white" />
                  </a>
                  <a
                    href="mailto:info@metafitwellness.com"
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center border border-white/15 transition-colors"
                    aria-label="Email"
                  >
                    <Mail className="h-4 w-4 text-white" />
                  </a>
                </div>

                {/* Copyright + Policies */}
                <div className="flex flex-col items-center md:items-end gap-1.5">
                  <p className="text-xs text-white/80">
                    © mWellness Bazaar · <span className="text-white font-semibold">MetaFit Wellness</span>
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {[
                      { label: "Shipping", href: "/shipping-policy" },
                      { label: "Privacy", href: "/privacy-policy" },
                      { label: "Terms & Conditions", href: "/terms-and-conditions" },
                      { label: "Refund Policy", href: "/refund-policy" },
                      { label: "Pricing Policy", href: "/pricing-policy" },
                    ].map((p) => (
                      <Link
                        key={p.label}
                        to={p.href}
                        className="text-xs text-white/80 hover:text-white transition-colors"
                      >
                        {p.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      );
    };

    export default Footer;

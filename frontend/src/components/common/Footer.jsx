import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Phone, Mail, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const footerColumns = [
  {
    heading: "Get to Know Us",
    links: [
      { label: "About M Wellness Bazaar", href: "/aboutUs" },
      { label: "Blog & Wellness Tips", href: "/blog" },
      { label: "Become a Vendor", href: "/vendor-register" },
    ],
  },
  {
    heading: "Connect with Us",
    links: [
      { label: "Contact Us", href: "/contactUs" },
      { label: "WhatsApp Us", href: "https://wa.me/918302270668", external: true },
      { label: "Call: +91 88299 12389", href: "tel:+918829912389" },
      { label: "Email Us", href: "mailto:info@metafitwellness.com" },
    ],
  },
  {
    heading: "Make Money with Us",
    links: [
      { label: "Sell on M Wellness Bazaar", href: "/vendor-register" },
      { label: "Become an Affiliate", href: "/vendor-register" },
    ],
  },
  {
    heading: "Let Us Help You",
    links: [
      { label: "My Orders", href: "/my-orders" },
      { label: "Returns & Refunds", href: "/refund-policy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
    ],
  },
];

const Footer = () => {
  const [policyOpen, setPolicyOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPolicyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer>
      {/* ── Back to Top ── */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#4A0712] hover:bg-[#650B18] text-[#FFF8E7] text-sm font-semibold py-3.5 flex items-center justify-center gap-2 transition-colors border-t border-[#D4A017]/30"
      >
        <ChevronUp className="h-4 w-4 text-[#F2C94C]" />
        Back to top
      </button>

      {/* ── 4-Column Links ── */}
      <div className="bg-[#3A0610] text-[#FFF8E7]">
        <div className="max-w-screen-2xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerColumns.map((col) => (
              <div key={col.heading}>
                <h3 className="text-sm font-bold text-[#F2C94C] mb-4">{col.heading}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#FFF8E7]/80 hover:text-[#F2C94C] transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-xs text-[#FFF8E7]/80 hover:text-[#F2C94C] transition-colors"
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

      {/* ── Trust Badges Row ── */}
      <div className="bg-[#4A0712] border-t border-[#D4A017]/20">
        <div className="max-w-screen-2xl mx-auto px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "✓", title: "Quality Guaranteed", desc: "Premium wellness products only" },
              { icon: "🔒", title: "Secure Payments", desc: "100% safe & encrypted transactions" },
              { icon: "📦", title: "Fast Shipping", desc: "Across India" },
            ].map((badge) => (
              <div
                key={badge.title}
                className="flex items-center gap-3 bg-[#3A0610]/60 border border-[#D4A017]/30 rounded-lg px-4 py-3"
              >
                <span className="text-xl flex-shrink-0 text-[#F2C94C]">{badge.icon}</span>
                <div>
                  <p className="text-xs font-bold text-[#FFF8E7]">{badge.title}</p>
                  <p className="text-xs text-[#FFF8E7]/70">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="bg-[#240309] border-t border-[#D4A017]/20">
        <div className="max-w-screen-2xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4A017] to-[#F2C94C] rounded-lg flex items-center justify-center">
                <span className="text-[#3A0610] font-black text-base">M</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-black text-[#FFF8E7]">M Wellness Bazaar</div>
                <div className="text-xs text-[#F2C94C]">From Ancient Healing to AI Living</div>
              </div>
            </Link>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              <a
                href="https://www.facebook.com/mwellnessbazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-[#4A0712] hover:bg-[#650B18] rounded-lg flex items-center justify-center border border-[#D4A017]/40 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 text-[#F2C94C]" />
              </a>
              <a
                href="https://www.instagram.com/mwellnessbazaar"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-[#4A0712] hover:bg-[#650B18] rounded-lg flex items-center justify-center border border-[#D4A017]/40 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 text-[#F2C94C]" />
              </a>
              <a
                href="tel:+918829912389"
                className="w-8 h-8 bg-[#4A0712] hover:bg-[#650B18] rounded-lg flex items-center justify-center border border-[#D4A017]/40 transition-colors"
                aria-label="Phone"
              >
                <Phone className="h-4 w-4 text-[#F2C94C]" />
              </a>
              <a
                href="mailto:info@metafitwellness.com"
                className="w-8 h-8 bg-[#4A0712] hover:bg-[#650B18] rounded-lg flex items-center justify-center border border-[#D4A017]/40 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4 text-[#F2C94C]" />
              </a>
            </div>

            {/* Copyright + Policies */}
            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="text-xs text-[#FFF8E7]/70">
                © 2025 <span className="text-[#FFF8E7] font-semibold">MetaFit Wellness</span>. All Rights Reserved.
              </p>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setPolicyOpen(!policyOpen)}
                  className="flex items-center gap-1 text-xs text-[#F2C94C] hover:text-[#FFF8E7] transition-colors"
                >
                  Policies{" "}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${policyOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {policyOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-44 bg-[#FFFDF5] rounded-lg shadow-xl border border-[#D4A017]/40 z-50 overflow-hidden">
                    <ul className="py-1 text-xs">
                      {[
                        { label: "🔒 Privacy Policy", href: "/privacy-policy" },
                        { label: "💰 Refund Policy", href: "/refund-policy" },
                        { label: "📦 Shipping Policy", href: "/shipping-policy" },
                        { label: "📋 Terms & Conditions", href: "/terms-and-conditions" },
                        { label: "💵 Pricing Policy", href: "/pricing-policy" },
                      ].map((p) => (
                        <li key={p.label}>
                          <Link
                            to={p.href}
                            onClick={() => setPolicyOpen(false)}
                            className="block px-3 py-2 text-[#3A0610] hover:bg-[#FFF8E7] hover:text-[#7A1522] transition-colors"
                          >
                            {p.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

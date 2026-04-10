import Hero from "../components/Layout/Hero";
import ProductGrid from "../components/Products/ProductGrid";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productSlice";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronRight, Truck, ShieldCheck, RefreshCw, Headphones } from "lucide-react";

const categoryTiles = [
  { icon: "🌿", name: "Ayurvedic Devices", desc: "Traditional Healing", link: "/collections/all?category=ayurvedic devices", bg: "bg-green-50", border: "border-green-200", hover: "hover:border-green-400" },
  { icon: "❤️", name: "Health Monitoring", desc: "Smart Health Tech", link: "/collections/all?category=health monitoring", bg: "bg-red-50", border: "border-red-200", hover: "hover:border-red-400" },
  { icon: "🥜", name: "Snacks & Protein", desc: "Nutrition & Energy", link: "/collections/all?category=snacks & protein", bg: "bg-amber-50", border: "border-amber-200", hover: "hover:border-amber-400" },
  { icon: "💆", name: "Skin & Body Care", desc: "Natural Skincare", link: "/collections/all?category=skin & body care", bg: "bg-pink-50", border: "border-pink-200", hover: "hover:border-pink-400" },
  { icon: "🛁", name: "Panchakarma", desc: "Detox & Therapy", link: "/collections/all?category=panchakarma equipment", bg: "bg-purple-50", border: "border-purple-200", hover: "hover:border-purple-400" },
  { icon: "🎒", name: "Accessories", desc: "Wellness Essentials", link: "/collections/all?category=accessories", bg: "bg-cyan-50", border: "border-cyan-200", hover: "hover:border-cyan-400" },
];

const trustBadges = [
  { icon: <Truck className="h-6 w-6 text-[#047ca8]" />, title: "Free Shipping", desc: "On orders over ₹999" },
  { icon: <ShieldCheck className="h-6 w-6 text-[#047ca8]" />, title: "Secure Payment", desc: "SSL encrypted checkout" },
  { icon: <RefreshCw className="h-6 w-6 text-[#047ca8]" />, title: "Easy Returns", desc: "10-day money back" },
  { icon: <Headphones className="h-6 w-6 text-[#047ca8]" />, title: "24/7 Support", desc: "Expert wellness advice" },
];

const testimonials = [
  { name: "Priya Sharma", location: "Delhi", review: "MetaFit products have completely transformed my wellness routine. Excellent quality and customer service!", rating: 5 },
  { name: "Rajesh Kumar", location: "Mumbai", review: "Fast delivery and authentic products. I've been ordering from MetaFit for 6 months now!", rating: 5 },
  { name: "Anjali Desai", location: "Bangalore", review: "Great prices and incredible wellness products. The support team is very helpful!", rating: 5 },
  { name: "Vikram Singh", location: "Jaipur", review: "Best wellness products in India! Delivered in 4 days. Highly recommended to everyone!", rating: 5 },
  { name: "Neha Patel", location: "Gujarat", review: "I love MetaFit! Premium quality products at affordable prices. Perfect!", rating: 5 },
  { name: "Arjun Verma", location: "Pune", review: "Excellent service! My health has improved so much. Thank you MetaFit!", rating: 5 },
  { name: "Pooja Gupta", location: "Hyderabad", review: "Amazing quality and prompt delivery. Customer service is outstanding!", rating: 5 },
  { name: "Sanjay Rao", location: "Chennai", review: "Genuine products at great prices. I'm a regular customer now. Highly satisfied!", rating: 5 },
  { name: "Divya Singh", location: "Chandigarh", review: "MetaFit changed my life! Super fast shipping and authentic products!", rating: 5 },
  { name: "Manoj Prabhu", location: "Kolkata", review: "Best wellness store I've found! Trusted by me and my family for wellness needs.", rating: 5 },
  { name: "Sneha Menon", location: "Kochi", review: "Phenomenal experience! Quality products and exceptional customer care. 5 stars!", rating: 5 },
  { name: "Ravi Chopra", location: "Lucknow", review: "I recommend MetaFit to all my friends! Authentic and affordable wellness products!", rating: 5 },
];

/* ── Section header reused across sections (Amazon-style) ── */
const SectionHeader = ({ title, link }) => (
  <div className="flex items-center justify-between mb-4 px-1">
    <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
    {link && (
      <Link
        to={link}
        className="flex items-center gap-0.5 text-sm text-[#047ca8] hover:text-[#06b6d4] font-semibold transition-colors"
      >
        See more <ChevronRight className="h-4 w-4" />
      </Link>
    )}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  const itemsPerPage = 6;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedTestimonials = testimonials.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    dispatch(fetchProductsByFilters({ search: "a", limit: 12 }));
  }, [dispatch]);

  return (
    <div className="w-full min-h-screen bg-[#f0f2f2]">

      {/* ── Hero / Deal Banner ── */}
      <Hero />

      {/* ── Trust Badges Strip ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="flex items-center gap-3 py-4 px-4 md:px-6">
                <div className="flex-shrink-0">{badge.icon}</div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{badge.title}</p>
                  <p className="text-xs text-gray-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Shop by Category ── */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <SectionHeader title="Shop by Category" link="/collections/all" />
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categoryTiles.map((cat) => (
              <Link
                key={cat.name}
                to={cat.link}
                className={`flex flex-col items-center text-center p-4 rounded-lg border-2 ${cat.bg} ${cat.border} ${cat.hover} transition-all duration-200 hover:shadow-md group`}
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                  {cat.icon}
                </span>
                <p className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{cat.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Our Products ── */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <SectionHeader title="Featured Products" link="/collections/all" />
          <ProductGrid products={products} loading={loading} error={error} />
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/collections/all")}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-cyan-200 transition-all duration-300 hover:scale-105"
            >
              See All Products <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* ── Why Choose MetaFit ── */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <SectionHeader title="Why Choose MetaFit" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🏆", title: "Premium Quality", desc: "100% authentic wellness products from trusted manufacturers" },
              { icon: "🚚", title: "Fast Shipping", desc: "Free shipping on orders over ₹999. Delivered in 5–7 days" },
              { icon: "💯", title: "Money Back Guarantee", desc: "Not satisfied? Full refund within 10 days, no questions asked" },
              { icon: "🔒", title: "Secure Payment", desc: "SSL encrypted checkout — your data is always protected" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center text-center p-5 rounded-lg bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all duration-200"
              >
                <span className="text-4xl mb-3">{item.icon}</span>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Deal Banner ── */}
        <section
          className="rounded-lg overflow-hidden bg-gradient-to-r from-[#022824] via-[#0a3d35] to-[#047ca8] text-white p-8 md:p-12 text-center shadow-sm"
        >
          <p className="text-teal-300 text-sm font-semibold uppercase tracking-widest mb-2">Limited Time Offer</p>
          <h2 className="text-2xl md:text-4xl font-bold mb-3">Start Your Wellness Journey Today</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto text-sm md:text-base">
            Join 50,000+ customers who have transformed their health with our premium wellness products.
          </p>
          <button
            onClick={() => navigate("/collections/all")}
            className="inline-flex items-center gap-2 bg-white text-[#047ca8] font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          >
            Explore All Products <ChevronRight className="h-4 w-4" />
          </button>
        </section>

        {/* ── Stats Row ── */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <div className="grid grid-cols-3 divide-x divide-gray-200 text-center">
            {[
              { value: "50,000+", label: "Happy Customers", sub: "Across India" },
              { value: "1000+", label: "Premium Products", sub: "Carefully curated" },
              { value: "4.9/5", label: "Average Rating", sub: "Verified reviews" },
            ].map((stat) => (
              <div key={stat.label} className="py-4 px-2">
                <div className="text-2xl md:text-3xl font-black text-[#047ca8] mb-1">{stat.value}</div>
                <p className="text-sm font-semibold text-gray-800">{stat.label}</p>
                <p className="text-xs text-gray-500">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Customer Reviews ── */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <SectionHeader title="What Our Customers Say" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {displayedTestimonials.map((t, i) => (
              <div
                key={i}
                className="p-5 border border-gray-100 rounded-lg hover:border-teal-200 hover:shadow-md transition-all duration-200 bg-gray-50"
              >
                <div className="flex items-center gap-0.5 mb-3 text-yellow-400">
                  {"★".repeat(t.rating)}
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">"{t.review}"</p>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location} · Verified Buyer</p>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-40 bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded text-sm font-semibold transition-colors ${
                  currentPage === page
                    ? "bg-gradient-to-r from-[#047ca8] to-[#06b6d4] text-white shadow"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-40 bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Next →
            </button>
          </div>
        </section>

        {/* ── SEO Content ── */}
        <section className="space-y-4">
          {/* About */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
              About M Wellness Bazaar — Your Trusted Wellness Store
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Welcome to M Wellness Bazaar, India's leading online wellness and healthcare products platform. We are dedicated to providing authentic, premium-quality wellness products that help millions of people achieve their health and fitness goals. Our mission is to make wellness accessible to everyone by offering a curated collection of supplements, wellness devices, and organic health products at competitive prices.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              With fast shipping, secure payments, and a 10-day money-back guarantee, shopping at M Wellness Bazaar is convenient and risk-free.
            </p>
          </div>

          {/* Why Wellness Matters */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Why Wellness Matters in Today's World</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-5 rounded-lg border border-cyan-100">
                <h4 className="font-bold text-gray-900 mb-2 text-sm">Physical Wellness Benefits</h4>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  <li>✓ Increased energy and stamina throughout the day</li>
                  <li>✓ Better immune system function and disease resistance</li>
                  <li>✓ Improved metabolism and healthy weight management</li>
                  <li>✓ Stronger bones and improved muscle health</li>
                  <li>✓ Better sleep quality and faster recovery</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-5 rounded-lg border border-cyan-100">
                <h4 className="font-bold text-gray-900 mb-2 text-sm">Mental & Emotional Wellness</h4>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  <li>✓ Reduced stress and anxiety levels</li>
                  <li>✓ Better focus and mental clarity</li>
                  <li>✓ Improved mood and emotional stability</li>
                  <li>✓ Enhanced self-confidence and self-esteem</li>
                  <li>✓ Better overall quality of life and happiness</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Why Choose M Wellness Bazaar */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Why Choose M Wellness Bazaar?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "100% Authentic Products", desc: "Sourced directly from manufacturers and authorized distributors." },
                { title: "Competitive Pricing", desc: "Direct sourcing means best prices on premium wellness products." },
                { title: "Expert Customer Support", desc: "Wellness experts available 24/7 for personalized recommendations." },
                { title: "10-Day Money Back Guarantee", desc: "Not satisfied? Return within 10 days for a full refund." },
                { title: "Secure Payment Options", desc: "Credit cards, UPI, net banking with SSL encryption." },
                { title: "Pan-India Delivery", desc: "Fast and reliable shipping to all major cities." },
              ].map((item) => (
                <div key={item.title} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                  <p className="text-sm font-bold text-gray-900 mb-1">✓ {item.title}</p>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wellness Tips */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Wellness Tips & Health Guidance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "Daily Hydration", desc: "Aim for 8–10 glasses of water daily to regulate body temperature, aid digestion and improve nutrient absorption." },
                { title: "Regular Exercise", desc: "Aim for 150 minutes of moderate activity weekly to strengthen your heart and release mood-boosting endorphins." },
                { title: "Balanced Nutrition", desc: "Focus on whole foods and consider supplements to fill nutritional gaps for consistent energy." },
                { title: "Quality Sleep", desc: "Adults need 7–9 hours nightly. Establish a schedule and avoid screens before bed." },
                { title: "Stress Management", desc: "Practice meditation, yoga, or deep breathing. M Wellness Bazaar offers meditation tools and stress-relief products." },
                { title: "Regular Health Checkups", desc: "Preventive care is key. Use wellness devices to track your health metrics at home." },
              ].map((tip) => (
                <div key={tip.title} className="p-4 bg-white rounded border-t-4 border-[#06b6d4] shadow-sm">
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{tip.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-3">
              {[
                { q: "Are all products on M Wellness Bazaar authentic?", a: "Yes, absolutely. We source products directly from manufacturers and authorized distributors. Every product undergoes quality verification before being listed on our platform." },
                { q: "Can I return products if not satisfied?", a: "Yes, M Wellness Bazaar offers a 10-day money-back guarantee. If you're not satisfied with any product, return it within 10 days for a full refund." },
                { q: "Are supplements safe to consume?", a: "All products on M Wellness Bazaar are from reputable manufacturers following GMP standards. However, consult a healthcare professional before starting any supplement regimen." },
                { q: "Do you have wellness experts available for consultation?", a: "Yes, our wellness experts are available 24/7 to answer questions and provide personalized recommendations based on your health goals." },
                { q: "What payment methods does M Wellness Bazaar accept?", a: "We accept all major payment methods including credit cards, debit cards, UPI, net banking, and digital wallets. All transactions are encrypted and secure." },
              ].map((faq) => (
                <div key={faq.q} className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm font-bold text-gray-900 mb-1">Q: {faq.q}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">A: {faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;

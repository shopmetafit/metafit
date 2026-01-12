import Hero from "../components/Layout/Hero";





import ProductGrid from "../components/Products/ProductGrid";

import { useDispatch, useSelector } from "react-redux";
import { fetchProductsByFilters } from "../redux/slices/productSlice";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);

  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Delhi",
      review: "MetaFit products have completely transformed my wellness routine. Excellent quality and customer service!",
      rating: 5
    },
    {
      name: "Rajesh Kumar",
      location: "Mumbai",
      review: "Fast delivery and authentic products. I've been ordering from MetaFit for 6 months now!",
      rating: 5
    },
    {
      name: "Anjali Desai",
      location: "Bangalore",
      review: "Great prices and incredible wellness products. The support team is very helpful!",
      rating: 5
    },
    {
      name: "Vikram Singh",
      location: "Jaipur",
      review: "Best wellness products in India! Delivered in 4 days. Highly recommended to everyone!",
      rating: 5
    },
    {
      name: "Neha Patel",
      location: "Gujarat",
      review: "I love MetaFit! Premium quality products at affordable prices. Perfect!",
      rating: 5
    },
    {
      name: "Arjun Verma",
      location: "Pune",
      review: "Excellent service! My health has improved so much. Thank you MetaFit!",
      rating: 5
    },
    {
      name: "Pooja Gupta",
      location: "Hyderabad",
      review: "Amazing quality and prompt delivery. Customer service is outstanding!",
      rating: 5
    },
    {
      name: "Sanjay Rao",
      location: "Chennai",
      review: "Genuine products at great prices. I'm a regular customer now. Highly satisfied!",
      rating: 5
    },
    {
      name: "Divya Singh",
      location: "Chandigarh",
      review: "MetaFit changed my life! Super fast shipping and authentic products!",
      rating: 5
    },
    {
      name: "Manoj Prabhu",
      location: "Kolkata",
      review: "Best wellness store I've found! Trusted by me and my family for wellness needs.",
      rating: 5
    },
    {
      name: "Sneha Menon",
      location: "Kochi",
      review: "Phenomenal experience! Quality products and exceptional customer care. 5 stars!",
      rating: 5
    },
    {
      name: "Ravi Chopra",
      location: "Lucknow",
      review: "I recommend MetaFit to all my friends! Authentic and affordable wellness products!",
      rating: 5
    }
  ];

  const itemsPerPage = 6;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedTestimonials = testimonials.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    dispatch(
      fetchProductsByFilters({
        search: "a",
        limit: 12,
      })
    );
  }, [dispatch]);

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-white">
      <Hero />
      
      <div className="bg-gradient-to-b from-gray-50 to-white">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
           {/* Our Products Section */}
           <section className="py-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
             <div className="mb-12">
               <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-900 mb-3 animate-in fade-in slide-in-from-left duration-700">
                 Our Products
               </h2>
               <p className="text-center text-gray-600 text-lg animate-in fade-in duration-700 delay-100">Discover premium wellness products that blend ancient healing wisdom with modern innovation.</p>
               <div className="w-20 h-1 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] mx-auto mt-4 animate-in fade-in scale-in duration-700 delay-300"></div>
             </div>
             <ProductGrid products={products} loading={loading} error={error} />
           </section>

           {/* Why Choose Us Section */}
           <section className="py-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
             <div className="mb-12">
               <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-900 mb-3 animate-in fade-in slide-in-from-left duration-700">
                 Why Choose MetaFit
               </h2>
               <p className="text-center text-gray-600 text-lg animate-in fade-in duration-700 delay-100">We&apos;re committed to your wellness journey with premium quality and exceptional service</p>
               <div className="w-20 h-1 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] mx-auto mt-4 animate-in fade-in scale-in duration-700 delay-300"></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                 <div className="text-4xl mb-4">🏆</div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Quality</h3>
                 <p className="text-gray-600">100% authentic wellness products sourced from trusted manufacturers</p>
               </div>
               <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                 <div className="text-4xl mb-4">🚚</div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Shipping</h3>
                 <p className="text-gray-600">Free nationwide shipping on orders over ₹500. Delivery in 5-7 business days</p>
               </div>
               <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                 <div className="text-4xl mb-4">💯</div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Money Back Guarantee</h3>
                 <p className="text-gray-600">Not satisfied? Get 100% refund within 10 days, no questions asked</p>
               </div>
               <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
                 <div className="text-4xl mb-4">🔒</div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payment</h3>
                 <p className="text-gray-600">Your data is protected with SSL encryption. 100% safe checkout</p>
               </div>
             </div>
           </section>

           {/* Top Categories Section */}
           <section className="py-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
             <div className="mb-12">
               <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-900 mb-3 animate-in fade-in slide-in-from-left duration-700">
                 Shop by Category
               </h2>
               <p className="text-center text-gray-600 text-lg animate-in fade-in duration-700 delay-100">Explore our wellness categories and find exactly what you need</p>
               <div className="w-20 h-1 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] mx-auto mt-4 animate-in fade-in scale-in duration-700 delay-300"></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div className="bg-gradient-to-br from-[#047ca8] to-[#06b6d4] rounded-lg p-8 text-white cursor-pointer hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                 <div className="text-5xl mb-4">💊</div>
                 <h3 className="text-2xl font-bold mb-2">Supplements</h3>
                 <p className="text-blue-100">Health boosting vitamins & nutritional supplements</p>
               </div>
               <div className="bg-gradient-to-br from-[#06b6d4] to-[#0891b2] rounded-lg p-8 text-white cursor-pointer hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                 <div className="text-5xl mb-4">🧘</div>
                 <h3 className="text-2xl font-bold mb-2">Wellness Devices</h3>
                 <p className="text-blue-100">Smart health tracking & wellness equipment</p>
               </div>
               <div className="bg-gradient-to-br from-[#0891b2] to-[#06b6d4] rounded-lg p-8 text-white cursor-pointer hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                 <div className="text-5xl mb-4">🌿</div>
                 <h3 className="text-2xl font-bold mb-2">Organic Products</h3>
                 <p className="text-blue-100">Natural & organic wellness solutions</p>
               </div>
             </div>
           </section>

           {/* Testimonials Section */}
           <section className="py-12 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 md:px-12">
             <div className="mb-12">
               <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-900 mb-3 animate-in fade-in slide-in-from-left duration-700">
                 What Our Customers Say
               </h2>
               <div className="w-20 h-1 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] mx-auto mt-4 animate-in fade-in scale-in duration-700 delay-300"></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
               {displayedTestimonials.map((testimonial, index) => (
                 <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow animate-in fade-in slide-in-from-bottom-6 duration-700">
                   <div className="flex items-center mb-4">
                     <div className="text-yellow-400">{"⭐".repeat(testimonial.rating)}</div>
                   </div>
                   <p className="text-gray-600 mb-4">&quot;{testimonial.review}&quot;</p>
                   <p className="font-bold text-gray-900">{testimonial.name}</p>
                   <p className="text-gray-500 text-sm">{testimonial.location} | Verified Buyer</p>
                 </div>
               ))}
             </div>

             {/* Pagination */}
             <div className="flex justify-center items-center gap-2 mt-8">
               <button
                 onClick={() => setCurrentPage(1)}
                 disabled={currentPage === 1}
                 className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                   currentPage === 1
                     ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                     : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                 }`}
               >
                 ← Prev
               </button>
               {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                 <button
                   key={page}
                   onClick={() => setCurrentPage(page)}
                   className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                     currentPage === page
                       ? "bg-gradient-to-r from-[#047ca8] to-[#06b6d4] text-white"
                       : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                   }`}
                 >
                   {page}
                 </button>
               ))}
               <button
                 onClick={() => setCurrentPage(totalPages)}
                 disabled={currentPage === totalPages}
                 className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                   currentPage === totalPages
                     ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                     : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                 }`}
               >
                 Next →
               </button>
             </div>
           </section>

           {/* CTA Section */}
           <section className="py-16 bg-gradient-to-r from-[#047ca8] to-[#06b6d4] rounded-2xl text-white text-center animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500 px-8">
             <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Wellness Journey Today</h2>
             <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">Join thousands of customers who have transformed their health with our premium wellness products</p>
             <button onClick={() => navigate("/collections/all")} className="bg-white text-[#047ca8] font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
               Explore All Products
             </button>
           </section>

           {/* SEO Content Section */}
           <section className="py-16 bg-white">
             <div className="space-y-12">
               {/* About M Wellness Bazaar */}
               <div className="bg-gray-50 p-8 rounded-lg">
                 <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About M Wellness Bazaar - Your Trusted Wellness Store</h2>
                 <p className="text-gray-700 text-lg mb-4">
                   Welcome to M Wellness Bazaar, India&apos;s leading online wellness and healthcare products platform. We are dedicated to providing authentic, premium-quality wellness products that help millions of people achieve their health and fitness goals. Our mission is to make wellness accessible to everyone by offering a curated collection of supplements, wellness devices, and organic health products at competitive prices.
                 </p>
                 <p className="text-gray-700 text-lg mb-4">
                   At M Wellness Bazaar, we understand that true wellness is not just about physical health but also mental well-being and overall lifestyle improvement. For this reason, we have carefully selected each product in our collection from trusted manufacturers and suppliers who share our commitment to quality and customer satisfaction. Whether you are looking to boost your immunity, improve your fitness levels, or enhance your overall well-being, M Wellness Bazaar has the perfect solution for you.
                 </p>
                 <p className="text-gray-700 text-lg">
                   Our online wellness store operates with transparency and integrity. We believe in empowering our customers with knowledge about wellness products and helping them make informed decisions. With fast shipping, secure payments, and a 10-day money-back guarantee, shopping at M Wellness Bazaar is not just convenient—it&apos;s also risk-free.
                 </p>
               </div>

               {/* Why Wellness Matters */}
               <div className="bg-white border border-gray-200 p-8 rounded-lg">
                 <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Why Wellness Matters in Today&apos;s World</h3>
                 <p className="text-gray-700 text-base mb-4">
                   In the fast-paced modern world, maintaining optimal health has become more critical than ever. The World Health Organization defines health as a state of complete physical, mental, and social well-being. Unfortunately, sedentary lifestyles, stress, and poor dietary habits have led to a rise in lifestyle-related diseases such as obesity, diabetes, and cardiovascular conditions.
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                   <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg">
                     <h4 className="text-xl font-bold text-gray-900 mb-3">Physical Wellness Benefits</h4>
                     <ul className="text-gray-700 space-y-2 text-sm">
                       <li>✓ Increased energy and stamina throughout the day</li>
                       <li>✓ Better immune system function and disease resistance</li>
                       <li>✓ Improved metabolism and healthy weight management</li>
                       <li>✓ Stronger bones and improved muscle health</li>
                       <li>✓ Better sleep quality and faster recovery</li>
                     </ul>
                   </div>
                   <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg">
                     <h4 className="text-xl font-bold text-gray-900 mb-3">Mental & Emotional Wellness</h4>
                     <ul className="text-gray-700 space-y-2 text-sm">
                       <li>✓ Reduced stress and anxiety levels</li>
                       <li>✓ Better focus and mental clarity</li>
                       <li>✓ Improved mood and emotional stability</li>
                       <li>✓ Enhanced self-confidence and self-esteem</li>
                       <li>✓ Better overall quality of life and happiness</li>
                     </ul>
                   </div>
                 </div>
               </div>

               {/* Wellness Products Guide */}
               <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-8 rounded-lg">
                 <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Complete Guide to Wellness Products on M Wellness Bazaar</h3>
                 <p className="text-gray-700 text-base mb-6">
                   M Wellness Bazaar offers a comprehensive range of wellness products designed to meet diverse health needs. Here&apos;s everything you need to know about our product categories:
                 </p>
                 
                 <div className="space-y-6">
                   <div className="bg-white p-6 rounded-lg border-l-4 border-cyan-500">
                     <h4 className="text-xl font-bold text-gray-900 mb-3">Health Supplements & Vitamins</h4>
                     <p className="text-gray-700 text-sm mb-3">
                       Our supplement range includes multivitamins, protein powders, immunity boosters, and specialized nutritional supplements. These products are formulated to fill nutritional gaps and support your body&apos;s optimal functioning. M Wellness Bazaar only stocks supplements from verified manufacturers who follow GMP (Good Manufacturing Practice) standards.
                     </p>
                     <p className="text-gray-600 text-sm font-semibold">Popular supplement categories: Protein Powder, Multivitamins, Immunity Boosters, Joint Support, Digestive Health</p>
                   </div>

                   <div className="bg-white p-6 rounded-lg border-l-4 border-cyan-500">
                     <h4 className="text-xl font-bold text-gray-900 mb-3">Smart Wellness Devices</h4>
                     <p className="text-gray-700 text-sm mb-3">
                       Technology has revolutionized personal health monitoring. M Wellness Bazaar&apos;s range of wellness devices includes health trackers, fitness monitors, respiratory devices, and other innovative health tech products. These devices help you track your wellness metrics and make data-driven decisions about your health.
                     </p>
                     <p className="text-gray-600 text-sm font-semibold">Featured devices: Respyr Device, Health Tracking Bands, Smart Scales, Fitness Monitors, Pulse Oximeters</p>
                   </div>

                   <div className="bg-white p-6 rounded-lg border-l-4 border-cyan-500">
                     <h4 className="text-xl font-bold text-gray-900 mb-3">Organic & Natural Wellness Products</h4>
                     <p className="text-gray-700 text-sm mb-3">
                       We believe in the power of nature. Our organic wellness products are derived from natural sources without harmful chemicals or artificial additives. From Ayurvedic preparations to herbal supplements, M Wellness Bazaar brings you products rooted in traditional wellness wisdom.
                     </p>
                     <p className="text-gray-600 text-sm font-semibold">Featured products: Ayurvedic Oils, Herbal Teas, Natural Skincare, Plant-Based Proteins, Organic Spices</p>
                   </div>

                   <div className="bg-white p-6 rounded-lg border-l-4 border-cyan-500">
                     <h4 className="text-xl font-bold text-gray-900 mb-3">Wellness Accessories & Devices</h4>
                     <p className="text-gray-700 text-sm mb-3">
                       Complement your wellness journey with essential accessories. M Wellness Bazaar stocks yoga mats, meditation cushions, essential oil diffusers, massage tools, and other wellness accessories that enhance your self-care routine.
                     </p>
                     <p className="text-gray-600 text-sm font-semibold">Featured items: Yoga Mats, Meditation Tools, Massage Devices, Water Bottles, Wellness Planners</p>
                   </div>
                 </div>
               </div>

               {/* Why Choose M Wellness Bazaar */}
               <div className="bg-white border border-gray-200 p-8 rounded-lg">
                 <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Why Choose M Wellness Bazaar for Your Wellness Needs?</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                   <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                     <p className="text-gray-900 font-bold mb-2">✓ 100% Authentic Products</p>
                     <p className="text-gray-700 text-sm">We source all products directly from manufacturers and authorized distributors, guaranteeing authenticity and quality. No counterfeits, no compromises.</p>
                   </div>
                   <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                     <p className="text-gray-900 font-bold mb-2">✓ Competitive Pricing</p>
                     <p className="text-gray-700 text-sm">Our direct sourcing model allows us to offer the best prices on premium wellness products across India.</p>
                   </div>
                   <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                     <p className="text-gray-900 font-bold mb-2">✓ Fast & Free Shipping</p>
                     <p className="text-gray-700 text-sm">Get free nationwide shipping on orders over ₹500 with delivery in 5-7 business days. Track your order in real-time.</p>
                   </div>
                   <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                     <p className="text-gray-900 font-bold mb-2">✓ Expert Customer Support</p>
                     <p className="text-gray-700 text-sm">Our wellness experts are available 24/7 to answer your questions and provide personalized product recommendations.</p>
                   </div>
                   <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                     <p className="text-gray-900 font-bold mb-2">✓ 10-Day Money Back Guarantee</p>
                     <p className="text-gray-700 text-sm">Not satisfied? Return the product within 10 days for a full refund, no questions asked. Your satisfaction is our priority.</p>
                   </div>
                   <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                     <p className="text-gray-900 font-bold mb-2">✓ Secure Payment Options</p>
                     <p className="text-gray-700 text-sm">Shop safely with multiple payment options including credit cards, debit cards, UPI, and net banking with SSL encryption.</p>
                   </div>
                 </div>
               </div>

               {/* Health & Wellness Blog */}
               <div className="bg-gray-50 p-8 rounded-lg">
                 <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Wellness Tips & Health Guidance from M Wellness Bazaar</h3>
                 <p className="text-gray-700 text-base mb-6">
                   Knowledge is power when it comes to wellness. Here are evidence-based wellness tips to help you optimize your health:
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-5 rounded border-t-4 border-cyan-500">
                     <h4 className="font-bold text-gray-900 mb-2">Daily Hydration for Optimal Health</h4>
                     <p className="text-gray-700 text-sm">Drinking adequate water is fundamental to wellness. Water regulates body temperature, aids digestion, improves nutrient absorption, and helps maintain cognitive function. Aim for 8-10 glasses of water daily.</p>
                   </div>
                   <div className="bg-white p-5 rounded border-t-4 border-cyan-500">
                     <h4 className="font-bold text-gray-900 mb-2">Importance of Regular Exercise</h4>
                     <p className="text-gray-700 text-sm">Exercise is medicine. Regular physical activity strengthens your heart, improves flexibility, builds muscle, and releases endorphins that enhance mental health. Aim for 150 minutes of moderate activity weekly.</p>
                   </div>
                   <div className="bg-white p-5 rounded border-t-4 border-cyan-500">
                     <h4 className="font-bold text-gray-900 mb-2">Balanced Nutrition for Energy</h4>
                     <p className="text-gray-700 text-sm">A balanced diet includes proteins, carbohydrates, healthy fats, vitamins, and minerals. Focus on whole foods, reduce processed items, and consider supplements to fill nutritional gaps.</p>
                   </div>
                   <div className="bg-white p-5 rounded border-t-4 border-cyan-500">
                     <h4 className="font-bold text-gray-900 mb-2">Quality Sleep for Recovery</h4>
                     <p className="text-gray-700 text-sm">Sleep is when your body heals. Adults need 7-9 hours of quality sleep nightly. Establish a sleep schedule, avoid screens before bed, and create a cool, dark sleeping environment.</p>
                   </div>
                   <div className="bg-white p-5 rounded border-t-4 border-cyan-500">
                     <h4 className="font-bold text-gray-900 mb-2">Stress Management Techniques</h4>
                     <p className="text-gray-700 text-sm">Chronic stress damages health. Practice meditation, yoga, deep breathing exercises, or mindfulness to manage stress. M Wellness Bazaar offers meditation tools and stress-relief products.</p>
                   </div>
                   <div className="bg-white p-5 rounded border-t-4 border-cyan-500">
                     <h4 className="font-bold text-gray-900 mb-2">Regular Health Checkups</h4>
                     <p className="text-gray-700 text-sm">Preventive care is key. Regular health checkups help detect health issues early. Use wellness devices from M Wellness Bazaar to track your health metrics at home.</p>
                   </div>
                 </div>
               </div>

               {/* FAQs Section */}
               <div className="bg-white border border-gray-200 p-8 rounded-lg">
                 <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions About M Wellness Bazaar</h3>
                 <div className="space-y-4">
                   <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded">
                     <p className="font-bold text-gray-900 mb-2">Q: Are all products on M Wellness Bazaar authentic?</p>
                     <p className="text-gray-700 text-sm">A: Yes, absolutely. We source products directly from manufacturers and authorized distributors. Every product undergoes quality verification before being listed on our platform.</p>
                   </div>
                   <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded">
                     <p className="font-bold text-gray-900 mb-2">Q: What is the delivery time for orders?</p>
                     <p className="text-gray-700 text-sm">A: We offer free nationwide shipping on orders over ₹500 with typical delivery in 5-7 business days. Express delivery options are also available in select cities.</p>
                   </div>
                   <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded">
                     <p className="font-bold text-gray-900 mb-2">Q: Can I return products if not satisfied?</p>
                     <p className="text-gray-700 text-sm">A: Yes, M Wellness Bazaar offers a 10-day money-back guarantee. If you&apos;re not satisfied with any product, return it within 10 days for a full refund.</p>
                   </div>
                   <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded">
                     <p className="font-bold text-gray-900 mb-2">Q: Are supplements safe to consume?</p>
                     <p className="text-gray-700 text-sm">A: All products on M Wellness Bazaar are from reputable manufacturers following GMP standards. However, consult a healthcare professional before starting any supplement regimen, especially if you have medical conditions.</p>
                   </div>
                   <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded">
                     <p className="font-bold text-gray-900 mb-2">Q: Do you have wellness experts available for consultation?</p>
                     <p className="text-gray-700 text-sm">A: Yes, our wellness experts are available 24/7 to answer questions and provide personalized recommendations based on your health goals.</p>
                   </div>
                   <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded">
                     <p className="font-bold text-gray-900 mb-2">Q: What payment methods does M Wellness Bazaar accept?</p>
                     <p className="text-gray-700 text-sm">A: We accept all major payment methods including credit cards, debit cards, UPI, net banking, and digital wallets. All transactions are encrypted and secure.</p>
                   </div>
                 </div>
               </div>

               {/* Trust & Credibility */}
               <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-8 rounded-lg">
                 <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Why M Wellness Bazaar is India&apos;s Most Trusted Wellness Platform</h3>
                 <p className="text-gray-700 text-base mb-6">
                   M Wellness Bazaar has earned the trust of lakhs of customers across India through consistent delivery of quality products and exceptional service. Our commitment to transparency, authenticity, and customer satisfaction sets us apart in the wellness industry.
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="text-center">
                     <div className="text-4xl font-bold text-cyan-600 mb-2">50,000+</div>
                     <p className="text-gray-700 font-semibold">Happy Customers</p>
                     <p className="text-gray-600 text-sm">Trusted by wellness enthusiasts across India</p>
                   </div>
                   <div className="text-center">
                     <div className="text-4xl font-bold text-cyan-600 mb-2">1000+</div>
                     <p className="text-gray-700 font-semibold">Premium Products</p>
                     <p className="text-gray-600 text-sm">Carefully curated wellness solutions</p>
                   </div>
                   <div className="text-center">
                     <div className="text-4xl font-bold text-cyan-600 mb-2">4.9/5</div>
                     <p className="text-gray-700 font-semibold">Average Rating</p>
                     <p className="text-gray-600 text-sm">Based on thousands of customer reviews</p>
                   </div>
                 </div>
               </div>


             </div>
           </section>











        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scaleX(0);
          }
          to {
            opacity: 1;
            transform: scaleX(1);
          }
        }

        .animate-in {
          animation: fadeIn forwards;
        }

        .fade-in {
          animation-name: fadeIn;
        }

        .slide-in-from-bottom-6 {
          animation-name: slideInFromBottom;
        }

        .slide-in-from-left {
          animation-name: slideInFromLeft;
        }

        .slide-in-from-right {
          animation-name: slideInFromRight;
        }

        .scale-in {
          animation-name: scaleIn;
        }

        .duration-700 {
          animation-duration: 700ms;
        }

        .delay-100 {
          animation-delay: 100ms;
        }

        .delay-200 {
          animation-delay: 200ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-400 {
          animation-delay: 400ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-600 {
          animation-delay: 600ms;
        }
      `}</style>
    </div>
  );
};

export default Home;

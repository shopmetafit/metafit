import React, { useState, useEffect } from 'react';
import { Target, Eye, TrendingUp, Shield, Globe, Award } from 'lucide-react';

const AboutUs = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const metrics = [
    { value: "10,000+", label: "Active Customers", growth: "+45%" },
    { value: "500+", label: "Premium Products", growth: "+78%" },
    { value: "100+", label: "Verified Vendors", growth: "+92%" },
    { value: "98%", label: "Satisfaction Rate", growth: "+12%" }
  ];

  const pillars = [
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Rigorous verification processes ensure every product meets pharmaceutical-grade standards and traditional authenticity."
    },
    {
      icon: Globe,
      title: "Marketplace Integration",
      description: "Seamless digital platform connecting certified vendors with conscious consumers across multiple wellness categories."
    },
    {
      icon: TrendingUp,
      title: "Innovation & Growth",
      description: "Leveraging AI and data analytics to personalize wellness journeys while expanding into physical retail experiences."
    },
    {
      icon: Award,
      title: "Excellence Standard",
      description: "Commitment to sourcing, curation, and customer service that sets industry benchmarks in holistic wellness."
    }
  ];

  const timeline = [
    { phase: "Foundation", period: "2023", milestone: "Market research and strategic partnerships established" },
    { phase: "Platform Launch", period: "2024", milestone: "Digital marketplace deployed with vendor onboarding" },
    { phase: "Scale & Optimization", period: "2025", milestone: "Expanded product lines and enhanced user experience" },
    { phase: "Omnichannel Expansion", period: "2026+", milestone: "Physical flagship stores and integrated wellness centers" }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-32 flex items-center justify-center bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block mb-4 px-5 py-1.5 border border-teal-400/30 rounded text-teal-300 text-sm tracking-wider font-medium backdrop-blur-sm">
            ESTABLISHING NEW STANDARDS IN WELLNESS
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-5 tracking-tight">
            About <span className="font-semibold">Our Company</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
            Bridging ancient wellness traditions with contemporary innovation to create a comprehensive marketplace for holistic health solutions
          </p>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {metrics.map((metric, idx) => (
              <div key={idx} className="bg-white p-8 border border-slate-200 hover:border-teal-600 transition-colors group">
                <div className="text-4xl font-light text-slate-900 mb-2">{metric.value}</div>
                <div className="text-slate-600 text-sm uppercase tracking-wider mb-2">{metric.label}</div>
                <div className="text-teal-600 text-sm font-medium">{metric.growth} YoY</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Mission */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 border-2 border-teal-600 flex items-center justify-center">
                <Target className="text-teal-600" size={24} />
              </div>
              <h2 className="text-3xl font-light text-slate-900">Mission Statement</h2>
            </div>
            <p className="text-slate-700 text-lg leading-relaxed">
              To aggregate premium wellness products spanning nutrition, Ayurveda, fitness, lifestyle, and health technology within a unified digital ecosystem. Our platform facilitates transparent connections between verified vendors and discerning consumers, establishing trust through rigorous quality standards.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed">
              We are strategically positioned to evolve from a digital-first marketplace into an omnichannel wellness destination, featuring curated physical retail experiences designed for modern health-conscious consumers.
            </p>
          </div>

          {/* Vision */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 border-2 border-teal-600 flex items-center justify-center">
                <Eye className="text-teal-600" size={24} />
              </div>
              <h2 className="text-3xl font-light text-slate-900">Vision Statement</h2>
            </div>
            <div className="border-l-2 border-teal-600 pl-8 py-4">
              <p className="text-slate-700 text-xl leading-relaxed italic">
                To establish the definitive wellness marketplace that synthesizes innovation with traditional healing practices, empowering individuals to achieve optimal health through informed, mindful choices.
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-teal-600 mt-2.5 flex-shrink-0" />
                <span className="text-slate-700">Comprehensive product curation across wellness verticals</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-teal-600 mt-2.5 flex-shrink-0" />
                <span className="text-slate-700">Integration of traditional wisdom with modern science</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-teal-600 mt-2.5 flex-shrink-0" />
                <span className="text-slate-700">Scalable infrastructure for sustained growth</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light mb-4">Strategic Pillars</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Foundational principles guiding our operational excellence
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={idx} 
                  className="border border-slate-700 p-10 hover:border-teal-600 transition-colors group"
                >
                  <Icon className="text-teal-500 mb-6 group-hover:text-teal-400 transition-colors" size={32} />
                  <h3 className="text-2xl font-light mb-4">{pillar.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">About M Wellness Bazar - Leading Wellness Marketplace in India</h2>
          
          <div className="space-y-5 text-gray-700 leading-relaxed">
            <p>
              M Wellness Bazar is a premier digital wellness marketplace dedicated to transforming how Indians access premium health and wellness products. Founded with the vision of making authentic, high-quality wellness solutions accessible to everyone, we have established ourselves as a trusted platform that bridges the gap between traditional healing wisdom and modern health science. Our curated collection brings together thousands of authentic wellness products, from Ayurvedic supplements and herbal remedies to modern nutritional supplements, fitness accessories, and holistic health solutions.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Our Journey to Excellence</h3>
            <p>
              Since our inception, M Wellness Bazar has been committed to revolutionizing the wellness industry by prioritizing quality, authenticity, and customer satisfaction above all else. We understand that the wellness market can be overwhelming, with countless products claiming extraordinary benefits. That's why we've built a rigorous verification system to ensure every product on our platform meets pharmaceutical-grade standards and represents genuine value. Our team of wellness experts meticulously curates each product category to ensure that customers receive only the best solutions for their health needs, whether they're seeking immunity-boosting supplements, skincare products, fitness gear, or traditional Ayurvedic remedies.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Commitment to Quality and Authenticity</h3>
            <p>
              At M Wellness Bazar, quality is not negotiable. Every wellness product in our collection undergoes rigorous testing and verification processes to ensure authenticity and efficacy. We partner exclusively with verified vendors and certified manufacturers who share our commitment to excellence. Our strict quality assurance protocols mean that you can shop with complete confidence, knowing that you're investing in genuine, high-quality products. We maintain transparent relationships with our suppliers, ensuring complete traceability from manufacturer to your doorstep. This dedication to authenticity has earned us the trust of over 10,000 active customers who rely on us for their wellness needs.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Diverse Product Categories for Complete Wellness</h3>
            <p>
              Our comprehensive marketplace features over 500 premium wellness products across multiple categories. From ancient Ayurvedic formulations that have been trusted for centuries to cutting-edge nutritional supplements backed by modern science, M Wellness Bazar offers something for every wellness journey. Whether you're interested in boosting immunity, managing stress, improving skin health, enhancing fitness performance, or supporting overall well-being, our expertly curated collections provide solutions backed by both traditional knowledge and scientific research. Each product category is carefully organized with detailed descriptions, ingredient information, and customer reviews to help you make informed decisions.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Customer-Centric Shopping Experience</h3>
            <p>
              We've designed M Wellness Bazar with your convenience in mind. Our user-friendly platform features advanced filtering options, personalized recommendations, and detailed product information to make your shopping experience seamless. With fast shipping, free delivery options on qualifying purchases, and a hassle-free return policy, we ensure that your wellness journey is smooth and satisfying. Our knowledgeable customer support team is always ready to assist you with product recommendations or any questions about our wellness solutions. We maintain a 98% customer satisfaction rate because we genuinely care about your health outcomes.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Building a Wellness Community</h3>
            <p>
              Beyond just selling products, M Wellness Bazar is building a thriving community of health-conscious individuals committed to achieving optimal wellness. We regularly share valuable content about nutrition, fitness, mental wellness, and holistic health practices through our blog and social media channels. Our mission is to empower customers with knowledge so you can make informed decisions about your health. We believe that true wellness comes from understanding your body's needs and choosing products that genuinely support your goals.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Why Choose M Wellness Bazar?</h3>
            <p>
              Choose M Wellness Bazar and join thousands of satisfied customers who have transformed their wellness journeys with our premium products. We combine the wisdom of traditional healing practices with the rigor of modern science, offering a unique marketplace that truly understands wellness. Our commitment to authenticity, quality, and customer satisfaction makes us the most trusted name in wellness retail. Whether you're just beginning your wellness journey or are a seasoned health enthusiast, M Wellness Bazar is your ultimate destination for all premium wellness products.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUs;
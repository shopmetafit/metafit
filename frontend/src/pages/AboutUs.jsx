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

    </div>
  );
};

export default AboutUs;
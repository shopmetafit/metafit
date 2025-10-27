import React, { useState } from 'react';
import { Phone, Mail, Clock, MapPin, Send, CheckCircle } from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactInfo = [
    {
      icon: Phone,
      title: "Call Us",
      primary: "9982498555",
      secondary: "Available 24/7",
      link: "tel:9982498555"
    },
    {
      icon: Mail,
      title: "Email Us",
      primary: "info@metafitwellness.com",
      secondary: "Response within 24 hours",
      link: "mailto:info@metafitwellness.com"
    },
    {
      icon: Clock,
      title: "Store Hours",
      primary: "M–F: 8AM–6PM",
      secondary: "S–S: 10AM–5PM"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      primary: "808, Silver Residency",
      secondary: "Near Petrol Pump, Thoor, Udaipur",
      tertiary: "Rajasthan, India - 313001"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-4 px-5 py-1.5 border border-teal-500/30 rounded text-teal-400 text-sm tracking-wider font-medium">
            CONTACT
          </div>
          <h1 className="text-5xl font-light text-white mb-4">Get In Touch</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Have questions? We're here to help. Reach out to our team for inquiries about products, partnerships, or general support.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-6 -mt-12 relative z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-6">
          {contactInfo.map((info, idx) => {
            const Icon = info.icon;
            return (
              <a
                key={idx}
                href={info.link || '#'}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`bg-white p-8 border transition-all duration-300 ${
                  hoveredCard === idx
                    ? 'border-teal-600 shadow-xl -translate-y-2'
                    : 'border-slate-200 shadow-lg'
                }`}
              >
                <div className={`w-14 h-14 mb-6 border-2 flex items-center justify-center transition-colors ${
                  hoveredCard === idx ? 'border-teal-600 bg-teal-50' : 'border-slate-300'
                }`}>
                  <Icon 
                    className={`transition-colors ${hoveredCard === idx ? 'text-teal-600' : 'text-slate-600'}`} 
                    size={24} 
                  />
                </div>
                <p className="text-sm text-slate-500 uppercase tracking-wider mb-3">{info.title}</p>
                <p className="font-medium text-slate-900 mb-1">{info.primary}</p>
                <p className="text-sm text-slate-600">{info.secondary}</p>
                {info.tertiary && <p className="text-sm text-slate-600 mt-1">{info.tertiary}</p>}
              </a>
            );
          })}
        </div>
      </section>

      {/* Contact Form & Map Section */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white p-10 border border-slate-200">
            <h2 className="text-3xl font-light text-slate-900 mb-2">Send a Message</h2>
            <p className="text-slate-600 mb-8">Fill out the details below and we'll get back to you shortly.</p>
            
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="text-green-600" size={40} />
                </div>
                <h3 className="text-2xl font-medium text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-slate-600 text-center">Thank you for contacting us. We'll respond within 24 hours.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 focus:border-teal-600 focus:outline-none transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 focus:border-teal-600 focus:outline-none transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 focus:border-teal-600 focus:outline-none transition-colors"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    className="w-full px-4 py-3 border border-slate-300 focus:border-teal-600 focus:outline-none transition-colors resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-teal-600 text-white py-4 font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Send Message
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="h-full min-h-[500px]">
            <div className="sticky top-6">
              <h2 className="text-3xl font-light text-slate-900 mb-2">Our Location</h2>
              <p className="text-slate-600 mb-6">Visit us at our office in Udaipur, Rajasthan</p>
              <div className="border border-slate-200 overflow-hidden shadow-lg">
                <iframe
                  title="Google Map Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3625.723227833148!2d73.65795767392747!3d24.667653352948314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3967e37fb70f6433%3A0xda36ceee16cac45c!2sSILVER%20RESIDENCY!5e0!3m2!1sen!2sin!4v1752858158409!5m2!1sen!2sin"
                  width="100%"
                  height="500"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-[500px] border-0 grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
import React from 'react';

const AboutUs = () => {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section className="bg-blue-100 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">About Us</h1>
        <p className="text-lg max-w-2xl mx-auto">
          We are passionate about delivering quality products and services to our customers.
        </p>
      </section>

      {/* Our Mission */}
      <section className="py-12 px-4 md:px-20">
        <h2 className="text-3xl font-semibold mb-4">Our Mission</h2>
        <p className="text-gray-700 mb-6">
          Our mission is to bring innovation and technology together to provide the best solutions for our customers.
        </p>

        <h2 className="text-3xl font-semibold mb-4">Our Vision</h2>
        <p className="text-gray-700">
          To be a global leader in our industry by consistently exceeding expectations and building long-lasting relationships.
        </p>
      </section>

      {/* Team Section */}
      <section className="bg-gray-100 py-12 px-4 md:px-20">
        <h2 className="text-3xl font-semibold mb-8 text-center">Meet Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
          {[
            { name: 'Metafit', role: 'Founder & CEO' },
            { name: 'Priya Mehta', role: 'Marketing Head' },
            { name: 'Rahul Verma', role: 'Lead Developer' },
          ].map((member, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-24 h-24 mx-auto bg-gray-300 rounded-full mb-4"></div>
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-sm text-gray-600">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutUs;

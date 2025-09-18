import React from "react";

const ContactUs = () => {
  return (
    <div className="bg-[#1f2a44] text-white py-16 px-4">
      <div className="text-center">
        <p className="text-sm tracking-widest text-[#F76C5E] uppercase mb-2">Contact</p>
        <h2 className="text-4xl font-semibold mb-4">Get In Touch</h2>
        <p className="max-w-xl mx-auto text-gray-300 mb-8">
          Have Any Question? </p>
        <button className="bg-[#F76C5E] text-white font-semibold px-6 py-3 rounded hover:bg-[#e75c4f] transition">
          Contact US
        </button>
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16 bg-white text-black p-6 rounded-lg">
        {/* Call Us */}
        <div className="flex flex-col items-center">
          <img src="https://cdn-icons-png.flaticon.com/512/724/724664.png" alt="Call" className="h-12 mb-4" />
          <p className="text-gray-400 uppercase text-sm">Call Us</p>
          <p className="font-medium mt-1">9982498555</p>
        </div>

        {/* Email Us */}
        <div className="flex flex-col items-center">
          <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" alt="Email" className="h-12 mb-4" />
          <p className="text-gray-400 uppercase text-sm">Email Us</p>
          <p className="font-medium mt-1">info@metafitwellness.com</p>
        </div>

        {/* Store Hours */}
        <div className="flex flex-col items-center">
          <img src="https://cdn-icons-png.flaticon.com/512/1077/1077035.png" alt="Clock" className="h-12 mb-4" />
          <p className="text-gray-400 uppercase text-sm">Store Hours</p>
          <p className="font-medium mt-1">M–F: 8AM–6PM<br />S–S: 10AM–5PM</p>
        </div>

        {/* Visit Us */}
        <div className="flex flex-col items-center">
          <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Location" className="h-12 mb-4" />
          <p className="text-gray-400 uppercase text-sm">Visit Us</p>
          <p className="font-medium mt-1 text-center">
            808,silver residency ,near petrol pump, thoor ,Udaipur,<br /> Rajasthan, India, 313001
          </p>
        </div>
      </div>

      {/* Google Maps Embed */}
      <div className="mt-10 max-w-5xl mx-auto rounded-lg overflow-hidden shadow-lg">
        <iframe
          title="Google Map Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3625.723227833148!2d73.65795767392747!3d24.667653352948314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3967e37fb70f6433%3A0xda36ceee16cac45c!2sSILVER%20RESIDENCY!5e0!3m2!1sen!2sin!4v1752858158409!5m2!1sen!2sin"
          width="100%"
          height="400"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-[400px] border-0"
        ></iframe>
      </div>
    </div>
  );
};

export default ContactUs;

import { motion } from "framer-motion";

const AboutUs = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-700 py-16 text-center text-white">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-extrabold mb-3"
        >
          About Us
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-xl max-w-2xl mx-auto"
        >
          From Ancient Healing to AI Living
        </motion.p>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6 md:px-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-semibold mb-4 text-teal-700">
            🌱 Mission
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            To bring together unique, high-quality wellness products across
            food, Ayurveda, nutrition, fitness, lifestyle, and technology. To
            create a seamless online wellness hub where vendors and clients
            connect in one trusted space. To evolve into offline flagship
            wellness stores, offering a holistic shopping experience for the new
            generation
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-semibold mb-4 text-teal-700">
            🌿 Vision
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            “To be the ultimate one-stop wellness marketplace, blending
            innovation and tradition to empower healthier, happier, and more
            mindful living.”
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutUs;

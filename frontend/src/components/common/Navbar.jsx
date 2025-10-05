import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiBars3BottomRight,
} from "react-icons/hi2";
import { IoMdClose } from "react-icons/io";
import { FaChevronDown } from "react-icons/fa";
import CartDrawer from "../Layout/CartDrawer";
import { useSelector } from "react-redux";

// Sections with sub + sub-sub
// const sections = [
//   {
//     title: "Nutrition & Supplements",
//     sub: [
//       { name: "Protein Bites", link: "/collections/all" },
//       { name: "Protein Powder", link: "/collections/all" },
//       { name: "Vitamins & Minerals", link: "/collections/all" },
//       { name: "Meal Replacement", link: "/collections/all" },
//       {
//         name: "Superfoods",
//         sub: [
//           { name: "Seeds", link: "/collections/all" },
//           { name: "Dry Fruit", link: "/collections/all" },
//           { name: "Herbal Powders", link: "/collections/all" },
//         ],
//       },
//     ],
//   },
//   {
//     title: "Yoga & Fitness",
//     sub: [
//       { name: "Yoga Mats", link: "/collections/all" },
//       { name: "Accessories", link: "/collections/all" },
//       { name: "Activewear", link: "/collections/all" },
//       { name: "Meditation Cushions", link: "/collections/all" },
//       { name: "Resistance Bands & Fitness", link: "/collections/all" },
//       {
//         name: "Yoga Props",
//         sub: [
//           { name: "Blocks", link: "/collections/all" },
//           { name: "Straps", link: "/collections/all" },
//           { name: "Bolsters", link: "/collections/all" },
//         ],
//       },
//     ],
//   },
//   {
//     title: "Mental Wellness & Mindfulness",
//     sub: [
//       { name: "Meditation Accessories", link: "/collections/all" },
//       { name: "Stress Relief Products", link: "/collections/all" },

//       {
//         name: "Aromatherapy",
//         sub: [
//           { name: "Essential Oils", link: "/collections/all" },
//           { name: "Diffusers", link: "/collections/all" },
//           { name: "Candles", link: "/collections/all" },
//         ],
//       },
//     ],
//   },
//   {
//     title: "Health Food & Beverages",

//     sub: [
//       { name: "Hearbal Teas", link: "/collections/all" },
//       { name: "Organic Snacks", link: "/collections/all" },
//       { name: "Detox Juices", link: "/collections/all" },

//       {
//         name: "Natural Sweeteners",
//         sub: [
//           { name: "Honey", link: "/collections/all" },
//           { name: "Jaggery", link: "/collections/all" },
//           { name: "Stevia", link: "/collections/all" },
//         ],
//       },
//     ],
//   },
//   {
//     title: "Ayurveda & Herbal Care",
//     sub: [
//       { name: "Herbal Powder(Churna)", link: "/collections/herbal-teas" },
//       { name: "Ayurvedic Mediciness", link: "/collections/ayurvedic-oils" },
//       { name: "Oils & Balms", link: "/collections/home-remedies" },
//       { name: "Ayurvedic Teas & Tonics", link: "/collections/home-remedies" },
//       {
//         name: "Skin & Hair Ayurvedic Care",
//         link: "/collections/home-remedies",
//       },
//     ],
//   },
//   {
//     title: "Personal Care & Hygiene",
//     sub: [
//       { name: "Natural Skincare", link: "/collections/all" },
//       { name: "Herbal Haircare", link: "/collections/all" },
//       { name: "Bath & Body Products", link: "/collections/all" },

//       {
//         name: "Oral Care",
//         sub: [
//           { name: "Herbal Toothpaste", link: "/collections/all" },
//           { name: "Mouthwash", link: "/collections/all" },
//         ],
//       },
//     ],
//   },
//   {
//     title: "Wrllness Books & Learning",
//     sub: [
//       { name: "Yoga & Meditation Books", link: "/collections/all" },
//       { name: "Ayurveda Books", link: "/collections/all" },
//       { name: "Nutrition & Fitness Guides", link: "/collections/all" },
//       { name: "Motivational & Self-Care Books", link: "/collections/all" },
//       { name: "Dignostics & Wellness Services", link: "/collections/all" },
//       { name: "Health Checkup Packages", link: "/collections/all" },
//       { name: "Online Yoga Classes", link: "/collections/all" },
//       { name: "Ayurvedic Consultation", link: "/collections/all" },
//       { name: "Diet Plans & Counseling", link: "/collections/all" },
//     ],
//   },
//   {
//     title: "Digital Wellness Gadgets",

//     sub: [
//       {
//         name: "Smart Water Bottels & Hydration Devices",
//         link: "/collections/all",
//       },
//       { name: "All Purifiers & Wellness Tech", link: "/collections/all" },
//       {
//         name: "Fitness Trackers & Smartwatches",
//         sub: [
//           { name: "Step counter", link: "/collections/all" },
//           { name: "Calorie Tracker", link: "/collections/all" },
//           { name: "Heart Rate Monitor", link: "/collections/all" },
//         ],
//       },
//       {
//         name: "Smart Yoga Devices",
//         sub: [
//           { name: "Posture Corrector", link: "/collections/all" },
//           { name: "AI Yoga Assistant", link: "/collections/all" },
//           { name: "Smart Mats", link: "/collections/all" },
//         ],
//       },

//       {
//         name: "Health Monitoring Devices",
//         sub: [
//           { name: "BP Monitor", link: "/collections/all" },
//           { name: "Glucometer", link: "/collections/all" },
//           { name: "Oximeter", link: "/collections/all" },
//           { name: "Thermometer", link: "/collections/all" },
//         ],
//       },

//       {
//         name: "Sleep & Relaxation Gadgets",
//         sub: [
//           { name: "Smart Sleep Bands", link: "/collections/all" },
//           { name: "White Noice Machines", link: "/collections/all" },
//           { name: "Meditation Headbands", link: "/collections/all" },
//         ],
//       },

//       {
//         name: "Massage & Recovery Tools",
//         sub: [
//           { name: "Neck Massager", link: "/collections/all" },
//           { name: "Foot Massager", link: "/collections/all" },
//           { name: "Massage Gun", link: "/collections/all" },
//         ],
//       },
//     ],
//   },
// ];

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null); // for main sections
  const [openSubSection, setOpenSubSection] = useState(null); // for sub-sections

  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const cartItemCount =
    cart?.products?.reduce((total, product) => total + product.quantity, 0) ||
    0;

  const togglerNavDrawer = () => setNavDrawerOpen(!navDrawerOpen);
  const togglerCartOpen = () => setDrawerOpen(!drawerOpen);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
    setOpenSubSection(null); // reset sub-section when switching section
  };

  const toggleSubSection = (sub) => {
    setOpenSubSection(openSubSection === sub ? null : sub);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="container mx-auto flex items-center justify-between py-4 px-6">
        {/* Center tagline */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="hidden md:block text-lg md:text-xl font-semibold text-gray-700 tracking-wide">
            From Ancient Healing to AI Living
          </h1>
        </div>
        {/* Desktop navigation */}
        {/* <div className="hidden lg:flex space-x-6">
          {sections.map((section) => (
            <div key={section.title} className="relative">
              <button
                onClick={() => toggleSection(section.title)}
                className="text-gray-700 text-xs font-medium uppercase flex items-center focus:outline-none"
              >
                {section.title}
                <FaChevronDown
                  className={`ml-1 text-gray-500 transition-transform duration-200 ${openSection === section.title ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Desktop dropdown */}
        {/*{openSection === section.title && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white shadow-lg rounded z-50">
                  {section.sub.map((subItem) => (
                    <div key={subItem.name} className="relative">
                      {subItem.sub ? (
                        <>
                          <button
                            onClick={() => toggleSubSection(subItem.name)}
                            className="flex justify-between w-full px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-black focus:outline-none"
                          >
                            {subItem.name}
                            <FaChevronDown
                              className={`ml-2 transition-transform duration-200 ${openSubSection === subItem.name
                                  ? "rotate-180"
                                  : ""
                                }`}
                            />
                          </button>
                          {openSubSection === subItem.name && (
                            <div className="pl-6 mt-1 space-y-1">
                              {subItem.sub.map((subSub) => (
                                <Link
                                  key={subSub.name}
                                  to={subSub.link}
                                  className="block text-gray-600 hover:bg-gray-100 hover:text-black"
                                >
                                  {subSub.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          to={subItem.link}
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-black"
                        >
                          {subItem.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div> */}

        {/* Right icons */}
        <div className="flex justify-end space-x-4 w-full">
          <button onClick={togglerNavDrawer} className="lg:hidden">
            <HiBars3BottomRight className="h-6 w-6 text-gray-700" />
          </button>
          {user && user.role === "admin" && (
            <Link
              to="/admin"
              className="block bg-black text-white px-2 mx-2 rounded text-xs"
            >
              Admin
            </Link>
          )}

          <Link to="/profile" className="hover:text-black">
            <HiOutlineUser className="h-6 w-6 text-gray-700 " />
          </Link>

          {/* Cart button */}
          <button
            onClick={togglerCartOpen}
            className="relative hover:text-black"
          >
            <HiOutlineShoppingBag className="h-6 w-6 text-gray-700" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 bg-rabbit-red text-white text-xs rounded-full px-2 py-0.5">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
       
      </nav>

      <CartDrawer drawerOpen={drawerOpen} togglerCartOpen={togglerCartOpen} />

      {/* Mobile navigation */}
      <div
        className={`fixed bg-gradient-to-b from-white to-gray-50 top-0 left-0 
  w-3/4 sm:w-1/2 md:w-1/3 h-full 
  shadow-2xl rounded-r-2xl border-r border-gray-200
  transform transition-transform duration-300 ease-in-out z-50 
  ${navDrawerOpen ? "translate-x-0" : "-translate-x-full"} 
  overflow-y-auto`}
      >
        <div className="flex justify-end p-4 sticky top-0 bg-white">
          <button onClick={togglerNavDrawer}>
            <IoMdClose className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-semibold underline text-gray-600">
            Menu
          </h2>
          <nav className="space-y-6 mt-6">
            {/* {sections.map((section) => (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex justify-between items-center w-full 
  text-gray-700 font-semibold text-base tracking-wide 
  px-4 py-3 rounded-lg 
  hover:bg-gray-100 hover:text-black 
  transition-all duration-200 ease-in-out"
                >
                  {section.title}
                  <FaChevronDown
                    className={`ml-2 transition-transform duration-200 ${openSection === section.title ? "rotate-180" : ""
                      }`}
                  />
                </button>
                {openSection === section.title && (
                  <div className="pl-4 mt-2 space-y-1">
                    {section.sub.map((subItem) => (
                      <div key={subItem.name}>
                        {subItem.sub ? (
                          <>
                            <button
                              onClick={() => toggleSubSection(subItem.name)}
                              className="flex justify-between items-center w-full 
  text-gray-600 font-medium text-sm 
  px-4 py-2 rounded-md 
  hover:bg-gray-50 hover:text-gray-900 
  transition-all duration-200 ease-in-out"
                            >
                              {subItem.name}
                              <FaChevronDown
                                className={`ml-2 transition-transform duration-200 ${openSubSection === subItem.name
                                    ? "rotate-180"
                                    : ""
                                  }`}
                              />
                            </button>
                            {openSubSection === subItem.name && (
                              <div className="pl-6 mt-1 space-y-1">
                                {subItem.sub.map((subSub) => (
                                  <Link
                                    key={subSub.name}
                                    to={subSub.link}
                                    onClick={togglerNavDrawer}
                                    className="block px-6 py-2 text-gray-500 text-sm 
  hover:text-black hover:bg-gray-100 rounded-md 
  transition-all duration-200 ease-in-out"

                                  >
                                    {subSub.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            to={subItem.link}
                            onClick={togglerNavDrawer}
                            className="block text-gray-600 hover:text-black"
                          >
                            {subItem.name}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))} */}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Navbar;

import { IoLogoInstagram } from "react-icons/io";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import logo from "../../assets/logo.png"; // Adjust path if needed
import { Link } from "react-router-dom";

const Topbar = () => {
  return (
    <div style={{ backgroundColor: "#bae6fd" }} className="text-white">
      <div className="container mx-auto flex justify-between items-center py-3 px-3">
        {/* Left Section: Logo + Social Icons */}
        <div className="flex items-center space-x-8">
          <div className=" p-1 rounded-md">
            <a
              href="https://metafitwellness.com/"
              target="_self"
              rel="noopener noreferrer"
            >
              <img src={logo} alt="Logo" className="h-10 w-auto" />
            </a>
          </div>

          {/* Social Icons (only show on md and up) */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="https://www.facebook.com/profile.php?id=61565468193885#"
              className="text-black hover:text-gray-700"
            >
              <FaFacebook className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/metafitwellness/?igsh=NDl0ZzlzYzdrY2tk#"
              className="text-black hover:text-gray-700"
            >
              <IoLogoInstagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/meta-fit-wellness/"
              className="text-black hover:text-gray-700"
            >
              <FaLinkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Center Text */}
        <div className="text-black">
          <Link to="/" className="text-2xl font-medium">
            M Wellness Bazaar
          </Link>
        </div>

        {/* Right Contact Number */}
        <div className="text-sm hidden md:block">
          <a
            href="tel:+919982498555"
            className="text-black hover:text-gray-700"
          >
            +91 99824 98555
          </a>
        </div>
      </div>
    </div>
  );
};

export default Topbar;

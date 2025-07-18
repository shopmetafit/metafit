import { IoLogoInstagram } from "react-icons/io";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import logo from "../../assets/logo.png"; // Adjust path if needed

const Topbar = () => {
  return (
    <div className="bg-rabbit-red text-white">
      <div className="container mx-auto flex justify-between items-center py-3 px-3">
        {/* Left Section: Logo + Social Icons */}
        <div className="flex items-center space-x-8">
      
          <div className="bg-black p-1 rounded-md">
            <img
              src={logo}
              alt="Logo"
              className="h-10 w-auto" 
            />
          </div>

          {/* Social Icons (only show on md and up) */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="https://www.facebook.com/profile.php?id=61565468193885#"
              className="hover:text-gray-300"
            >
              <FaFacebook className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/metafitwellness/?igsh=NDl0ZzlzYzdrY2tk#"
              className="hover:text-gray-300"
            >
              <IoLogoInstagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/meta-fit-wellness/"
              className="hover:text-gray-300"
            >
              <FaLinkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Center Text */}
        <div className="text-sm text-center flex-grow">
          <span>We ship all over India - Fast and reliable shipping.</span>
        </div>

        {/* Right Contact Number */}
        <div className="text-sm hidden md:block">
          <a href="tel:+919982498555" className="hover:text-gray-300">
            +91 99824 98555
          </a>
        </div>
      </div>
    </div>
  );
};

export default Topbar;

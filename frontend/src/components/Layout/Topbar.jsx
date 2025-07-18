import { IoLogoInstagram } from "react-icons/io"
import { FaFacebook, FaLinkedin } from 'react-icons/fa';
const Topbar = () => {
  return (
    <div className="bg-rabbit-red text-white">
      <div className="container mx-auto flex justify-between items-center py-3 px-3">
        <div className="hidden md:flex items-center space-x-4">
          <a href="https://www.facebook.com/profile.php?id=61565468193885#" className="hover:text-gray-300">
            <FaFacebook className="h-5 w-5" />
          </a>
          <a href="https://www.instagram.com/metafitwellness/?igsh=NDl0ZzlzYzdrY2tk#" className="hover:text-gray-300">
            <IoLogoInstagram className="h-5 w-5" />
          </a>
          <a href="https://www.linkedin.com/company/meta-fit-wellness/" className="hover:text-gray-300">
            <FaLinkedin className="h-4 w-4" />
          </a>
        </div>

        <div className="text-sm text-center flex-grow">
          <span>We ship all over India - Fast and reliable shipping.</span>
        </div>
        
        <div className="text-sm hidden md:block">
          <a href="+912883923801" className="hover:text-gray-300">
            ++91 9982498555
          </a>
        </div>
      </div>
    </div>
  );
};

export default Topbar;

import { Link } from "react-router-dom";
import { IoLogoInstagram } from "react-icons/io";
import { FiPhoneCall } from "react-icons/fi";
import { FaFacebook, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="border-t py-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4 lg:px-0">
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Newsletter</h3>
          <p className="text-gray-500 mb-4">
            Be the first to hear about new products, exclusive events, and
            online offers.
          </p>
          <p className="font-medium text-sm text-gray-600">
            Sign up to get 10% off your first order.
          </p>

          {/* newsletter form */}
          <form className="flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="p-3 w-full text-sm border-t border-l border-b border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
            />
            <button
              type="submit"
              className="bg-black text-white px-6 py-3 text-sm rounded-r-md hover:bg-gray-800 transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* shop link */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Shop</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link
                to="/collections/all?category=Top+Wear&gender=Men"
                className="hover:text-gray-600 transition-colors"
              >
                Protein Bite
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Respyr Device
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Super Food
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Metafit Product
              </Link>
            </li>
          </ul>
        </div>

        {/* support links */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Support</h3>
          <ul className="space-y-2 text-gray-600">
            <li>
              <Link
                to="/contactUs"
                className="hover:text-gray-600 transition-colors"
              >
                Contact us
              </Link>
            </li>
            <li>
              <Link
                to="/aboutUs"
                className="hover:text-gray-600 transition-colors"
              >
                About us
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Ayurvedic Products
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-gray-600 transition-colors">
                Our Specific Products
              </Link>
            </li>
          </ul>
        </div>

        {/* follow-us */}
        <div>
          <h3 className="text-lg text-gray-800 mb-4">Follow us</h3>
          <div className="flex items-center space-x-4 mb-6">
            <a
              href="https://www.facebook.com/profile.php?id=61565468193885#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500"
            >
              <FaFacebook className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/metafitwellness/?igsh=NDl0ZzlzYzdrY2tk#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500"
            >
              <IoLogoInstagram className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/meta-fit-wellness/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500"
            >
              <FaLinkedin className="h-4 w-4" />
            </a>
          </div>
          <p className="text-gray-500">Call us</p>
          <p>
            <FiPhoneCall className="inline-block mr-2" />
            +91 9982498555
          </p>
        </div>
      </div>
      {/* footer bottom */}

      <div className="container flex justify-between mx-auto mt-12 px-4 lg:px-0 border-t border-gray-200 pt-6">
        <p className="text-gray-500 text-sm tracking-tighter text-center">
          Copyright &copy; 2025 Metafitwellness. All Rights Reserved
        </p>
        <div className="flex justify-between gap-x-4">
          <p className="text-gray-500 text-sm tracking-tighter text-center">
            <Link
              to="/privacyPolicy"
              className="hover:text-gray-600 transition-colors"
            >
              Privacy Policy
            </Link>
          </p>
          <p className="text-gray-500 text-sm tracking-tighter text-center">
            <Link
              to="/refundPolicy"
              className="hover:text-gray-600 transition-colors"
            >
              Refund Policy
            </Link>
          </p>
          <p className="text-gray-500 text-sm tracking-tighter text-center">
            <Link
              to="/ShippingPolicy"
              className="hover:text-gray-600 transition-colors"
            >
              Shipping Policy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

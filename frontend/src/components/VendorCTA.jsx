import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Store, ArrowRight } from "lucide-react";

const VendorCTA = () => {
  const { user } = useSelector((state) => state.auth);

  // Don't show if already a vendor or not logged in
  if (!user || user.role === "vendor") {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-8 my-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Store size={40} />
          <div>
            <h3 className="text-2xl font-bold mb-2">Ready to Sell?</h3>
            <p className="text-blue-100">
              Join our marketplace and reach thousands of customers
            </p>
          </div>
        </div>

        <Link
          to="/become-vendor"
          className="flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition whitespace-nowrap ml-4"
        >
          <span>Register as Vendor</span>
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
};

export default VendorCTA;

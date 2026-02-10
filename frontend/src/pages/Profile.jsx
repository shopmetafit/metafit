import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import MyOrdersPage from "./MyOrdersPage";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";
import { logout } from "../redux/slices/authSlice";
import axios from "axios";
import { Store, Loader, CheckCircle } from "lucide-react";
import useVendorStatus from "../hooks/useVendorStatus";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { hasApplication, isPending, isApproved } = useVendorStatus();

  const [vendor, setVendor] = useState(null);
  const [loadingVendor, setLoadingVendor] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role === "vendor") {
      // Fetch vendor profile if user is vendor
      fetchVendorProfile();
    }
  }, [user, navigate]);

  const fetchVendorProfile = async () => {
    try {
      setLoadingVendor(true);
      const token = localStorage.getItem("userToken");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/vendors/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setVendor(response.data);
    } catch (err) {
      console.error("Error fetching vendor profile:", err);
    } finally {
      setLoadingVendor(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* left section - User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <div className="text-center mb-6">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-teal-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{user?.name?.[0]}</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{user?.name}</h1>
              <p className="text-gray-600 text-center mb-6 text-sm">{user?.email}</p>
              <div className="space-y-3 border-t pt-6">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Account Role:</span>
                  <p className="text-teal-600 font-medium capitalize">{user?.role || "Customer"}</p>
                </div>
              </div>

              {/* Vendor Actions */}
              <div className="space-y-3 mt-6 border-t pt-6">
                {user?.role === "vendor" ? (
                  <>
                    {loadingVendor ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader className="animate-spin text-teal-600" size={20} />
                      </div>
                    ) : vendor?.isApproved ? (
                      <button
                        onClick={() => navigate("/vendor/dashboard")}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Store size={18} />
                        Vendor Dashboard
                      </button>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 text-center font-medium">
                          ⏳ Vendor application pending admin approval
                        </p>
                      </div>
                    )}
                  </>
                ) : !hasApplication ? (
                  <button
                    onClick={() => navigate("/become-vendor")}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Store size={18} />
                    Become a Vendor
                  </button>
                ) : (
                  <a
                    href="/vendor/approval-status"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-center no-underline"
                  >
                    <CheckCircle size={18} />
                    Check Vendor Status
                  </a>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* right section: orders */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <MyOrdersPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MyOrdersPage from "./MyOrdersPage";
import { useNavigate } from "react-router-dom";
import { clearCart } from "../redux/slices/cartSlice";
import { logout } from "../redux/slices/authSlice";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

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

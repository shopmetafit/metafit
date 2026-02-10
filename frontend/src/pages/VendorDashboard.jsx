import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Loader,
  RefreshCw,
} from "lucide-react";

const VendorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    fetchVendorProfile();
    fetchStats();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/vendors/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Vendor profile:", response.data);
      setVendor(response.data);
    } catch (err) {
      console.error("Error fetching vendor profile:", err);
      setVendor(null);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/vendor/products/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load stats");
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" size={40} />
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <Icon className="text-gray-400" size={40} />
      </div>
    </div>
  );

  // Redirect to approval status page if not approved
  if (vendor && !vendor.isApproved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle size={80} className="text-yellow-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              Account Pending Approval
            </h1>
            <p className="text-gray-600 mb-6">
              Your vendor account is still pending admin approval. You cannot
              access the dashboard until your account is approved.
            </p>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <p className="text-sm text-yellow-800">
                ⏳ This usually takes 24-48 hours. Check your email for updates.
              </p>
            </div>
            <a
              href="/vendor/approval-status"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Check Approval Status
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (  
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.vendorName || user?.name}!
          </p>
          {vendor?.isApproved && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-green-700 font-medium">
                ✓ Your vendor account is approved. You can add and manage products.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Package}
              label="Total Products"
              value={stats.totalProducts}
              color="border-blue-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Published"
              value={stats.publishedProducts}
              color="border-green-500"
            />
            <StatCard
              icon={Package}
              label="Drafts"
              value={stats.draftProducts}
              color="border-yellow-500"
            />
            <StatCard
              icon={ShoppingCart}
              label="Total Stock"
              value={stats.totalStock}
              color="border-purple-500"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/vendor/products"
              className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-center font-semibold text-blue-600"
            >
              View All Products
            </a>
            <a
              href="/vendor/products/new"
              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-semibold"
            >
              Add New Product
            </a>
            <a
              href="/vendor/orders"
              className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-center font-semibold text-green-600"
            >
              View Orders
            </a>
            <a
              href="/vendor/earnings"
              className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-center font-semibold text-purple-600"
            >
              View Earnings
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Getting Started
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                1
              </div>
              <div>
                <p className="font-medium">Manage Your Products</p>
                <p className="text-sm text-gray-500">
                  Add, edit, and update your product inventory
                </p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                2
              </div>
              <div>
                <p className="font-medium">Track Your Orders</p>
                <p className="text-sm text-gray-500">
                  Monitor customer orders and manage shipping
                </p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                3
              </div>
              <div>
                <p className="font-medium">Monitor Earnings</p>
                <p className="text-sm text-gray-500">
                  Track your sales, commissions, and earnings
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;

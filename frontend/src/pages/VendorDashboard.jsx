import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const VendorDashboard = () => {
  const [vendorInfo, setVendorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if vendor is logged in and approved
    const vendorToken = localStorage.getItem('vendorToken');
    const vendorInfo = localStorage.getItem('vendorInfo');

    if (!vendorToken || !vendorInfo) {
      toast.error("Please login to access vendor dashboard");
      navigate("/vendor-login");
      return;
    }

    try {
      const parsedInfo = JSON.parse(vendorInfo);
      setVendorInfo(parsedInfo);
      setIsLoading(false);
    } catch (error) {
      console.error("Error parsing vendor info:", error);
      localStorage.removeItem('vendorToken');
      localStorage.removeItem('vendorInfo');
      toast.error("Session expired. Please login again.");
      navigate("/vendor-login");
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!vendorInfo) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Dashboard</h1>
        <p className="text-gray-600">Welcome back, {vendorInfo.vendorName}!</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Account Status</h2>
            <p className="text-gray-600">Your vendor account information</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            vendorInfo.status === 'approved' ? 'bg-green-100 text-green-800' :
            vendorInfo.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {vendorInfo.status.toUpperCase()}
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Business Name</p>
            <p className="font-medium text-gray-900">{vendorInfo.businessName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Vendor Name</p>
            <p className="font-medium text-gray-900">{vendorInfo.vendorName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium text-gray-900">{vendorInfo.email}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Products</h3>
          <p className="text-gray-600 mb-4">Add, edit, and manage your products</p>
          <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            Products
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">View Orders</h3>
          <p className="text-gray-600 mb-4">Manage customer orders and shipments</p>
          <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            Orders
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Settings</h3>
          <p className="text-gray-600 mb-4">Update your vendor information</p>
          <button className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
            Settings
          </button>
        </div>
      </div>

      {/* Pending Approval Notice */}
      {vendorInfo.status !== 'approved' && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                {vendorInfo.status === 'pending' 
                  ? "Your account is under review"
                  : "Your account has been rejected"
                }
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {vendorInfo.status === 'pending' 
                  ? "Please wait for admin approval. You will be notified once your account is approved."
                  : "Your account has been rejected. Please contact support for more information."
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
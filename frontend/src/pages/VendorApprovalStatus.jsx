import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { CheckCircle, Clock, XCircle, Loader, Link as LinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VendorApprovalStatus = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not logged in
  if (!user) {
    navigate("/login");
    return null;
  }

  useEffect(() => {
    fetchVendorStatus();
    // Poll every 5 seconds for approval status updates
    const interval = setInterval(fetchVendorStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchVendorStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/vendors/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setVendor(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vendor status");
      console.error("Error fetching vendor status:", err);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Vendor Approval Status
          </h1>
          <p className="text-gray-600">
            Track your vendor registration status
          </p>
        </div>

        {error && (
           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
             {error}
           </div>
         )}

        {!vendor && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              You haven't submitted a vendor application yet.
            </p>
            <a
              href="/become-vendor"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Apply as Vendor
            </a>
          </div>
        )}

         {vendor && (
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            {/* Status Card */}
            <div className="text-center">
              {vendor.isApproved ? (
                <div className="space-y-4">
                  <CheckCircle className="text-green-600 mx-auto" size={80} />
                  <h2 className="text-3xl font-bold text-green-600">
                    Approved! 🎉
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Your vendor account has been approved by admin
                  </p>
                  <p className="text-sm text-gray-500">
                    Approved on:{" "}
                    {vendor.approvedAt
                      ? new Date(vendor.approvedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              ) : vendor.status === "pending" ? (
                <div className="space-y-4">
                  <Clock className="text-yellow-600 mx-auto" size={80} />
                  <h2 className="text-3xl font-bold text-yellow-600">
                    Pending Review
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Your vendor registration is awaiting admin approval
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted on:{" "}
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ) : vendor.status === "rejected" ? (
                <div className="space-y-4">
                  <XCircle className="text-red-600 mx-auto" size={80} />
                  <h2 className="text-3xl font-bold text-red-600">Rejected</h2>
                  <p className="text-gray-600 text-lg">
                    Your vendor application was rejected
                  </p>
                  {vendor.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-semibold mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-700">
                        {vendor.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Vendor Details */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Vendor Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">
                    Company Name
                  </p>
                  <p className="text-gray-800 font-medium">
                    {vendor.companyName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">
                    Status
                  </p>
                  <p className={`font-medium ${
                    vendor.isApproved ? "text-green-600" :
                    vendor.status === "pending" ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {vendor.status === "pending"
                      ? "Pending Review"
                      : vendor.status === "approved"
                      ? "Approved"
                      : "Rejected"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">
                    Commission Rate
                  </p>
                  <p className="text-gray-800 font-medium">
                    {vendor.commissionRate}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase font-semibold">
                    GST Number
                  </p>
                  <p className="text-gray-800 font-medium font-mono">
                    {vendor.gstNo}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Next Steps
              </h3>

              {vendor.isApproved ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">
                      ✓ Account Approved
                    </h4>
                    <p className="text-sm text-green-800 mb-3">
                      Your vendor account is now active. You can:
                    </p>
                    <ul className="text-sm text-green-800 space-y-1 ml-4 list-disc">
                      <li>Add and manage products</li>
                      <li>Track customer orders</li>
                      <li>Monitor your earnings</li>
                      <li>Manage inventory</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => navigate("/vendor/dashboard")}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    <LinkIcon size={20} />
                    <span>Go to Vendor Dashboard</span>
                  </button>
                </div>
              ) : vendor.status === "pending" ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    ⏳ Under Review
                  </h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    Our admin team is reviewing your vendor application.
                    This typically takes 24-48 hours.
                  </p>
                  <p className="text-sm text-yellow-800">
                    You'll receive an email notification when your application
                    is approved or if we need more information.
                  </p>
                  <div className="mt-4 p-3 bg-white rounded border border-yellow-100">
                    <p className="text-xs text-yellow-700 font-mono">
                      💡 Tip: Check your email for updates or{" "}
                      <span className="font-semibold">refresh this page</span> to
                      see the latest status
                    </p>
                  </div>
                </div>
              ) : vendor.status === "rejected" ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2">
                    ✗ Application Rejected
                  </h4>
                  <p className="text-sm text-red-800 mb-3">
                    Your vendor application was not approved at this time.
                  </p>
                  <p className="text-sm text-red-800 mb-4">
                    You can review the rejection reason above and reapply after
                    addressing the concerns.
                  </p>
                  <button
                    onClick={() => navigate("/become-vendor")}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    Reapply as Vendor
                  </button>
                </div>
              ) : null}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Need Help?</strong> If you have questions about your
                vendor application, please contact our support team.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorApprovalStatus;

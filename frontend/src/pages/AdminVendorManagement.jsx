import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Loader,
  Eye,
  Filter,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const AdminVendorManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [approvalData, setApprovalData] = useState({});
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Redirect if not admin
  if (user?.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
        <p className="text-red-600 font-semibold">
          You need admin access to view this page
        </p>
      </div>
    );
  }

  useEffect(() => {
    fetchVendors();
  }, [filterStatus]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/vendors?status=${filterStatus}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setVendors(response.data.vendors);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vendors");
      console.error("Error fetching vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId) => {
    const commissionRate = approvalData[vendorId] || 10;

    try {
      const token = localStorage.getItem("userToken");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/vendors/${vendorId}/approve`,
        { commissionRate },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Vendor approved successfully");
      setFilterStatus("approved");
      setShowModal(false);
      setSelectedVendor(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve vendor");
    }
  };

  const handleReject = async (vendorId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const token = localStorage.getItem("userToken");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/vendors/${vendorId}/reject`,
        { rejectionReason: reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Vendor rejected");
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject vendor");
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Vendor Management
          </h1>
          <p className="text-gray-600">
            Review and approve vendor registrations
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center space-x-4">
          <Filter size={20} className="text-gray-600" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="outline-none bg-gray-100 px-4 py-2 rounded-lg font-medium"
          >
            <option value="pending">Pending (Awaiting Review)</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <span className="ml-auto text-sm text-gray-600 font-medium">
            {vendors.length} vendor(s)
          </span>
        </div>

        {/* Vendors List */}
        {vendors.length > 0 ? (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div
                key={vendor._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {vendor.companyName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Registered: {new Date(vendor.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      vendor.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : vendor.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {vendor.status.charAt(0).toUpperCase() +
                      vendor.status.slice(1)}
                  </span>
                </div>

                {/* Vendor Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">
                      GST Number
                    </p>
                    <p className="text-sm text-gray-800 font-mono">
                      {vendor.gstNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">
                      PAN Number
                    </p>
                    <p className="text-sm text-gray-800 font-mono">
                      {vendor.panNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">
                      Contact Email
                    </p>
                    <p className="text-sm text-gray-800">
                      {vendor.contactPerson?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">
                      Contact Phone
                    </p>
                    <p className="text-sm text-gray-800">
                      {vendor.contactPerson?.phone || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4 pb-4 border-b">
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-2">
                    Pickup Address
                  </p>
                  <p className="text-sm text-gray-800">
                    {vendor.pickupAddress?.street}, {vendor.pickupAddress?.city},{" "}
                    {vendor.pickupAddress?.state} - {vendor.pickupAddress?.pincode}
                  </p>
                </div>

                {/* Business Description */}
                {vendor.businessDescription && (
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">
                      Business Description
                    </p>
                    <p className="text-sm text-gray-700">
                      {vendor.businessDescription}
                    </p>
                  </div>
                )}

                {/* Rejection Reason (if rejected) */}
                {vendor.status === "rejected" && vendor.rejectionReason && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-600 font-semibold uppercase mb-1">
                      Rejection Reason
                    </p>
                    <p className="text-sm text-red-700">
                      {vendor.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Bank Details */}
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-2">
                    Bank Details
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Account:</span>
                      <p className="text-gray-800 font-medium">
                        {vendor.bankDetails?.accountName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Bank:</span>
                      <p className="text-gray-800 font-medium">
                        {vendor.bankDetails?.bankName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Account No:</span>
                      <p className="text-gray-800 font-mono">
                        ****{vendor.bankDetails?.accountNumber?.slice(-4)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">IFSC:</span>
                      <p className="text-gray-800 font-mono">
                        {vendor.bankDetails?.ifscCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Commission (if approved) */}
                {vendor.status === "approved" && (
                  <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm text-green-700 font-semibold">
                      Commission Rate: {vendor.commissionRate}%
                    </p>
                    <p className="text-xs text-green-600">
                      Approved on:{" "}
                      {new Date(vendor.approvedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {vendor.status === "pending" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setApprovalData({ [vendor._id]: 10 });
                        setShowModal(true);
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      <CheckCircle size={18} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(vendor._id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
                    >
                      <XCircle size={18} />
                      <span>Reject</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                      <Eye size={18} />
                      <span>Details</span>
                    </button>
                  </div>
                )}

                {vendor.status === "approved" && (
                  <div className="p-3 bg-blue-50 rounded border border-blue-200 text-blue-700 text-sm font-medium">
                    ✓ Vendor Approved - Can now add products
                  </div>
                )}

                {vendor.status === "rejected" && (
                  <div className="p-3 bg-red-50 rounded border border-red-200 text-red-700 text-sm font-medium">
                    ✗ Vendor Rejected - Cannot add products
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No vendors found
            </h3>
            <p className="text-gray-600">
              {filterStatus === "pending"
                ? "All vendors have been reviewed"
                : `No ${filterStatus} vendors`}
            </p>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Approve Vendor
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-1">Company Name</p>
              <p className="font-semibold text-gray-800">
                {selectedVendor.companyName}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission Rate (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={approvalData[selectedVendor._id] || 10}
                onChange={(e) =>
                  setApprovalData({
                    ...approvalData,
                    [selectedVendor._id]: parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Percentage commission to deduct from vendor sales
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedVendor(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(selectedVendor._id)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendorManagement;

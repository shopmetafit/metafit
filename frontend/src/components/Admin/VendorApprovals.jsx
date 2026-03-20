import { useState, useEffect } from "react";
import { toast } from "sonner";
import { vendorApiService } from "../../services/vendorApi";

const VendorApprovals = () => {
  const [vendors, setVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [rejectReason, setRejectReason] = useState("");
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'

  useEffect(() => {
    fetchAllVendors();
  }, []);

  const fetchAllVendors = async () => {
    setIsLoading(true);
    try {
      const response = await vendorApiService.getAllVendors();
      if (response.success) {
        setAllVendors(response.vendors);
        // Filter based on current filterStatus
        filterVendors(response.vendors, filterStatus);
      } else {
        toast.error("Failed to load vendors");
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  const filterVendors = (vendorsList, status) => {
    if (status === 'all') {
      setVendors(vendorsList);
    } else {
      const filtered = vendorsList.filter(vendor => vendor.status === status);
      setVendors(filtered);
    }
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
    filterVendors(allVendors, status);
  };

  const handleApprove = async () => {
    if (!selectedVendor) return;

    try {
      const response = await vendorApiService.approveVendor(selectedVendor._id);
      if (response.success) {
        toast.success(`${selectedVendor.vendorName} approved as vendor`);
        setShowModal(false);
        setSelectedVendor(null);
        // Refresh the vendor list to show updated status
        fetchAllVendors();
      } else {
        toast.error("Failed to approve vendor");
      }
    } catch (error) {
      console.error("Error approving vendor:", error);
      toast.error("Failed to approve vendor");
    }
  };

  const handleReject = async () => {
    if (!selectedVendor || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      const response = await vendorApiService.rejectVendor(selectedVendor._id, rejectReason);
      if (response.success) {
        toast.success(`${selectedVendor.vendorName} rejected`);
        setShowModal(false);
        setSelectedVendor(null);
        setRejectReason("");
        // Refresh the vendor list to show updated status
        fetchAllVendors();
      } else {
        toast.error("Failed to reject vendor");
      }
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      toast.error("Failed to reject vendor");
    }
  };

  const handleViewDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Management</h2>
            <p className="text-gray-600">Review and manage vendor registration requests</p>
          </div>
          
          {/* Status Filter Controls */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                filterStatus === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({allVendors.length})
            </button>
            <button
              onClick={() => handleStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                filterStatus === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({allVendors.filter(v => v.status === 'pending').length})
            </button>
            <button
              onClick={() => handleStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                filterStatus === 'approved' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved ({allVendors.filter(v => v.status === 'approved').length})
            </button>
            <button
              onClick={() => handleStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                filterStatus === 'rejected' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected ({allVendors.filter(v => v.status === 'rejected').length})
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-gray-500">No pending vendor requests</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vendor Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Business</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Registered</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{vendor.vendorName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vendor.businessName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vendor.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">+91 {vendor.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        vendor.status === 'approved' ? 'bg-green-100 text-green-800' :
                        vendor.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vendor.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(vendor.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleViewDetails(vendor)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs font-semibold"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Vendor Details</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setActionType(null);
                  setRejectReason("");
                }}
                className="text-2xl hover:opacity-80"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Vendor Name</p>
                    <p className="font-medium text-gray-900">{selectedVendor.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="font-medium text-gray-900">{selectedVendor.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedVendor.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">+91 {selectedVendor.phone}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Business Type</p>
                    <p className="font-medium text-gray-900 capitalize">Company</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium text-gray-900">{selectedVendor.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">State</p>
                    <p className="font-medium text-gray-900">{selectedVendor.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pincode</p>
                    <p className="font-medium text-gray-900">{selectedVendor.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Bank Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Account Holder Name</p>
                    <p className="font-medium text-gray-900">{selectedVendor.accountHolderName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bank Account Number</p>
                    <p className="font-medium text-gray-900">{selectedVendor.bankAccountNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IFSC Code</p>
                    <p className="font-medium text-gray-900">{selectedVendor.ifscCode}</p>
                  </div>
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Status Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedVendor.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedVendor.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedVendor.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registered</p>
                    <p className="font-medium text-gray-900">{new Date(selectedVendor.createdAt).toLocaleDateString()}</p>
                  </div>
                  {selectedVendor.approvedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Approved</p>
                      <p className="font-medium text-gray-900">{new Date(selectedVendor.approvedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedVendor.rejectedAt && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Rejected</p>
                        <p className="font-medium text-gray-900">{new Date(selectedVendor.rejectedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm text-gray-600">Rejection Reason</p>
                        <p className="font-medium text-gray-900">{selectedVendor.rejectionReason}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Rejection Reason (if rejecting) */}
              {actionType === "reject" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Rejection *</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why you're rejecting this vendor..."
                    rows="4"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {/* Approval Confirmation (if approving) */}
              {actionType === "approve" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    Are you sure you want to approve <strong>{selectedVendor.vendorName}</strong> as a vendor?
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex gap-3 justify-end">
              {!actionType ? (
                <>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setActionType(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setActionType("approve")}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setActionType("reject")}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                  >
                    Reject
                  </button>
                </>
              ) : actionType === "approve" ? (
                <>
                  <button
                    onClick={() => setActionType(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                  >
                    Confirm Approval
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActionType(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                  >
                    Confirm Rejection
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorApprovals;

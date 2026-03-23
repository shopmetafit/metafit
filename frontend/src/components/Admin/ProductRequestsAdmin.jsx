import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { vendorApiService } from '../../services/vendorApi';

const ProductRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [selectedStatus]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await vendorApiService.getAllProductRequests(selectedStatus);
      setRequests(response.requests);
    } catch (error) {
      console.error('Error fetching product requests:', error);
      toast.error('Failed to fetch product requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await vendorApiService.getProductRequestStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this product request? This will create the product automatically.')) {
      return;
    }

    try {
      const response = await vendorApiService.approveProductRequest(requestId);
      toast.success('Product request approved and product created successfully');
      
      // Update stats in real-time
      setStats(prevStats => ({
        ...prevStats,
        pendingRequests: Math.max(0, (prevStats.pendingRequests || 0) - 1),
        approvedRequests: (prevStats.approvedRequests || 0) + 1,
        totalRequests: prevStats.totalRequests || 0
      }));
      
      // Update the specific request status in the list
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === requestId 
            ? { ...request, status: 'approved' }
            : request
        )
      );
    } catch (error) {
      console.error('Error approving product request:', error);
      toast.error('Failed to approve product request');
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const response = await vendorApiService.rejectProductRequest(requestId, rejectionReason);
      toast.success('Product request rejected');
      setRejectionReason('');
      
      // Update stats in real-time
      setStats(prevStats => ({
        ...prevStats,
        pendingRequests: Math.max(0, (prevStats.pendingRequests || 0) - 1),
        rejectedRequests: (prevStats.rejectedRequests || 0) + 1,
        totalRequests: prevStats.totalRequests || 0
      }));
      
      // Update the specific request status in the list
      setRequests(prevRequests => 
        prevRequests.map(request => 
          request._id === requestId 
            ? { ...request, status: 'rejected', rejectionReason }
            : request
        )
      );
    } catch (error) {
      console.error('Error rejecting product request:', error);
      toast.error('Failed to reject product request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      default: return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Request Management</h1>
              <p className="text-gray-600 mt-1">Review and manage vendor product requests</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  fetchRequests();
                  fetchStats();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-800">{stats.pendingRequests || 0}</p>
                </div>
                <span className="text-2xl">⏳</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Approved</p>
                  <p className="text-2xl font-bold text-green-800">{stats.approvedRequests || 0}</p>
                </div>
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-800">{stats.rejectedRequests || 0}</p>
                </div>
                <span className="text-2xl">❌</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalRequests || 0}</p>
                </div>
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div> */}

          {/* Filter and Actions */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <div className="flex space-x-2">
              {['pending', 'approved', 'rejected', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedStatus === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Showing {requests.length} requests
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Product Requests</h3>
              <p className="text-gray-600">No product requests found for the selected status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)} {request.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <span>SKU: {request.sku}</span>
                        <span>Category: {request.category}</span>
                        <span>Brand: {request.brand}</span>
                        <span>Collection: {request.collection}</span>
                      </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Vendor: {request.vendorName}</span>
                    <span>Email: {request.vendorEmail}</span>
                    <span>Phone: {request.vendorPhone}</span>
                  </div>
                  
                  {/* Product Images Preview */}
                  {request.images && request.images.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Product Images</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {request.images.slice(0, 4).map((image, index) => (
                          <div 
                            key={index} 
                            className="relative group cursor-pointer"
                            onClick={() => setSelectedImage(image.url)}
                          >
                            <img
                              src={image.url}
                              alt={`Product ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-gray-200 group-hover:shadow-md transition-shadow"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA0Q0M3My4yMDkgNDAgODQgNTAuNzkwNCA4NCA2NFY2NFY2NEw2MCA4NFY2NEwzNiA2NFY2NFY0Q0MzNiA1MC43OTA0IDQ2Ljc5MDkgNjAgNjAgNjBWMzlaIiBmaWxsPSIjRkZDRjAwIi8+CjxwYXRoIGQ9Ik02MCA4Q0M3My4yMDkgODAgODQgNjkuMjA5NCA4NCA1NlY1Nkw2MCAzNlY1NkwzNiA1NlY1NlY4Q0MzNiA2OS4yMDk0IDQ2Ljc5MDkgODAgNjAgODBWMzlaIiBmaWxsPSIjRkZDRjAwIi8+Cjwvc3ZnPgo='
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-medium">View</span>
                            </div>
                          </div>
                        ))}
                        {request.images.length > 4 && (
                          <div className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                            <span className="text-gray-600 text-sm font-medium">
                              +{request.images.length - 4} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                    </div>
                    {/* <div className="flex items-center space-x-2">
                      <span className="text-2xl">{request.images[0]?.url ? '📸' : '📷'}</span>
                    </div> */}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Price</span>
                      <p className="font-semibold">₹{request.price}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Stock</span>
                      <p className="font-semibold">{request.countInStock}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Created</span>
                      <p className="font-semibold">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-700">
                        <strong>Rejection Reason:</strong> {request.rejectionReason}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    

                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(request._id)}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            if (selectedRequest === request._id) {
                              setSelectedRequest(null);
                            }
                            // Focus on rejection reason input
                            const reasonInput = document.getElementById(`rejection-reason-${request._id}`);
                            if (reasonInput) reasonInput.focus();
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedRequest === request._id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Product Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Material:</strong> {request.material || 'Not specified'}</p>
                            <p><strong>Weight:</strong> {request.weight || 'Not specified'} kg</p>
                            <p><strong>Video:</strong> {request.videoUrl || 'Not specified'}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Additional Info</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Sizes:</strong> {request.sizes.length > 0 ? request.sizes.join(', ') : 'Not specified'}</p>
                            <p><strong>Colors:</strong> {request.colors.length > 0 ? request.colors.join(', ') : 'Not specified'}</p>
                            <p><strong>Tags:</strong> {request.tags.length > 0 ? request.tags.join(', ') : 'Not specified'}</p>
                            <p><strong>Featured:</strong> {request.isFeatured ? 'Yes' : 'No'}</p>
                            <p><strong>Priority:</strong> {request.priority}</p>
                          </div>
                        </div>
                      </div>

                      {request.variants.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Variants</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {request.variants.map((variant, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-3">
                                <p className="font-medium">{variant.label}</p>
                                <p className="text-sm text-gray-600">Price: ₹{variant.price}</p>
                                <p className="text-sm text-gray-600">Stock: {variant.stock}</p>
                                {variant.sku && <p className="text-sm text-gray-600">SKU: {variant.sku}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {request.dimensions.length || request.dimensions.width || request.dimensions.height ? (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Dimensions</h4>
                          <p className="text-sm text-gray-600">
                            L: {request.dimensions.length}cm × W: {request.dimensions.width}cm × H: {request.dimensions.height}cm
                          </p>
                        </div>
                      ) : null}

                      {request.metaTitle || request.metaDescription || request.metaKeywords ? (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Meta Information</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {request.metaTitle && <p><strong>Title:</strong> {request.metaTitle}</p>}
                            {request.metaDescription && <p><strong>Description:</strong> {request.metaDescription}</p>}
                            {request.metaKeywords && <p><strong>Keywords:</strong> {request.metaKeywords}</p>}
                          </div>
                        </div>
                      ) : null}

                      {request.status === 'pending' && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Reject Request</h4>
                          <div className="space-y-2">
                            <textarea
                              id={`rejection-reason-${request._id}`}
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please provide a reason for rejection..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              rows="3"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleReject(request._id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              >
                                Submit Rejection
                              </button>
                              <button
                                onClick={() => setRejectionReason('')}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                              >
                                Clear Reason
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Image Modal */}
          {selectedImage && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-4xl max-h-full">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
                >
                  ✕
                </button>
                <img
                  src={selectedImage}
                  alt="Product"
                  className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMDAgMjAwTDQ1MCAzMDBIMTUwTDIwMCAyNTBMMTUwIDE1MEwzMDAgMjAwWk0zMDAgMjAwTDI1MCAxNTBMNDAwIDMwMEg1NTBMNTAwIDI1MEw2MDAgMzUwTDQ1MCAyMDBaIiBmaWxsPSIjRkZDRjAwIi8+CjxwYXRoIGQ9Ik0zMDAgMjAwTDI1MCAyNTBMNDAwIDE1MEg1NTBMNTAwIDIwMEw2MDAgMTAwTDQ1MCAyMDBaIiBmaWxsPSIjRkZDRjAwIi8+Cjwvc3ZnPgo='
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductRequestsAdmin;

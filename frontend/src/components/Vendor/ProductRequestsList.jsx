import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { vendorApiService } from '../../services/vendorApi';

const ProductRequestsList = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await vendorApiService.getVendorProductRequests();
      setRequests(response.requests);
    } catch (error) {
      console.error('Error fetching product requests:', error);
      toast.error('Failed to fetch product requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this product request?')) {
      return;
    }

    try {
      await vendorApiService.deleteProductRequest(requestId);
      toast.success('Product request deleted successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error deleting product request:', error);
      toast.error('Failed to delete product request');
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this product request?')) {
      return;
    }

    try {
      await vendorApiService.cancelProductRequest(requestId);
      toast.success('Product request cancelled successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error cancelling product request:', error);
      toast.error('Failed to cancel product request');
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
        <div className="max-w-6xl mx-auto px-4">
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Requests</h1>
              <p className="text-gray-600 mt-1">Manage your product requests and track their approval status</p>
            </div>
            <button
              onClick={() => navigate('/vendor-dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Product Requests</h3>
              <p className="text-gray-600 mb-6">You haven't created any product requests yet.</p>
              <button
                onClick={() => navigate('/vendor/product-request/new')}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Create Your First Product Request
              </button>
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
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>SKU: {request.sku}</span>
                        <span>Category: {request.category}</span>
                        <span>Brand: {request.brand}</span>
                        <span>Collection: {request.collection}</span>
                      </div>
                    </div>
                  
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
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => navigate(`/vendor/product-request/${request._id}`)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancel(request._id)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {request.status === 'rejected' && (
                        <button
                          onClick={() => navigate(`/vendor/product-request/${request._id}`)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                        >
                          Edit & Resubmit
                        </button>
                      )}
                      
                    </div>

                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(request._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {selectedRequest === request._id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Product Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Gender:</strong> {request.gender}</p>
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductRequestsList;
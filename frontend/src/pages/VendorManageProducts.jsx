import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VendorManageProducts = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✅';
      case 'inactive': return '❌';
      case 'draft': return '📝';
      default: return '📄';
    }
  };

  // Mock product data for demonstration
  const mockProducts = [
    {
      _id: '1',
      name: 'Ayurvedic Herbal Oil',
      description: 'Traditional herbal oil for joint pain relief',
      sku: 'AYU-001',
      category: 'Health & Wellness',
      brand: 'MetaFit',
      collection: 'Ayurvedic',
      price: 499,
      countInStock: 50,
      status: 'active',
      createdAt: new Date('2024-01-15'),
      images: [
        { url: 'https://via.placeholder.com/120x120/4CAF50/FFFFFF?text=Oil+1' },
        { url: 'https://via.placeholder.com/120x120/4CAF50/FFFFFF?text=Oil+2' }
      ]
    },
    {
      _id: '2',
      name: 'Organic Turmeric Powder',
      description: 'Premium organic turmeric powder for cooking and health',
      sku: 'ORG-002',
      category: 'Food & Beverages',
      brand: 'MetaFit',
      collection: 'Organic',
      price: 299,
      countInStock: 100,
      status: 'active',
      createdAt: new Date('2024-01-20'),
      images: [
        { url: 'https://via.placeholder.com/120x120/FF9800/FFFFFF?text=Turmeric' }
      ]
    }
  ];

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
              <p className="text-gray-600 mt-1">View and manage your products</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/vendor/product-request/new')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add New Product
              </button>
            </div>
          </div>

          {mockProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-6">You haven't created any products yet.</p>
              <button
                onClick={() => navigate('/vendor/product-request')}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create Your First Product
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mockProducts.map((product) => (
                <div key={product._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(product.status)}`}>
                          {getStatusIcon(product.status)} {product.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                        <span>SKU: {product.sku}</span>
                        <span>Category: {product.category}</span>
                        <span>Brand: {product.brand}</span>
                        <span>Collection: {product.collection}</span>
                      </div>
                      
                      {/* Product Images Preview */}
                      {product.images && product.images.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Product Images</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {product.images.slice(0, 4).map((image, index) => (
                              <div 
                                key={index} 
                                className="relative group cursor-pointer"
                                onClick={() => handleImageClick(image.url)}
                              >
                                <img
                                  src={image.url}
                                  alt={`Product ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg border border-gray-200 group-hover:shadow-md transition-shadow"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                  <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-medium">View</span>
                                </div>
                              </div>
                            ))}
                            {product.images.length > 4 && (
                              <div className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                                <span className="text-gray-600 text-sm font-medium">
                                  +{product.images.length - 4} more
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Price</span>
                      <p className="font-semibold">₹{product.price}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Stock</span>
                      <p className="font-semibold">{product.countInStock}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Created</span>
                      <p className="font-semibold">{product.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => alert('Edit functionality coming soon')}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this product?')) {
                            alert('Delete functionality coming soon');
                          }
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManageProducts;

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { vendorApiService } from '../../services/vendorApi';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleUserRoundIcon } from 'lucide-react';

const ProductRequestForm = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vendorInfo, setVendorInfo] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    countInStock: '',
    sku: '',
    category: '',
    brand: '',
    collection: '',
  });

  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({
    label: '',
    weight: '',
    quantity: '',
    price: '',
    discountPrice: '',
    stock: '',
    sku: '',
    pricePerUnit: ''
  });

  useEffect(() => {
    const fetchVendorInfo = () => {
      try {
        const vendorInfo = localStorage.getItem('vendorInfo');
        if (vendorInfo) {
          setVendorInfo(JSON.parse(vendorInfo));
        } else {
          toast.error('Vendor information not found. Please login again.');
        }
      } catch (error) {
        console.error('Error fetching vendor info:', error);
        toast.error('Failed to load vendor information');
      }
    };

    const fetchProductRequest = async () => {
      if (requestId) {
        try {
          setIsLoading(true);
          const response = await vendorApiService.getProductRequestById(requestId);
          const request = response.request;
          
          setForm({
            name: request.name || '',
            description: request.description || '',
            price: request.price || '',
            discountPrice: request.discountPrice || '',
            countInStock: request.countInStock || '',
            sku: request.sku || '',
            category: request.category || '',
            brand: request.brand || '',
            collection: request.collection || '',
          });

          setHasVariants(request.variants && request.variants.length > 0);
          setVariants(request.variants || []);
          setImagePreviews(request.images || []);
          setVideo(request.videoUrl || null);
          setIsEditing(true);
        } catch (error) {
          console.error('Error fetching product request:', error);
          toast.error('Failed to load product request');
        } finally {
          setIsLoading(false);
        }
      } else {
        fetchVendorInfo();
      }
    };

    fetchProductRequest();
  }, [requestId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.slice(0, 5 - imagePreviews.length);
    
    if (newImages.length + imagePreviews.length > 5) {
      toast.error('You can only upload up to 5 images');
      return;
    }

    const newPreviews = newImages.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Video size should be less than 5MB');
        e.target.value = '';
        return;
      }
      setVideo(file);
    }
  };

  const addVariant = () => {
    if (!newVariant.label || !newVariant.price || !newVariant.stock) {
      toast.error('Please fill in all variant fields');
      return;
    }

    setForm(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          label: newVariant.label,
          weight: newVariant.weight || '',
          quantity: newVariant.quantity || '',
          price: parseFloat(newVariant.price),
          discountPrice: newVariant.discountPrice ? parseFloat(newVariant.discountPrice) : undefined,
          stock: parseInt(newVariant.stock),
          sku: newVariant.sku || '',
          pricePerUnit: newVariant.pricePerUnit || ''
        }
      ]
    }));

    setNewVariant({ label: '', weight: '', quantity: '', price: '', discountPrice: '', stock: '', sku: '', pricePerUnit: '' });
  };

  const removeVariant = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.price || form.price <= 0) newErrors.price = 'Valid price is required';
    if (form.discountPrice && form.discountPrice >= form.price) newErrors.discountPrice = 'Discount price must be less than regular price';
    if (!form.countInStock || form.countInStock < 0) newErrors.countInStock = 'Valid stock count is required';
    if (!form.sku.trim()) newErrors.sku = 'SKU is required';
    if (!form.category.trim()) newErrors.category = 'Category is required';
    if (!form.brand.trim()) newErrors.brand = 'Brand is required';
    if (!form.collection.trim()) newErrors.collection = 'Collection is required';
    if (!imagePreviews.length) newErrors.images = 'At least one product image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    if (!vendorInfo) {
      toast.error('Vendor information not loaded');
      return;
    }

    setIsLoading(true);

    try {
      // Upload images first to get URLs
      const imageUrls = [];
      for (const image of imagePreviews) {
        if (image.file) {
          const uploadResponse = await vendorApiService.uploadImage(image.file);
          imageUrls.push(uploadResponse.imageUrl);
        } else if (image.url) {
          imageUrls.push(image.url);
        }
      }

      // Prepare the product request data
      const productData = {
        name: form.name,
        description: form.description,
        price: form.price,
        discountPrice: form.discountPrice || undefined,
        countInStock: form.countInStock,
        sku: form.sku,
        category: form.category,
        brand: form.brand,
        collection: form.collection,
        hasVariants,
        variants: hasVariants ? form.variants : [],
        // Format images for the backend
        images: imageUrls.map(url => ({ url, altText: '', isPrimary: false })),
        videoUrl: video ? (typeof video === 'string' ? video : URL.createObjectURL(video)) : undefined,
      };

      let response;
      if (isEditing) {
        response = await vendorApiService.updateProductRequest(requestId, productData);
        toast.success('Product request updated successfully');
      } else {
        response = await vendorApiService.createProductRequest(productData);
        toast.success('Product request submitted successfully');
      }

      navigate('/vendor/product-requests');
    } catch (error) {
      console.error('Error submitting product request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit product request');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Product Request' : 'New Product Request'}
              </h1>
              <p className="text-gray-600 mt-1">
                Submit a new product for admin approval
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <CircleUserRoundIcon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-semibold text-gray-900">{vendorInfo?.name || 'Vendor'}</p>
                <p className="text-sm text-gray-600">{vendorInfo?.email}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.sku ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter unique SKU"
                />
                {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your product in detail"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Pricing and Inventory */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Price (₹)
                </label>
                <input
                  type="number"
                  name="discountPrice"
                  value={form.discountPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.discountPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.discountPrice && <p className="text-red-500 text-sm mt-1">{errors.discountPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Count *
                </label>
                <input
                  type="number"
                  name="countInStock"
                  value={form.countInStock}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.countInStock ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.countInStock && <p className="text-red-500 text-sm mt-1">{errors.countInStock}</p>}
              </div>
            </div>

            {/* Category Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Skincare, Haircare, Wellness"
                />
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.brand ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your brand name"
                />
                {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection *
                </label>
                <input
                  type="text"
                  name="collection"
                  value={form.collection}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.collection ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Summer, Winter, Premium"
                />
                {errors.collection && <p className="text-red-500 text-sm mt-1">{errors.collection}</p>}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-800"
                >
                  Click to upload images (max 5)
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, WebP
                </p>
              </div>
              
              {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
              
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                  {imagePreviews.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview || image.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Video
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              {video && (
                <video
                  src={typeof video === 'string' ? video : URL.createObjectURL(video)}
                  controls
                  className="mt-4 w-64 rounded shadow"
                />
              )}
            </div>

            {/* Variants Section */}
            <div className="p-4 border rounded bg-gray-50">
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 font-semibold">Has Variants (Different sizes/weights)</span>
                </label>
              </div>

              {hasVariants && (
                <div>
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={addVariant}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      + Add Variant
                    </button>
                  </div>

                  <div className="space-y-4">
                    {form.variants.map((variant, index) => (
                      <div key={index} className="p-4 border rounded bg-white">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 text-sm">Label (e.g., "1 kg (Pack of 1)")</label>
                            <input
                              type="text"
                              value={variant.label}
                              readOnly
                              className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm">Weight (kg)</label>
                            <input
                              type="number"
                              value={variant.weight}
                              readOnly
                              className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm">Quantity (Pack size)</label>
                            <input
                              type="number"
                              value={variant.quantity}
                              readOnly
                              className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm">Price</label>
                            <input
                              type="number"
                              value={variant.price}
                              readOnly
                              className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm">Discount Price</label>
                            <input
                              type="number"
                              value={variant.discountPrice}
                              readOnly
                              className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm">Stock</label>
                            <input
                              type="number"
                              value={variant.stock}
                              readOnly
                              className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm">SKU</label>
                            <input
                              type="text"
                              value={variant.sku}
                              readOnly
                              className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 text-sm">Price Per Unit (e.g., "₹238/kg")</label>
                            <input
                              type="text"
                              value={variant.pricePerUnit}
                              readOnly
                              className="w-full px-3 py-2 border rounded text-sm bg-gray-50"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Remove Variant
                        </button>
                      </div>
                    ))}
                  </div>

                  {hasVariants && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg mt-4">
                      <input
                        type="text"
                        placeholder="Variant label (e.g., '1 kg')"
                        value={newVariant.label}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, label: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Weight (kg)"
                        value={newVariant.weight}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, weight: e.target.value }))}
                        step="0.1"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={newVariant.quantity}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, quantity: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={newVariant.price}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Discount Price"
                        value={newVariant.discountPrice}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, discountPrice: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={newVariant.stock}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, stock: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="SKU (optional)"
                        value={newVariant.sku}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Price Per Unit (optional)"
                        value={newVariant.pricePerUnit}
                        onChange={(e) => setNewVariant(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/vendor/product-requests')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : isEditing ? 'Update Request' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductRequestForm;
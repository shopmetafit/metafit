import axios from 'axios';

// Create axios instance for vendor API calls
const vendorApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
vendorApi.interceptors.request.use(
  (config) => {
    // Try to get vendor token first, then fall back to user token
    const vendorToken = localStorage.getItem('vendorToken');
    const userToken = localStorage.getItem('userToken');
    const token = vendorToken || userToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Vendor registration API endpoints
export const vendorApiService = {
  // Register a new vendor
  registerVendor: async (vendorData) => {
    try {
      const response = await vendorApi.post('/api/vendor/register', vendorData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Check if phone number already exists
  checkVendorPhone: async (phone) => {
    try {
      const response = await vendorApi.post('/api/vendor/check-vendor-phone', { phone });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error checking phone number' };
    }
  },

  // Send OTP to phone number
  sendOtp: async (phone) => {
    try {
      const response = await vendorApi.post('/api/vendor/send-otp', { phone });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error sending OTP' };
    }
  },

  // Verify OTP
  verifyOtp: async (phone, otp) => {
    try {
      const response = await vendorApi.post('/api/vendor/verify-otp', { phone, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error verifying OTP' };
    }
  },

  // Resend OTP
  resendOtp: async (phone) => {
    try {
      const response = await vendorApi.post('/api/vendor/send-otp', { phone });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error resending OTP' };
    }
  },

  // Update vendor onboarding progress
  updateVendorOnboarding: async (phone, step, formData) => {
    try {
      const response = await vendorApi.post('/api/vendor/update-vendor-onboarding', {
        phone,
        step,
        formData
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error saving progress' };
    }
  },

  // Get pending vendors for approval
  getPendingVendors: async () => {
    try {
      const response = await vendorApi.get('/api/vendor/pending-vendors');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching pending vendors' };
    }
  },

  // Approve vendor
  approveVendor: async (vendorId) => {
    try {
      const response = await vendorApi.post(`/api/vendor/approve-vendor/${vendorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error approving vendor' };
    }
  },

  // Reject vendor
  rejectVendor: async (vendorId, reason) => {
    try {
      const response = await vendorApi.post(`/api/vendor/reject-vendor/${vendorId}`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error rejecting vendor' };
    }
  },

  // Get all vendors
  getAllVendors: async () => {
    try {
      const response = await vendorApi.get('/api/vendor/all-vendors');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching vendors' };
    }
  },

  // Vendor login
  loginVendor: async (email, password) => {
    try {
      const response = await vendorApi.post('/api/vendor/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Vendor OTP login
  loginVendorWithOTP: async (phone, otp) => {
    try {
      const response = await vendorApi.post('/api/vendor/login-otp', { phone, otp });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'OTP login failed' };
    }
  },

  // Product Request Management
  createProductRequest: async (productData) => {
    try {
      const response = await vendorApi.post('/api/vendor/product-requests', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error creating product request' };
    }
  },

  getVendorProductRequests: async () => {
    try {
      const response = await vendorApi.get('/api/vendor/product-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching product requests' };
    }
  },

  getProductRequestById: async (requestId) => {
    try {
      const response = await vendorApi.get(`/api/vendor/product-requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching product request' };
    }
  },

  updateProductRequest: async (requestId, productData) => {
    try {
      const response = await vendorApi.put(`/api/vendor/product-requests/${requestId}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error updating product request' };
    }
  },

  cancelProductRequest: async (requestId) => {
    try {
      const response = await vendorApi.put(`/api/vendor/product-requests/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error cancelling product request' };
    }
  },

  deleteProductRequest: async (requestId) => {
    try {
      const response = await vendorApi.delete(`/api/vendor/product-requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error deleting product request' };
    }
  },

  // Admin Product Request Management
  getAllProductRequests: async (status, vendorId) => {
    try {
      const params = {};
      if (status) params.status = status;
      if (vendorId) params.vendorId = vendorId;
      
      const response = await vendorApi.get('/api/vendor/product-requests/admin/all', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching product requests' };
    }
  },

  getProductRequestByIdAdmin: async (requestId) => {
    try {
      const response = await vendorApi.get(`/api/vendor/product-requests/admin/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching product request' };
    }
  },

  approveProductRequest: async (requestId) => {
    try {
      const response = await vendorApi.put(`/api/vendor/product-requests/admin/${requestId}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error approving product request' };
    }
  },

  rejectProductRequest: async (requestId, reason) => {
    try {
      const response = await vendorApi.put(`/api/vendor/product-requests/admin/${requestId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error rejecting product request' };
    }
  },

  getProductRequestStats: async () => {
    try {
      const response = await vendorApi.get('/api/vendor/product-requests/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching product request stats' };
    }
  },

  // Get vendor products
  getVendorProducts: async () => {
    try {
      const response = await vendorApi.get('/api/vendor/products');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching vendor products' };
    }
  },

  // Image upload
  uploadImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await vendorApi.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error uploading image' };
    }
  },

  // Process product image
  processProductImage: async (imageFile, logoUrl) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (logoUrl) {
        formData.append('logoUrl', logoUrl);
      }
      
      const response = await vendorApi.post('/api/upload/process-product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error processing image' };
    }
  }
};

export default vendorApi;
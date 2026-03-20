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
    const token = localStorage.getItem('userToken');
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
  }
};

export default vendorApi;
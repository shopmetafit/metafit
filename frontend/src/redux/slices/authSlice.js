// authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Retrieve user info and token from localStorage if available
let userFormStorage = null;
try {
  const userInfo = localStorage.getItem("userInfo");
  if (userInfo) {
    userFormStorage = JSON.parse(userInfo);
  }
} catch (error) {
  console.error("Error parsing userInfo from localStorage", error);
  localStorage.removeItem("userInfo");
}

// Check for an existing guest ID in the localStorage or generate a new one
const initialGuestId =
  localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId", initialGuestId);

// Initial state
const initialState = {
  user: userFormStorage,
  guestId: initialGuestId,
  loading: false,
  error: null,
  otpLoading: false,
  otpVerifying: false,
  phoneVerified: false,
};

// Async Thunk for sending OTP
export const sendOTP = createAsyncThunk(
  "auth/sendOTP",
  async (phoneData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/send-otp`,
        phoneData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to send OTP' });
    }
  }
);

// Async Thunk for verifying OTP
export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",
  async (otpData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-otp`,
        otpData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Invalid OTP' });
    }
  }
);

// Async Thunk for User Login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/login`,
        userData
      );
      localStorage.setItem("userInfo", JSON.stringify(response.data.user));
      localStorage.setItem("userToken", response.data.token);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Thunk for Google login
export const googleLoginUserThunk = createAsyncThunk(
  "auth/googleLoginUser",
  async (googleResponse, { rejectWithValue }) => {
    try {
      const idToken = googleResponse.credential;
      if (!idToken) throw new Error("No Google ID token found");

      const resp = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/google-login`,
        { token: idToken }
      );

      if (resp.status === 200 && resp.data?.token && resp.data?.user) {
        localStorage.setItem("userInfo", JSON.stringify(resp.data.user));
        localStorage.setItem("userToken", resp.data.token);
        return resp.data.user;
      } else {
        throw new Error("Invalid server response");
      }
    } catch (error) {
      console.error("Google login failed ❌", error);
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// Async Thunk for User Registration
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      console.log("Registering user with data (thunk):", userData);
      console.log("phone number", userData.phone);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
        userData
      );
      localStorage.setItem("userInfo", JSON.stringify(response.data.user));
      localStorage.setItem("userToken", response.data.token);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.guestId = `guest_${new Date().getTime()}`;
      state.phoneVerified = false;
      localStorage.removeItem("userInfo");
      localStorage.removeItem("userToken");
      localStorage.setItem("guestId", state.guestId);
    },
    generateNewGuestId: (state) => {
      state.guestId = `guest_${new Date().getTime()}`;
      localStorage.setItem("guestId", state.guestId);
    },
    resetPhoneVerification: (state) => {
      state.phoneVerified = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP cases
      .addCase(sendOTP.pending, (state) => {
        state.otpLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.otpLoading = false;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.otpLoading = false;
        state.error = action.payload?.message;
      })
      // Verify OTP cases
      .addCase(verifyOTP.pending, (state) => {
        state.otpVerifying = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state) => {
        state.otpVerifying = false;
        state.phoneVerified = true;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.otpVerifying = false;
        state.error = action.payload?.message;
      })
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      // Google login cases
      .addCase(googleLoginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLoginUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(googleLoginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Google login failed";
      });
  },
});

export const { logout, generateNewGuestId, resetPhoneVerification } = authSlice.actions;
export default authSlice.reducer;
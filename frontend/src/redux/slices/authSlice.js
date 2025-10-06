import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// import { useReducer } from "react";

// Retrieve user info and token from localStorage if available
const userFormStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo"))
  : null;

// Check for an existing  guest ID in the localStorage or generate a new one
const initialGuestId =
  localStorage.getItem("guestId") || `guest_${new Date().getTime()}`;
localStorage.setItem("guestId", initialGuestId);

// Initial state
const initialState = {
  user: userFormStorage,
  guestId: initialGuestId,
  loading: false,
  error: null,
};

//   Async Thunk for User Login

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/login`,
        userData
      );
      // console.log("authsli33", response.data);

      localStorage.setItem("userInfo", JSON.stringify(response.data.user));
      localStorage.setItem("userToken", response.data.token);
      return response.data.user; // Return the user object from the response
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
      // Step 1: Extract Google ID Token
      const idToken = googleResponse.credential;
      if (!idToken) throw new Error("No Google ID token found");

      // Step 2: Send token to backend
      const resp = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/google-login`,
        { token: idToken }
      );

      // Step 3: Validate response
      if (resp.status === 200 && resp.data?.token && resp.data?.user) {
        // Step 4: Store user info and token in localStorage
        localStorage.setItem("userInfo", JSON.stringify(resp.data.user));
        localStorage.setItem("userToken", resp.data.token);

        // Step 5: Return user object for Redux
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

//   Async Thunk for User Registration

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    // console.log("dsd",userData);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/register`,
        userData
      );

      localStorage.setItem("userInfo", JSON.stringify(response.data.user));
      localStorage.setItem("userToken", response.data.token);
      // console.log("dsd",response);
      return response.data.user; // Return the user object from the response
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.guestId = `guest_${new Date().getTime()}`; // Reset guest ID on logout
      localStorage.removeItem("userInfo");
      localStorage.removeItem("userToken");
      localStorage.setItem("guestId", state.guestId);
    },
    generateNewGuestId: (state) => {
      state.guestId = `guest_${new Date().getTime()}`;
      localStorage.setItem("guestId", state.guestId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // ✅ Set the logged-in user
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload; // ✅ Set the registered user
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })
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

export const { logout, generateNewGuestId } = authSlice.actions;

export default authSlice.reducer;

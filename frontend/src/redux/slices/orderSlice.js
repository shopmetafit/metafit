import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk to fetch user orders

export const fetchUserOrders = createAsyncThunk(
  "orders/fetchUserOrders",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        return rejectWithValue({ message: "User not authenticated", statusCode: 401 });
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/my-orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      
      // Handle token expiration (401 Unauthorized)
      if (statusCode === 401) {
        // Import logout here to avoid circular dependency
        const { logout } = await import('./authSlice');
        dispatch(logout());
        return rejectWithValue({ 
          message: "Session expired. Please login again.", 
          statusCode: 401,
          isTokenExpired: true 
        });
      }
      
      return rejectWithValue({ 
        message: error.response?.data?.message || error.message,
        statusCode 
      });
    }
  }
);

// Async thunk to fetch orders details by ID
export const fetchOrderDetails = createAsyncThunk(
  "orders/fetchOrderDetails",
  async (orderId, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        return rejectWithValue({ message: "User not authenticated", statusCode: 401 });
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      const statusCode = error.response?.status;
      
      // Handle token expiration (401 Unauthorized)
      if (statusCode === 401) {
        // Import logout here to avoid circular dependency
        const { logout } = await import('./authSlice');
        dispatch(logout());
        return rejectWithValue({ 
          message: "Session expired. Please login again.", 
          statusCode: 401,
          isTokenExpired: true 
        });
      }
      
      return rejectWithValue({ 
        message: error.response?.data?.message || error.message,
        statusCode 
      });
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    orders: [],
    totalOrders: 0,
    orderDetails: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch orders";
      })
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.orderDetails = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch order details";
      });
  },
});

export default orderSlice.reducer;

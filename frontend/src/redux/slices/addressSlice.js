import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk to fetch saved addresses
export const fetchAddresses = createAsyncThunk(
  "address/fetchAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return rejectWithValue({ message: "Not authenticated" });

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/addresses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch addresses" }
      );
    }
  }
);

// Async thunk to add a new address
export const addAddress = createAsyncThunk(
  "address/addAddress",
  async (addressData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return rejectWithValue({ message: "Not authenticated" });

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/addresses`,
        addressData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to add address" }
      );
    }
  }
);

// Async thunk to update an existing address
export const updateAddress = createAsyncThunk(
  "address/updateAddress",
  async ({ id, addressData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return rejectWithValue({ message: "Not authenticated" });

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/addresses/${id}`,
        addressData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update address" }
      );
    }
  }
);

// Async thunk to set an address as default
export const setDefaultAddress = createAsyncThunk(
  "address/setDefaultAddress",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return rejectWithValue({ message: "Not authenticated" });

      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/addresses/${id}/default`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to set default address" }
      );
    }
  }
);

// Async thunk to delete an address
export const deleteAddress = createAsyncThunk(
  "address/deleteAddress",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return rejectWithValue({ message: "Not authenticated" });

      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/addresses/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete address" }
      );
    }
  }
);

const addressSlice = createSlice({
  name: "address",
  initialState: {
    addresses: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearAddressError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch addresses
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load addresses";
      })

      // Add address
      .addCase(addAddress.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload.isDefault) {
          state.addresses = state.addresses.map((a) => ({ ...a, isDefault: false }));
        }
        state.addresses.unshift(action.payload);
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.message || "Failed to add address";
      })

      // Update address
      .addCase(updateAddress.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        if (updated.isDefault) {
          state.addresses = state.addresses.map((a) => ({
            ...a,
            isDefault: a._id === updated._id,
          }));
        } else {
          const idx = state.addresses.findIndex((a) => a._id === updated._id);
          if (idx !== -1) state.addresses[idx] = updated;
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.message || "Failed to update address";
      })

      // Set default address
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        const defaultId = action.payload._id;
        state.addresses = state.addresses.map((a) => ({
          ...a,
          isDefault: a._id === defaultId,
        }));
      })

      // Delete address
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter((a) => a._id !== action.payload);
      });
  },
});

export const { clearAddressError } = addressSlice.actions;
export default addressSlice.reducer;

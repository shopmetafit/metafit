import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:9000").trim();

const getAuthConfig = () => {
  const token = localStorage.getItem("userToken");
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProductReviews",
  async (productId, { rejectWithValue }) => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.get(
        `${API_URL}/api/store/reviews/product/${productId}`,
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch reviews"
      );
    }
  }
);

export const createReview = createAsyncThunk(
  "reviews/createReview",
  async ({ productId, rating, review }, { rejectWithValue }) => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.post(
        `${API_URL}/api/store/reviews`,
        { productId, rating, review },
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit review"
      );
    }
  }
);

export const updateReview = createAsyncThunk(
  "reviews/updateReview",
  async ({ reviewId, rating, review }, { rejectWithValue }) => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.put(
        `${API_URL}/api/store/reviews/${reviewId}`,
        { rating, review },
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update review"
      );
    }
  }
);

export const deleteReview = createAsyncThunk(
  "reviews/deleteReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.delete(
        `${API_URL}/api/store/reviews/${reviewId}`,
        config
      );
      return { reviewId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete review"
      );
    }
  }
);

// Admin Thunks
export const fetchAdminReviews = createAsyncThunk(
  "reviews/fetchAdminReviews",
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.get(
        `${API_URL}/api/admin/reviews?page=${page}&limit=${limit}`,
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin reviews"
      );
    }
  }
);

export const deleteAdminReview = createAsyncThunk(
  "reviews/deleteAdminReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.delete(
        `${API_URL}/api/admin/reviews/${reviewId}`,
        config
      );
      return { reviewId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete review"
      );
    }
  }
);

export const createSampleReviews = createAsyncThunk(
  "reviews/createSampleReviews",
  async (_, { rejectWithValue }) => {
    try {
      const config = getAuthConfig();
      const { data } = await axios.post(
        `${API_URL}/api/admin/reviews/seed-sample`,
        {},
        config
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate sample reviews"
      );
    }
  }
);

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    reviews: [],
    userReview: null,
    stats: {
      totalReviews: 0,
      averageRating: 0,
      ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      ratingPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
    loading: false,
    submitting: false,
    error: null,
    adminReviews: [],
    adminCounts: { total: 0 },
    adminPagination: { total: 0, page: 1, pages: 1 },
    adminLoading: false,
    adminError: null,
  },
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
      state.adminError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Product Reviews
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews || [];
        state.userReview = action.payload.userReview || null;
        if (action.payload.stats) {
          state.stats = action.payload.stats;
        }
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.userReview = action.payload.review;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Update Review
      .addCase(updateReview.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.userReview = action.payload.review;
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Delete Review
      .addCase(deleteReview.pending, (state) => {
        state.submitting = true;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.submitting = false;
        state.userReview = null;
        state.reviews = state.reviews.filter((r) => r._id !== action.payload.reviewId);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Admin Fetch Reviews
      .addCase(fetchAdminReviews.pending, (state) => {
        state.adminLoading = true;
        state.adminError = null;
      })
      .addCase(fetchAdminReviews.fulfilled, (state, action) => {
        state.adminLoading = false;
        state.adminReviews = action.payload.reviews || [];
        state.adminCounts = action.payload.counts || state.adminCounts;
        state.adminPagination = action.payload.pagination || state.adminPagination;
      })
      .addCase(fetchAdminReviews.rejected, (state, action) => {
        state.adminLoading = false;
        state.adminError = action.payload;
      })
      // Admin Delete Review
      .addCase(deleteAdminReview.fulfilled, (state, action) => {
        state.adminReviews = state.adminReviews.filter(
          (r) => r._id !== action.payload.reviewId
        );
      });
  },
});

export const { clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;

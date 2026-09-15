import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";





// Async thunk to fetch products by collection and optional features
export const fetchProductsByFilters = createAsyncThunk(
  "products/fetchByFilters",
  async ({
    collection,
    size,
    color,
    gender,
    minPrice,
    maxPrice,
    sortBy,
    search,
    category,
    subCategory,
    material,
    location,
    brand,
    limit,
    page,
    goal,
    wellnessGoal,
    subGoal,
  }) => {
    const query = new URLSearchParams();
    if (collection) query.append("collection", collection);
    if (size) query.append("size", size);
    if (color) query.append("color", color);
    if (gender) query.append("gender", gender);
    if (minPrice) query.append("minPrice", minPrice);
    if (maxPrice) query.append("maxPrice", maxPrice);
    if (sortBy) query.append("sortBy", sortBy);
    if (search) query.append("search", search);
    if (category) query.append("category", category);
    if (subCategory) query.append("subCategory", subCategory);
    if (material) query.append("material", material);
    if (location) query.append("location", location);
    if (brand) query.append("brand", brand);
    if (goal) query.append("goal", goal);
    if (wellnessGoal) query.append("wellnessGoal", wellnessGoal);
    if (subGoal) query.append("subGoal", subGoal);
    if (limit) query.append("limit", limit);
    if (page) query.append("page", page);

    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/products?${query.toString()}`
    );

    return response.data;
  }
);


// Thunk to fetch all products
export const fetchAllProducts = createAsyncThunk(
  "products/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products`);
      // console.log("API Response 54:", response.data);
      return response.data; // Assuming your backend returns { products: [...] }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products"
      );
    }
  }
);


// Async thunk to fetch a single product by Id

export const fetchProductDetails = createAsyncThunk(
  "products/fetchProductDetails",
  async (id) => {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`
    );
    console.log("ps51",response.data)
    return response.data;
  }
);

// Async thunk to fetch similar product

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }) => {
    const response = await axios.put(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/${id}`,
      productData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      }
    );
    return response.data;
  }
);

// Async thunk to fetch similar product

export const fetchSimilarProduct = createAsyncThunk(
  "products/fetchSimilarProducts",
  async ({ id }) => {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/products/similar/${id}`
    );
    return response.data;
  }
);

// Async thunk to fetch dynamic wellness goals from active products
export const fetchWellnessGoals = createAsyncThunk(
  "products/fetchWellnessGoals",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/products/wellness-goals`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch wellness goals"
      );
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    products: [],
    allProducts: [],
    selectedProduct: null,
    similarProducts: [],
    wellnessGoals: [],
    wellnessGoalsLoading: false,
    wellnessGoalsError: null,
    totalAllProductsCount: 0,
    loading: false,
    loadingMore: false,
    hasMore: true,
    totalProducts: 0,
    currentPage: 1,
    totalPages: 1,
    error: null,
    filters: {
      category: "",
      subCategory: "",
      size: "",
      color: "",
      gender: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "",
      search: "",
      material: "",
      location: "",
      collection: "",
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: "",
        subCategory: "",
        size: "",
        color: "",
        gender: "",
        brand: "",
        minPrice: "",
        maxPrice: "",
        sortBy: "",
        search: "",
        material: "",
        location: "",
        collection: "",
      };
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsByFilters.pending, (state, action) => {
        const isNextPage = action.meta.arg?.page > 1;
        if (isNextPage) {
          state.loadingMore = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchProductsByFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        const payloadData = action.payload;
        const isPaginated = payloadData && !Array.isArray(payloadData) && Array.isArray(payloadData.products);
        const newProducts = isPaginated ? payloadData.products : (Array.isArray(payloadData) ? payloadData : []);
        const reqPage = action.meta.arg?.page || 1;

        if (reqPage > 1) {
          const existingIds = new Set(state.products.map((p) => p._id));
          const filtered = newProducts.filter((p) => !existingIds.has(p._id));
          state.products = [...state.products, ...filtered];
        } else {
          state.products = newProducts;
        }

        if (isPaginated) {
          state.totalProducts = payloadData.totalProducts;
          state.totalPages = payloadData.totalPages;
          state.currentPage = payloadData.page;
          state.hasMore = payloadData.hasMore;
        } else {
          state.totalProducts = state.products.length;
          state.totalPages = 1;
          state.currentPage = 1;
          state.hasMore = false;
        }
      })
      .addCase(fetchProductsByFilters.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.error.message;
      })
      // handle fetching single product details
      .addCase(fetchProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload;
        const index = state.products.findIndex(
          (product) => product.id === updatedProduct.id
        );
        if (index !== -1) {
          state.products[index] = updatedProduct;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchSimilarProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimilarProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.similarProducts = action.payload;
      })
      .addCase(fetchSimilarProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
       // fetch all products
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
          // console.log("Action Payload:", action.payload);
        state.loading = false;
        state.allProducts = action.payload; // store unfiltered list
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetch wellness goals
      .addCase(fetchWellnessGoals.pending, (state) => {
        state.wellnessGoalsLoading = true;
        state.wellnessGoalsError = null;
      })
      .addCase(fetchWellnessGoals.fulfilled, (state, action) => {
        state.wellnessGoalsLoading = false;
        if (action.payload && typeof action.payload === "object") {
          state.wellnessGoals = Array.isArray(action.payload.goals)
            ? action.payload.goals
            : Array.isArray(action.payload)
            ? action.payload
            : [];
          state.totalAllProductsCount = action.payload.totalAllProducts || 0;
        } else {
          state.wellnessGoals = [];
        }
      })
      .addCase(fetchWellnessGoals.rejected, (state, action) => {
        state.wellnessGoalsLoading = false;
        state.wellnessGoalsError = action.payload;
      });
  },
});

export const { setFilters, clearFilters } = productsSlice.actions;
export default productsSlice.reducer;

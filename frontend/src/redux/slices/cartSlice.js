import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  attachReferralToCartProducts,
  getReferralContext,
} from "../../services/referralStorage";

// helper function to load card from localstorage
const loadCartFromStorage = () => {
  const storedCart = localStorage.getItem("cart");
  return storedCart ? JSON.parse(storedCart) : { products: [] };
};

// Helper function to save cart to localStorage
const saveCartToStorage = (cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
};

const normalizeCart = (cart, referralOverride) => {
  const nextCart = cart || { products: [] };
  const referral = referralOverride || getReferralContext();

  if (nextCart.products) {
    nextCart.products = nextCart.products.map((product) => ({
      ...product,
      price: product.price || 0,
    }));
    nextCart.products = attachReferralToCartProducts(nextCart.products, referral);
  }

  return nextCart;
};

// Fetch a cart for a user or guest
export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async ({ userId, guestId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {
          params: { userId, guestId },
        }
      );
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error.message.error);
    }
  }
);

// Add an item to the cart for a user or guest
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (
    { productId, quantity, size, color, guestId, userId },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        { productId, quantity, size, color, guestId, userId }
      );
      // console.log("cs46",response.data)
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// update the quantity of an item in cart
export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async (
    { productId, quantity, size, color, guestId, userId },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        {
          productId,
          quantity,
          size,
          color,
          guestId,
          userId,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

//Remove an item from cart
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async ({ productId, size, color, guestId, userId }, { rejectWithValue }) => {
    try {
      const response = await axios({
        method: "DELETE",
        url: `${import.meta.env.VITE_BACKEND_URL}/api/cart`,
        data: { productId, size, color, guestId, userId },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Merge guest cart into user cart
export const mergeCart = createAsyncThunk(
  "cart/mergeCart",
  async ({ guestId, user }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart/merge`,
        { guestId, user },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      // console.log("cartsl112",response);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const cartSlice = createSlice({
  name: "Cart",
  initialState: {
    cart: loadCartFromStorage(),
    loading: false,
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.cart = { products: [] };
      localStorage.removeItem("cart");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        const cart = normalizeCart(action.payload);
        state.cart = cart;
        saveCartToStorage(cart);
      })
      .addCase(fetchCart.rejected, (state,action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch Cart";
      }).addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const cart = normalizeCart(action.payload, action.meta.arg.referral);
        state.cart = cart;
        saveCartToStorage(cart);
      })
      .addCase(updateCartItemQuantity.rejected, (state,action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to add to Cart";
      }).addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = normalizeCart(action.payload);
        saveCartToStorage(state.cart);
      }).addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = normalizeCart(action.payload);
        saveCartToStorage(state.cart);
      })
      .addCase(removeFromCart.rejected, (state,action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to remove item";
      }).addCase(mergeCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(mergeCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = normalizeCart(action.payload);
        saveCartToStorage(state.cart);
      })
      .addCase(mergeCart.rejected, (state,action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to merge Cart";
      })
  },
});

export const {clearCart}= cartSlice.actions;

export default cartSlice.reducer;

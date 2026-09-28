import { createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";

const STORAGE_KEY = "metafit_compare_items";

const loadInitialItems = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.slice(0, 4) : [];
    }
  } catch (err) {
    console.error("Error reading compare items:", err);
  }
  return [];
};

const persistItems = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Error saving compare items:", err);
  }
};

const initialState = {
  items: loadInitialItems(),
  isCompareModalOpen: false,
};

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload;
      if (!product || !product._id) return;

      const alreadyExists = state.items.some((item) => item._id === product._id);
      if (alreadyExists) {
        toast.info("Product is already in comparison");
        return;
      }

      if (state.items.length >= 4) {
        toast.warning("Maximum 4 products can be compared at a time.");
        return;
      }

      state.items.push(product);
      persistItems(state.items);
      toast.success(`Added to Compare (${state.items.length}/4)`);
    },

    removeFromCompare: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((item) => item._id !== productId);
      persistItems(state.items);
      if (state.items.length === 0) {
        state.isCompareModalOpen = false;
      }
    },

    toggleCompare: (state, action) => {
      const product = action.payload;
      if (!product || !product._id) return;

      const existsIndex = state.items.findIndex((item) => item._id === product._id);
      if (existsIndex >= 0) {
        state.items.splice(existsIndex, 1);
        persistItems(state.items);
        toast.info("Removed from Compare");
        if (state.items.length === 0) {
          state.isCompareModalOpen = false;
        }
      } else {
        if (state.items.length >= 4) {
          toast.warning("Maximum 4 products can be compared at a time.");
          return;
        }

        state.items.push(product);
        persistItems(state.items);
        toast.success(`Added to Compare (${state.items.length}/4)`);
      }
    },

    clearCompare: (state) => {
      state.items = [];
      persistItems([]);
      state.isCompareModalOpen = false;
      toast.info("Comparison cleared");
    },

    openCompareModal: (state) => {
      if (state.items.length === 0) {
        toast.info("Select at least 1 product to compare");
        return;
      }
      state.isCompareModalOpen = true;
    },

    closeCompareModal: (state) => {
      state.isCompareModalOpen = false;
    },
  },
});

export const {
  addToCompare,
  removeFromCompare,
  toggleCompare,
  clearCompare,
  openCompareModal,
  closeCompareModal,
} = compareSlice.actions;

export default compareSlice.reducer;

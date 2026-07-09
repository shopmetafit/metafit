import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice"
import productReducer from "./slices/productSlice"
import cartReducer from "./slices/cartSlice";
import checkoutReducer from "./slices/checkoutSlice"
import orderReducer from "./slices/orderSlice"
import adminReducer from "./slices/adminSlice"
import adminProductReducer from "./slices/adminProductSlice"
import adminOrderReducer from "./slices/adminOrderSlice"
import wishlistReducer from "./slices/wishlistSlice"
const store = configureStore({
    reducer:{
        auth: authReducer,
        products: productReducer,
        cart:cartReducer,
        checkout:checkoutReducer,
        orders:orderReducer,
        admin:adminReducer,
        adminProducts:adminProductReducer,
        adminOrders:adminOrderReducer,
        wishlist: wishlistReducer,
    }
});

export default store;
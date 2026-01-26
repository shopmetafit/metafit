import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import UserLayout from "./components/Layout/UserLayout";
import Home from "./pages/Home";
import { Toaster } from "sonner";
import Login from "./pages/Login";
import PrivacyPolicy from "./pages/privacyPolicy";
import RefundPolicy from "./pages/refundPolicy";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Collection from "./pages/CollectionPage";
import ProductDetails from "./components/Products/ProductDetails";
import Checkout from "./components/Cart/Checkout";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminHomePage from "./pages/AdminHomePage";
import UserManagement from "./components/Admin/UserManagement";
import ProductManagement from "./components/Admin/ProductManagement";
import EditProductPage from "./components/Admin/EditProductPage";
import OrderManagement from "./components/Admin/OrderManagement";
import NewProductPage from "./components/Admin/NewProductPage";

import { Provider } from "react-redux";
import store from "./redux/store";
import ProtectedRoutes from "./components/common/ProtectedRoutes";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import ShippingPolicy from "./pages/ShippingPolicy";
import TermsConditions from "./pages/TermsConditions";
import PricingPolicy from "./pages/PricingPolicy";


import BlogList from "./components/Blog/BlogList";
import BlogDetail from "./components/Blog/BlogDetail";
import BlogEditor from "./components/Admin/BlogEditor";
import BlogDashboard from "./components/Admin/BlogDashboard";

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<UserLayout />}>
             <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="profile" element={<Profile />} />
            <Route path="collections/:collection" element={<Collection />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="contactUs" element={<ContactUs />} />
            <Route path="aboutUs" element={< AboutUs/>} />
            <Route path="privacyPolicy" element={< PrivacyPolicy/>} />
            <Route path="refundPolicy" element={< RefundPolicy/>} />
            <Route path="shippingPolicy" element={< ShippingPolicy/>} />
            <Route path="termsConditions" element={< TermsConditions/>} />
            <Route path="pricingPolicy" element={< PricingPolicy/>} />
            <Route
              path="order-confirmation"
              element={<OrderConfirmationPage />}
            />
            <Route path="order/:id" element={<OrderDetailsPage />} />
            <Route path="my-orders" element={<MyOrdersPage />} />
            <Route path="blog" element={<BlogList />} />
            <Route path="blog/:slug" element={<BlogDetail />} />
          
          </Route>
          <Route
            path="/admin"
            element={
              <ProtectedRoutes role="admin">
                <AdminLayout />
              </ProtectedRoutes>
            }
          >
            <Route index element={<AdminHomePage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="products/new" element={<NewProductPage />} />
            <Route path="products/:id/edit" element={<EditProductPage />} />
            <Route path="orders" element={<OrderManagement />} />
         <Route path="blogs" element={<BlogDashboard />} />
            <Route path="blogs/create" element={<BlogEditor />} />
            <Route path="blogs/:id" element={<BlogEditor />} />
         
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
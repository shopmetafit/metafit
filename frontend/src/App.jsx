import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import store from "./redux/store";

import UserLayout from "./components/Layout/UserLayout";
import Collection from "./pages/CollectionPage";
import ProtectedRoutes from "./components/common/ProtectedRoutes";
import SessionExpiredModal from "./components/common/SessionExpiredModal";
import { readReferralParams, saveReferralContext } from "./services/referralStorage";
import { trackMetaEvent } from "./lib/meta-pixel";

// Lazy-loaded route components for optimal initial bundle performance
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const ProductDetails = lazy(() => import("./components/Products/ProductDetails"));
const Checkout = lazy(() => import("./components/Cart/Checkout"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"));
const OrderDetailsPage = lazy(() => import("./pages/OrderDetailsPage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const MyAddressesPage = lazy(() => import("./pages/MyAddressesPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("./pages/privacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/refundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const PricingPolicy = lazy(() => import("./pages/PricingPolicy"));

const BlogList = lazy(() => import("./components/Blog/BlogList"));
const BlogDetail = lazy(() => import("./components/Blog/BlogDetail"));
const RoutineBuilderPage = lazy(() => import("./pages/RoutineBuilderPage"));

const VendorLogin = lazy(() => import("./pages/VendorLogin"));
const VendorRegister = lazy(() => import("./pages/VendorRegister"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const VendorOrdersPage = lazy(() => import("./pages/VendorOrdersPage"));
const VendorManageProducts = lazy(() => import("./pages/VendorManageProducts"));
const ProductRequestForm = lazy(() => import("./components/Vendor/ProductRequestForm"));
const ProductRequestsList = lazy(() => import("./components/Vendor/ProductRequestsList"));

const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const AdminHomePage = lazy(() => import("./pages/AdminHomePage"));
const UserManagement = lazy(() => import("./components/Admin/UserManagement"));
const ProductManagement = lazy(() => import("./components/Admin/ProductManagement"));
const EditProductPage = lazy(() => import("./components/Admin/EditProductPage"));
const OrderManagement = lazy(() => import("./components/Admin/OrderManagement"));
const NewProductPage = lazy(() => import("./components/Admin/NewProductPage"));
const BlogEditor = lazy(() => import("./components/Admin/BlogEditor"));
const BlogDashboard = lazy(() => import("./components/Admin/BlogDashboard"));
const VendorApprovals = lazy(() => import("./components/Admin/VendorApprovals"));
const ProductRequestsAdmin = lazy(() => import("./components/Admin/ProductRequestsAdmin"));
const ReferralAssignments = lazy(() => import("./components/Admin/ReferralAssignments"));
const ReviewManagement = lazy(() => import("./components/Admin/ReviewManagement"));

// Minimalist smooth spinner fallback for lazy routes
const PageLoader = () => (
  <div className="min-h-[50vh] w-full flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-2.5">
      <div className="w-8 h-8 border-3 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
      <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">Loading...</span>
    </div>
  </div>
);

const GlobalReferralTracker = () => {
  const location = useLocation();
  useEffect(() => {
    const params = readReferralParams(location.search);
    if (params) {
      saveReferralContext(params);
    }
  }, [location]);
  return null;
};

const MetaPixelPageViewTracker = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackMetaEvent("PageView");
  }, [location.pathname, location.search]);

  return null;
};

const App = () => {
  return (
    <Provider store={store}>
      <SessionExpiredModal />
      <BrowserRouter>
        <GlobalReferralTracker />
        <MetaPixelPageViewTracker />
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<UserLayout />}>
              <Route index element={<Collection />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="vendor-login" element={<VendorLogin />} />
              <Route path="vendor-register" element={<VendorRegister />} />
              <Route path="vendor-dashboard" element={<VendorDashboard />} />
              <Route path="vendor/orders" element={<VendorOrdersPage />} />
              <Route path="vendor/manage-products" element={<VendorManageProducts />} />
              <Route path="vendor/product-request/new" element={<ProductRequestForm />} />
              <Route path="vendor/product-request/:requestId" element={<ProductRequestForm />} />
              <Route path="vendor/product-requests" element={<ProductRequestsList />} />
              <Route path="profile" element={<Profile />} />
              <Route path="collections/:collection" element={<Collection />} />
              <Route path="category/:categorySlug" element={<Collection />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="about" element={<AboutUs />} />
              <Route path="contact" element={<ContactUs />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="refund-policy" element={<RefundPolicy />} />
              <Route path="shipping-policy" element={<ShippingPolicy />} />
              <Route path="terms" element={<TermsConditions />} />
              <Route path="pricing-policy" element={<PricingPolicy />} />

              {/* Legacy URL Redirects for Backward Compatibility */}
              <Route path="aboutUs" element={<Navigate to="/about" replace />} />
              <Route path="contactUs" element={<Navigate to="/contact" replace />} />
              <Route path="privacyPolicy" element={<Navigate to="/privacy-policy" replace />} />
              <Route path="refundPolicy" element={<Navigate to="/refund-policy" replace />} />
              <Route path="shippingPolicy" element={<Navigate to="/shipping-policy" replace />} />
              <Route path="termsConditions" element={<Navigate to="/terms" replace />} />
              <Route path="pricingPolicy" element={<Navigate to="/pricing-policy" replace />} />

              <Route
                path="order-confirmation"
                element={<OrderConfirmationPage />}
              />
              <Route path="order/:id" element={<OrderDetailsPage />} />
              <Route path="my-orders" element={<MyOrdersPage />} />
              <Route path="my-addresses" element={<MyAddressesPage />} />
              <Route path="wishlist" element={<WishlistPage />} />

              <Route path="blog" element={<BlogList />} />
              <Route path="blog/:slug" element={<BlogDetail />} />
              <Route path="routine-builder" element={<RoutineBuilderPage />} />

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
              <Route path="vendor-approvals" element={<VendorApprovals />} />
              <Route path="product-requests" element={<ProductRequestsAdmin />} />
              <Route path="referrals" element={<ReferralAssignments />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="blogs" element={<BlogDashboard />} />
              <Route path="blogs/create" element={<BlogEditor />} />
              <Route path="blogs/:id" element={<BlogEditor />} />
              <Route path="reviews" element={<ReviewManagement />} />

            </Route>

          </Routes>
        </Suspense>
      </BrowserRouter>
    </Provider>
  );
};

export default App;


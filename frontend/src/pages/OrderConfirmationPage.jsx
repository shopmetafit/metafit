import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircle, Package, Truck, CreditCard, MapPin, ReceiptText } from "lucide-react";

import { clearCart } from "../redux/slices/cartSlice";
import { clearReferralContext } from "../services/referralStorage";

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { checkout, loading } = useSelector((state) => state.checkout);
  const { user } = useSelector((state) => state.auth);

  // Clear the cart when order is confirm
  useEffect(() => {
    if (checkout && checkout._id) {
      dispatch(clearCart());
      localStorage.removeItem("cart");
      localStorage.removeItem("guestId");
      clearReferralContext();
    } else if (!loading && !user) {
      navigate("/login");
    } else if (!loading && !checkout) {
      setTimeout(() => {
        navigate("/my-orders");
      }, 2000);
    }
  }, [checkout, dispatch, navigate, loading, user]);

  const calculateEstimateDelivery = (createdAt) => {
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10);
    return orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          <h2 className="text-lg font-semibold text-gray-800">Processing order...</h2>
        </div>
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow-sm text-center max-w-sm w-full">
          <p className="text-amber-600 mb-4 font-medium">Order details not found.</p>
          <button
            onClick={() => navigate("/my-orders")}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  const itemsList = checkout.orderItems || checkout.checkoutItems || [];
  const subtotal = itemsList.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || item.qty || 1)), 0);
  const deliveryCharge = checkout.deliveryCharge || 0;
  const discount = checkout.couponDiscount || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 font-sans flex flex-col items-center">
      <div className="w-full max-w-3xl">

        {/* Success Banner - Highly Compact */}
        <div className="bg-emerald-600 text-white rounded-t-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-md">
          <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-200 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">Order Confirmed!</h1>
            <p className="text-emerald-100 text-xs sm:text-sm">We're getting your order ready to be shipped.</p>
          </div>
        </div>

        {/* Unified Detail Card */}
        <div className="bg-white rounded-b-2xl shadow-md border-x border-b border-gray-100 p-4 sm:p-6 flex flex-col gap-5 sm:gap-6">

          {/* Top Row: Order Info & Delivery Estimate */}
          <div className="flex flex-wrap md:flex-nowrap justify-between gap-4 bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold tracking-wide">Order #{checkout._id.slice(-8)}</p>
                <p className="text-sm font-semibold text-gray-900">{new Date(checkout.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4 w-full md:w-auto">
              <Truck className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold tracking-wide">Est. Delivery</p>
                <p className="text-sm font-semibold text-emerald-700">By {calculateEstimateDelivery(checkout.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Items & Layout Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Col: Items */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b pb-2">
                <Package className="h-4 w-4" /> Items ({itemsList.length})
              </h3>
              <div className="max-h-48 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {itemsList.map((item) => (
                  <div key={item.productId} className="flex gap-3 items-center">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover border border-gray-200 bg-gray-50" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {item.color} {item.color && item.size && '|'} {item.size}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">₹{(item.price || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity || item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Address & Payment Summary */}
            <div className="space-y-4">

              {/* Address */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b pb-2">
                  <MapPin className="h-4 w-4" /> Shipping To
                </h3>
                <p className="text-sm font-medium text-gray-900 pt-1">
                  {checkout.shippingAddress?.firstName} {checkout.shippingAddress?.lastName}
                </p>
                <p className="text-xs text-gray-600 leading-tight">
                  {checkout.shippingAddress?.address}, {checkout.shippingAddress?.city}, {checkout.shippingAddress?.postalCode}
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-3">
                  <CreditCard className="h-4 w-4" /> Summary
                </h3>
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className={`font-medium ${deliveryCharge === 0 ? "text-emerald-600" : "text-gray-900"}`}>
                      {deliveryCharge === 0 ? "Free" : `+ ₹${deliveryCharge.toLocaleString()}`}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount {checkout.couponCode && `(${checkout.couponCode})`}</span>
                      <span className="font-medium">- ₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-emerald-600">₹{checkout.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate("/my-orders")}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Track Order
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderConfirmationPage;

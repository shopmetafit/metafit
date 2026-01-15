import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { clearCart } from "../redux/slices/cartSlice";

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const { checkout, loading } = useSelector((state) => state.checkout);
  const { user } = useSelector((state) => state.auth);

  // Clear the cart when order is confirm
  useEffect(() => {
    if (checkout && checkout._id) {
      console.log("✓ Order confirmed, clearing cart");
      dispatch(clearCart());
      localStorage.removeItem("cart");
      localStorage.removeItem("guestId");
    } else if (!loading && !user) {
      // If not loading and user not authenticated, redirect to login
      navigate("/login");
    } else if (!loading && !checkout) {
      // If checkout data is missing and not loading, redirect to orders
      setTimeout(() => {
        navigate("/my-orders");
      }, 2000); // Give 2 seconds for data to load
    }
  }, [checkout, dispatch, navigate, loading, user]);

  const calculateEstimateDelivery = (createdAt) => {
    const orderDate = new Date(createdAt);
    orderDate.setDate(orderDate.getDate() + 10); // add 10 days to the order date
    return orderDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800">Processing your order...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-4xl font-bold text-center text-emerald-700 mb-8">
        Thank You For Your Order!
      </h1>

      {checkout ? (
        <div className="p-6 rounded-lg border">
          <div className="flex justify-between mb-20">
            {/* order id and date */}
            <div>
              <h2 className="text-lg font-semibold">Order Id: {checkout._id}</h2>
              <p className="text-gray-500">
                Order Date: {new Date(checkout.createdAt).toLocaleDateString()}
              </p>
            </div>
            {/* estimated delivery */}
            <div>
              <p className="text-neutral-700 text-sm">
                Estimated Delivery: {calculateEstimateDelivery(checkout.createdAt)}
              </p>
            </div>
          </div>
          
          {/* Order items */}
          <div className="mb-20">
            {checkout.checkoutItems.map((item) => (
              <div key={item.productId} className="flex items-center mb-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md mr-4"
                />
                <div>
                  <h4 className="text-md font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    {item.color} | ₹{item.price}
                  </p>
                </div>
                <div className="mx-auto text-right">
                  <p className="text-md">₹{item.price}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* payment and delivery info */}
          <div className="grid grid-cols-2 gap-8">
            {/* payment info */}
            <div>
              <h4 className="text-lg font-semibold mb-2">Payment</h4>
              <p className="text-gray-600">Razorpay</p>
              <p className="text-gray-600 font-semibold text-lg mt-2">₹{checkout.totalPrice}</p>
            </div>
            {/* delivery info */}
            <div>
              <h4 className="text-lg font-semibold mb-2">Delivery Address</h4>
              <p className="text-gray-600">
                {checkout.shippingAddress?.firstName} {checkout.shippingAddress?.lastName}
              </p>
              <p className="text-gray-600">
                {checkout.shippingAddress?.address}
              </p>
              <p className="text-gray-600">
                {checkout.shippingAddress?.city}, {checkout.shippingAddress?.postalCode}
              </p>
              <p className="text-gray-600">
                {checkout.shippingAddress?.country}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 mb-4">
            Order confirmation not found. Redirecting to your orders...
          </p>
          <button
            onClick={() => navigate("/my-orders")}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            View My Orders
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmationPage;

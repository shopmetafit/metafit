import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../redux/slices/orderSlice";
import { Package, CalendarDays, MapPin, CreditCard, ChevronRight, ShoppingBag } from "lucide-react";

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token || !user) {
      navigate("/login");
      return;
    }
    dispatch(fetchUserOrders());
  }, [user?._id, dispatch, navigate]);

  useEffect(() => {
    if (error && (error.includes("Session expired") || (error.includes("token") && error.includes("failed")))) {
      navigate("/login");
    }
  }, [error, navigate]);

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  if (loading) return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Fetching your orders...</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center max-w-sm w-full">
          <p className="text-red-700 font-bold text-lg mb-2">Oops!</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => dispatch(fetchUserOrders())}
            className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">My Orders</h2>
          <p className="text-gray-500 mt-1 text-sm">View and manage your purchase history</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => handleRowClick(order._id)}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
              >
                {/* Header Section */}
                <div className="bg-gray-50/50 px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex gap-6 flex-wrap">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Order Number</p>
                      <p className="text-sm font-semibold text-gray-900">#{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Order Date</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Total Amount</p>
                      <p className="text-sm font-bold text-emerald-600">₹{order.totalPrice?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1 ${
                        order.isPaid
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order.isPaid ? "Paid" : "Pending"}
                    </span>
                    <button className="text-emerald-600 sm:hidden flex items-center text-sm font-semibold">
                      View <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">
                  {/* Items Preview */}
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-3 flex items-center gap-1.5">
                      <Package className="h-4 w-4" /> Items ({order.orderItems.length})
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {order.orderItems.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="relative group/item">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-gray-100 bg-gray-50 p-1 overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain rounded-lg" />
                          </div>
                          <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border border-white">
                            {item.quantity || item.qty || 1}
                          </span>
                        </div>
                      ))}
                      {order.orderItems.length > 4 && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-500">+{order.orderItems.length - 4} more</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Details Preview */}
                  <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 space-y-4 flex flex-col justify-center">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {order.shippingAddress?.city}, {order.shippingAddress?.country}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
                      <p className="text-sm font-medium text-gray-900">
                        {order.paymentMethod || "Online Payment"}
                      </p>
                    </div>

                    <button className="hidden sm:flex mt-2 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-900 text-sm font-semibold rounded-lg items-center justify-center gap-1 transition-colors border border-gray-200">
                      View Order Details <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-auto mt-12">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-8">You haven't placed any orders. Discover our collection and make your first purchase!</p>
            <button
              onClick={() => navigate("/collections/all")}
              className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all shadow-md"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;

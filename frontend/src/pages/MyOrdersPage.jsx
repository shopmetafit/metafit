import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { fetchUserOrders } from "../redux/slices/orderSlice";
import {
  Package,
  CalendarDays,
  MapPin,
  CreditCard,
  ChevronRight,
  ShoppingBag,
  Download,
  FileText,
  Loader2,
  Eye,
  User,
  Heart,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token || !user) {
      navigate("/login");
      return;
    }
    dispatch(fetchUserOrders());
  }, [user?._id, dispatch, navigate]);

  useEffect(() => {
    if (
      error &&
      (error.includes("Session expired") ||
        (error.includes("token") && error.includes("failed")))
    ) {
      navigate("/login");
    }
  }, [error, navigate]);

  const handleRowClick = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  const handleDownloadInvoice = async (e, orderId, orderNumber) => {
    e.stopPropagation();
    const token = localStorage.getItem("userToken");
    if (!token) {
      toast.error("Please log in to download invoice");
      return;
    }

    try {
      setDownloadingInvoiceId(orderId);
      toast.info("Generating Invoice...");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/invoice`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `M-Wellness-Bazaar-Invoice-${orderNumber || orderId.slice(-8)}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully!");
    } catch (err) {
      console.error("Invoice download error:", err);
      toast.error("Unable to generate invoice. Please try again.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047ca8] mx-auto mb-4"></div>
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
            className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6] text-gray-800 antialiased py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ── Breadcrumb Navigation ── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-4 overflow-x-auto whitespace-nowrap"
        >
          <Link to="/" className="hover:text-[#022824] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
          <Link to="/profile" className="hover:text-[#022824] transition-colors">
            My Account
          </Link>
          <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
          <span className="text-gray-900 font-semibold">My Orders</span>
        </nav>

        {/* ── Top Account Navigation Tabs ── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-1 sm:p-1.5 mb-4 sm:mb-6 grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-1">
          <Link
            to="/profile"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
          >
            <User className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="hidden sm:inline">Profile Information</span>
            <span className="sm:hidden font-medium">Profile</span>
          </Link>
          <Link
            to="/my-orders"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-semibold bg-[#022824] text-white shadow-xs text-center"
          >
            <Package className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="hidden sm:inline">My Orders ({orders.length})</span>
            <span className="sm:hidden font-medium">Orders</span>
          </Link>
          <Link
            to="/my-addresses"
            className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
          >
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Saved Addresses</span>
            <span className="sm:hidden font-medium">Addresses</span>
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              My Orders
            </h1>
            <p className="text-gray-500 mt-0.5 text-xs sm:text-sm">
              View your order history, track shipments, and download invoices
            </p>
          </div>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const addr = order.shippingAddress || {};
              const recipientName =
                addr.fullName ||
                `${addr.firstName || ""} ${addr.lastName || ""}`.trim() ||
                order.customerName ||
                "Customer";

              const isDownloading = downloadingInvoiceId === order._id;

              return (
                <div
                  key={order._id}
                  onClick={() => handleRowClick(order._id)}
                  className="bg-white border border-gray-200 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                >
                  {/* Header Section */}
                  <div className="bg-gray-50/70 px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex gap-6 flex-wrap">
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                          Order Number
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">
                          #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                          Order Date
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">
                          Total Amount
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-600">
                          ₹{Math.round(order.totalPrice || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1 ${
                          order.isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.isPaid ? "✓ Paid" : "Pending"}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide inline-flex items-center gap-1 ${
                          order.isDelivered ||
                          String(order.status).toLowerCase() === "delivered"
                            ? "bg-green-100 text-green-800"
                            : String(order.status).toLowerCase() === "out for delivery"
                            ? "bg-blue-100 text-blue-800"
                            : String(order.status).toLowerCase().includes("out for delivery in")
                            ? "bg-purple-100 text-purple-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.isDelivered ||
                        String(order.status).toLowerCase() === "delivered"
                          ? "✓ Delivered"
                          : String(order.status).toLowerCase() === "out for delivery"
                          ? "🚚 Out for Delivery"
                          : String(order.status).toLowerCase().includes("out for delivery in")
                          ? "🚚 Out in 1–2 Days"
                          : order.status || "Processing"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
                    {/* Items Preview Table */}
                    <div className="flex-1 space-y-3">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-[#047ca8]" /> Products (
                        {order.orderItems?.length || 0})
                      </p>

                      <div className="space-y-2">
                        {order.orderItems?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-xl bg-gray-50/50 border border-gray-100"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white p-1 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Qty: <span className="font-semibold">{item.quantity}</span> × ₹
                                {item.price?.toLocaleString()}
                              </p>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-gray-900">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping & Actions Panel */}
                    <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-xs text-gray-600">
                          <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-gray-900">{recipientName}</p>
                            <p className="text-gray-500 line-clamp-2">
                              {[addr.house, addr.area, addr.city, addr.state, addr.postalCode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-600 pt-1">
                          <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
                          <p className="font-medium text-gray-900">
                            {order.paymentMethod || "Online Payment"}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(order._id);
                          }}
                          className="w-full py-2 px-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Order
                        </button>

                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={(e) =>
                            handleDownloadInvoice(e, order._id, order.orderNumber)
                          }
                          className="w-full py-2 px-3 bg-[#e8f4f8] hover:bg-[#d4ebf3] text-[#047ca8] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-[#047ca8]/30 cursor-pointer disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating Invoice...
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5" /> Download Invoice
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-auto mt-12">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-10 w-10 text-[#047ca8]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-8 text-sm">
              You haven't placed any orders. Discover our collection and make your first purchase!
            </p>
            <button
              onClick={() => navigate("/collections/all")}
              className="w-full sm:w-auto px-8 py-3 bg-[#047ca8] hover:bg-[#036d94] text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
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

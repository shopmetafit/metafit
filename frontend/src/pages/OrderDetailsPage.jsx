import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { fetchOrderDetails } from "../redux/slices/orderSlice";
import {
  CheckCircle,
  Truck,
  Clock,
  AlertCircle,
  MapPin,
  DollarSign,
  Download,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const OrderDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { orderDetails, loading, error } = useSelector((state) => state.orders);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
  }, [dispatch, id]);

  const handleDownloadInvoice = async () => {
    if (!orderDetails) return;
    const token = localStorage.getItem("userToken");
    if (!token) {
      toast.error("Please log in to download invoice");
      return;
    }

    try {
      setIsDownloadingInvoice(true);
      toast.info("Generating Invoice...");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderDetails._id}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `M-Wellness-Bazaar-Invoice-${
          orderDetails.orderNumber || orderDetails._id.slice(-8)
        }.pdf`
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
      setIsDownloadingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#047ca8] mx-auto mb-3"></div>
          <p className="text-gray-600 font-medium text-sm">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <p className="text-gray-500">No order details found</p>
      </div>
    );
  }

  // Determine order status based on current state
  const getOrderStatus = () => {
    const rawStatus = String(orderDetails.status || "").trim();
    const statusLower = rawStatus.toLowerCase().replace(/–/g, "-");

    if (statusLower === "cancelled") {
      return {
        stage: "Cancelled",
        color: "red",
        icon: "alert",
        message: "This order has been cancelled",
      };
    }

    if (orderDetails.isDelivered || statusLower === "delivered") {
      return {
        stage: "Delivered",
        color: "green",
        icon: "check",
        message: "Your order has been delivered successfully!",
      };
    }

    if (statusLower === "out for delivery") {
      return {
        stage: "Out for Delivery",
        color: "blue",
        icon: "truck",
        message: "Your product is out for delivery and will arrive today!",
      };
    }

    if (
      statusLower === "will be out for delivery in 1-2 days" ||
      statusLower === "will be out for delivery in 2-3 days" ||
      statusLower.includes("out for delivery in")
    ) {
      return {
        stage: "Out in 1–2 Days",
        color: "yellow",
        icon: "truck",
        message: "Your order will be out for delivery in 1–2 days.",
      };
    }

    if (statusLower === "processing") {
      return {
        stage: "Processing",
        color: "yellow",
        icon: "clock",
        message: "Vendor is preparing your order for shipment",
      };
    }

    if (!orderDetails.isPaid) {
      return {
        stage: "Pending Payment",
        color: "gray",
        icon: "alert",
        message: "Waiting for payment confirmation",
      };
    }

    return {
      stage: "Pending",
      color: "gray",
      icon: "clock",
      message: "Order received and awaiting vendor processing",
    };
  };

  const currentStatus = getOrderStatus();

  const rawStatus = String(orderDetails.status || "").trim();
  const normStatus = rawStatus.toLowerCase().replace(/–/g, "-");

  const isProcessingPassed =
    normStatus === "processing" ||
    normStatus.includes("out for delivery in") ||
    normStatus === "out for delivery" ||
    normStatus === "shipped" ||
    normStatus === "delivered" ||
    Boolean(orderDetails.isDelivered);

  const isWillBeOutPassed =
    normStatus.includes("out for delivery in") ||
    normStatus === "out for delivery" ||
    normStatus === "shipped" ||
    normStatus === "delivered" ||
    Boolean(orderDetails.isDelivered);

  const isOutForDeliveryPassed =
    normStatus === "out for delivery" ||
    normStatus === "shipped" ||
    normStatus === "delivered" ||
    Boolean(orderDetails.isDelivered);

  const isDeliveredPassed =
    normStatus === "delivered" || Boolean(orderDetails.isDelivered);

  // Define order timeline stages
  const timelineStages = [
    {
      name: "Order Placed",
      icon: "check",
      completed: true,
    },
    {
      name: "Processing",
      icon: "clock",
      completed: isProcessingPassed,
    },
    {
      name: "Out in 1–2 Days",
      icon: "truck",
      completed: isWillBeOutPassed,
    },
    {
      name: "Out for Delivery",
      icon: "truck",
      completed: isOutForDeliveryPassed,
    },
    {
      name: "Delivered",
      icon: "check",
      completed: isDeliveredPassed,
    },
  ];

  const statusConfig = {
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
    red: "bg-red-50 border-red-200",
    gray: "bg-gray-50 border-gray-200",
  };

  const statusBadgeConfig = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  };

  const addr = orderDetails.shippingAddress || {};
  const recipientName =
    addr.fullName ||
    `${addr.firstName || ""} ${addr.lastName || ""}`.trim() ||
    orderDetails.customerName ||
    "Customer";
  const recipientPhone = addr.phone || orderDetails.customerPhone || "";

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/profile?tab=orders"
            className="text-[#047ca8] hover:underline font-medium text-sm mb-2 inline-block"
          >
            ← Back to My Orders
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm">
            Order #{orderDetails.orderNumber || orderDetails._id.slice(-8)} • Placed{" "}
            {new Date(orderDetails.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Top Header Download Invoice Button */}
        <button
          type="button"
          disabled={isDownloadingInvoice}
          onClick={handleDownloadInvoice}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#047ca8] hover:bg-[#036e96] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isDownloadingInvoice ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating Invoice...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> Download Invoice
            </>
          )}
        </button>
      </div>

      {/* Current Status Card */}
      <div
        className={`border rounded-xl p-6 mb-8 ${
          statusConfig[currentStatus.color]
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {currentStatus.icon === "check" && (
              <CheckCircle className="w-10 h-10 text-green-600" />
            )}
            {currentStatus.icon === "truck" && (
              <Truck className="w-10 h-10 text-blue-600" />
            )}
            {currentStatus.icon === "clock" && (
              <Clock className="w-10 h-10 text-yellow-600" />
            )}
            {currentStatus.icon === "alert" && (
              <AlertCircle className="w-10 h-10 text-red-600" />
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {currentStatus.stage}
              </h2>
              <p className="text-gray-600 text-sm">{currentStatus.message}</p>
            </div>
          </div>
          <div
            className={`px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm ${
              statusBadgeConfig[currentStatus.color]
            }`}
          >
            {currentStatus.stage}
          </div>
        </div>
      </div>

      {/* Timeline - Only show if order is NOT cancelled */}
      {orderDetails.status &&
        orderDetails.status.toLowerCase() !== "cancelled" && (
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-100 p-6 sm:p-8 mb-8">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-8">
              Delivery Timeline
            </h3>
            <div className="relative">
              {/* Background connecting line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-400 to-green-400"></div>

              {/* Timeline stages */}
              <div className="flex justify-between relative z-10">
                {timelineStages.map((stage, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1"
                  >
                    {/* Circle indicator */}
                    <div
                      className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg border-4 transition-all duration-300 ${
                        stage.completed
                          ? "bg-green-500 border-green-600 text-white shadow-lg shadow-green-300"
                          : "bg-white border-gray-300 text-gray-600"
                      }`}
                    >
                      {stage.icon === "check" && "✓"}
                      {stage.icon === "clock" && "⏱"}
                      {stage.icon === "truck" && "🚚"}
                    </div>

                    {/* Stage label */}
                    <p
                      className={`mt-3 text-xs font-semibold text-center px-1 transition-all duration-300 ${
                        stage.completed
                          ? "text-green-700"
                          : "text-gray-500"
                      }`}
                    >
                      {stage.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Cancellation Info - Only show if order IS cancelled */}
      {orderDetails.status &&
        orderDetails.status.toLowerCase() === "cancelled" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Order Cancelled
                </h3>
                <p className="text-red-800 text-sm">
                  This order has been cancelled and will not be delivered.
                </p>
                {orderDetails.cancelledAt && (
                  <p className="text-red-700 text-xs mt-2">
                    Cancelled on{" "}
                    {new Date(orderDetails.cancelledAt).toLocaleDateString()}
                  </p>
                )}
                {orderDetails.cancellationReason && (
                  <p className="text-red-700 text-xs mt-1">
                    Reason: {orderDetails.cancellationReason}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Order Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Payment Info */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">
              Payment Info
            </h3>
          </div>
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <p className="text-gray-500 text-xs">Payment Method</p>
              <p className="text-gray-900 font-semibold">
                {orderDetails.paymentMethod || "Online Payment"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Payment Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                  orderDetails.isPaid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {orderDetails.isPaid ? "✓ Paid" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">
              Shipping Info
            </h3>
          </div>
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <p className="text-gray-500 text-xs">Shipping Method</p>
              <p className="text-gray-900 font-semibold">
                {orderDetails.shippingMethod || "Standard Delivery"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Delivery Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                  isDeliveredPassed
                    ? "bg-green-100 text-green-800"
                    : isOutForDeliveryPassed
                    ? "bg-blue-100 text-blue-800"
                    : isWillBeOutPassed
                    ? "bg-amber-100 text-amber-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {isDeliveredPassed
                  ? "✓ Delivered"
                  : isOutForDeliveryPassed
                  ? "🚚 Out for Delivery"
                  : isWillBeOutPassed
                  ? "🚚 Out in 1–2 Days"
                  : "⏱ Processing"}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold text-gray-900">
              Delivery Address
            </h3>
          </div>
          <div className="text-gray-900 text-xs sm:text-sm space-y-1">
            <p className="font-bold text-gray-900">{recipientName}</p>
            {recipientPhone && <p className="text-gray-600 font-medium">📞 +91 {recipientPhone}</p>}
            <p className="text-gray-600 leading-relaxed pt-1">
              {[
                addr.house,
                addr.area,
                addr.landmark,
                addr.street || addr.address,
                addr.city,
                addr.district,
                addr.state,
                addr.postalCode || addr.pincode,
                addr.country || "India",
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Order Items ({orderDetails.orderItems?.length || 0})
          </h3>
        </div>

        {orderDetails.orderItems && orderDetails.orderItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-xs sm:text-sm">
              <thead className="bg-gray-50/70">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase tracking-wider">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {orderDetails.orderItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-contain rounded-lg border border-gray-200 p-1"
                          />
                        )}
                        <Link
                          to={`/product/${item.productId}`}
                          className="text-[#047ca8] hover:underline font-semibold"
                        >
                          {item.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      ₹{item.price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-bold">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No items in this order
          </div>
        )}

        {/* Order Summary & Invoice Download */}
        <div className="bg-gray-50/70 px-6 py-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            
            <button
              type="button"
              disabled={isDownloadingInvoice}
              onClick={handleDownloadInvoice}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#e8f4f8] hover:bg-[#d4ebf3] text-[#047ca8] text-xs font-bold rounded-xl transition-all border border-[#047ca8]/30 cursor-pointer disabled:opacity-50"
            >
              {isDownloadingInvoice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating Invoice...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Download Official PDF Invoice
                </>
              )}
            </button>

            <div className="w-full sm:w-80 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ₹
                  {(
                    orderDetails.orderItems?.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    ) || 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Handling Fee (3%)</span>
                <span className="font-semibold text-gray-900">
                  ₹
                  {Math.round(
                    orderDetails.serviceFee ??
                      (orderDetails.orderItems?.reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      ) || 0) * 0.03
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping Charge</span>
                <span
                  className={`font-semibold ${
                    !orderDetails.deliveryCharge ? "text-emerald-600" : "text-gray-900"
                  }`}
                >
                  {orderDetails.deliveryCharge
                    ? `₹${Math.round(orderDetails.deliveryCharge).toLocaleString()}`
                    : "FREE"}
                </span>
              </div>
              {orderDetails.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>
                    Discount {orderDetails.couponCode && `(${orderDetails.couponCode})`}
                  </span>
                  <span className="font-bold">
                    - ₹{Math.round(orderDetails.couponDiscount).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">Grand Total</span>
                <span className="font-extrabold text-base sm:text-lg text-[#047ca8]">
                  ₹{Math.round(orderDetails.totalPrice || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;

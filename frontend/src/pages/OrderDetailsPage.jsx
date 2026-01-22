import { useEffect } from "react";
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
} from "lucide-react";

const OrderDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { orderDetails, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrderDetails(id));
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 flex justify-center items-center h-96">
        <div className="text-lg text-gray-600">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
    if (
      orderDetails.status === "Cancelled" ||
      orderDetails.status === "cancelled"
    ) {
      return {
        stage: "Cancelled",
        color: "red",
        icon: "alert",
        message: "This order has been cancelled",
      };
    }

    if (orderDetails.isDelivered) {
      return {
        stage: "Delivered",
        color: "green",
        icon: "check",
        message: "Your order has been delivered",
      };
    }

    if (
      orderDetails.status === "Shipped" ||
      orderDetails.status === "shipped"
    ) {
      return {
        stage: "Shipped",
        color: "blue",
        icon: "truck",
        message: "Your order is on the way",
      };
    }

    if (
      orderDetails.status === "Processing" ||
      orderDetails.status === "processing"
    ) {
      return {
        stage: "Processing",
        color: "yellow",
        icon: "clock",
        message: "We are preparing your order",
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
      message: "Order received and awaiting processing",
    };
  };

  const currentStatus = getOrderStatus();

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
      completed: orderDetails.status === "Processing" || orderDetails.isDelivered,
    },
    {
      name: "Shipped",
      icon: "truck",
      completed: orderDetails.status === "Shipped" || orderDetails.isDelivered,
    },
    {
      name: "Delivered",
      icon: "check",
      completed: orderDetails.isDelivered,
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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <Link
          to="/my-orders"
          className="text-blue-600 hover:text-blue-800 font-medium text-sm mb-4 inline-block"
        >
          ← Back to My Orders
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        <p className="text-gray-600 mt-1">
          Order #{orderDetails._id.slice(-8)} • Placed{" "}
          {new Date(orderDetails.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Current Status Card */}
      <div
        className={`border rounded-lg p-6 mb-8 ${
          statusConfig[currentStatus.color]
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStatus.icon === "check" && (
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
            {currentStatus.icon === "truck" && (
              <Truck className="w-12 h-12 text-blue-600" />
            )}
            {currentStatus.icon === "clock" && (
              <Clock className="w-12 h-12 text-yellow-600" />
            )}
            {currentStatus.icon === "alert" && (
              <AlertCircle className="w-12 h-12 text-red-600" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStatus.stage}
              </h2>
              <p className="text-gray-600">{currentStatus.message}</p>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-full font-semibold text-sm ${
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
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg border border-blue-100 p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-8">
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
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-all duration-300 ${
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
                      className={`mt-4 text-sm font-semibold text-center px-2 transition-all duration-300 ${
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Order Cancelled
                </h3>
                <p className="text-red-800">
                  This order has been cancelled and will not be delivered.
                </p>
                {orderDetails.cancelledAt && (
                  <p className="text-red-700 text-sm mt-2">
                    Cancelled on{" "}
                    {new Date(orderDetails.cancelledAt).toLocaleDateString()}
                  </p>
                )}
                {orderDetails.cancellationReason && (
                  <p className="text-red-700 text-sm mt-2">
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Info
            </h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-gray-600 text-sm">Payment Method</p>
              <p className="text-gray-900 font-medium">
                {orderDetails.paymentMethod || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Payment Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  orderDetails.isPaid
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {orderDetails.isPaid ? "✓ Paid" : "✗ Unpaid"}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Truck className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Shipping Info
            </h3>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-gray-600 text-sm">Shipping Method</p>
              <p className="text-gray-900 font-medium">
                {orderDetails.shippingMethod || "Standard"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Delivery Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  orderDetails.isDelivered
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {orderDetails.isDelivered ? "✓ Delivered" : "⏱ In Transit"}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Delivery Address
            </h3>
          </div>
          <div className="text-gray-900 text-sm">
            <p>
              {orderDetails.shippingAddress?.street ||
                orderDetails.shippingAddress?.city ||
                "Address not available"}
            </p>
            <p>
              {orderDetails.shippingAddress?.city},
              {orderDetails.shippingAddress?.country}
            </p>
            {orderDetails.shippingAddress?.postalCode && (
              <p>{orderDetails.shippingAddress.postalCode}</p>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Order Items ({orderDetails.orderItems?.length || 0})
          </h3>
        </div>

        {orderDetails.orderItems && orderDetails.orderItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderDetails.orderItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <Link
                          to={`/product/${item.productId}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          {item.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      ₹{item.price?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.quantity}</td>
                    <td className="px-6 py-4 text-gray-900 font-bold">
                      ₹{(item.price * item.quantity).toFixed(2)}
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

        {/* Order Summary */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-end">
            <div className="w-full max-w-xs">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">
                  ₹
                  {orderDetails.orderItems
                    ?.reduce((sum, item) => sum + item.price * item.quantity, 0)
                    .toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">
                  ₹{orderDetails.shippingCost?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">
                  ₹{orderDetails.totalPrice?.toFixed(2) || "0.00"}
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

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { ShoppingCart, Loader, Eye, FileText, AlertCircle, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const VendorOrders = () => {
    const { user } = useSelector((state) => state.auth);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        fetchVendorOrders();
    }, []);

    const fetchVendorOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("userToken");
            // Fetch all orders and filter by vendor products
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/orders`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setOrders(response.data.orders || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load orders");
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter((order) => {
        const matchesFilter =
            filterStatus === "all" || order.orderStatus === filterStatus;
        return matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin" size={40} />
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-700";
            case "processing":
                return "bg-blue-100 text-blue-700";
            case "shipped":
                return "bg-purple-100 text-purple-700";
            case "delivered":
                return "bg-green-100 text-green-700";
            case "cancelled":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                        <p className="text-gray-600 mt-1">
                            Track and manage your customer orders
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                            <div>{error}</div>
                        </div>
                    )}

                    {/* Filter */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
                        <div className="flex items-center gap-3">
                            <Filter size={18} className="text-gray-600" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="outline-none bg-gray-100 px-4 py-2.5 rounded-lg text-sm font-medium"
                            >
                                <option value="all">All Orders ({orders.length})</option>
                                <option value="pending">Pending ({orders.filter(o => o.orderStatus === "pending").length})</option>
                                <option value="processing">Processing ({orders.filter(o => o.orderStatus === "processing").length})</option>
                                <option value="shipped">Shipped ({orders.filter(o => o.orderStatus === "shipped").length})</option>
                                <option value="delivered">Delivered ({orders.filter(o => o.orderStatus === "delivered").length})</option>
                                <option value="cancelled">Cancelled ({orders.filter(o => o.orderStatus === "cancelled").length})</option>
                            </select>
                        </div>
                    </div>

                    {/* Orders List */}
                    {filteredOrders.length > 0 ? (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => (
                                <div
                                    key={order._id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Order #{order.orderNumber || order._id.slice(-8)}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                    weekday: "short",
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                                                order.orderStatus
                                            )}`}
                                        >
                                            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                        </span>
                                    </div>

                                    {/* Order Items */}
                                    <div className="mb-4 pb-4 border-b border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                            Items ({order.items?.length || 0})
                                        </h4>
                                        <div className="space-y-2">
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-gray-700">
                                                        {item.productName} <span className="text-gray-500">x {item.quantity}</span>
                                                    </span>
                                                    <span className="text-gray-900 font-medium">
                                                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase">
                                                Customer
                                            </p>
                                            <p className="text-sm text-gray-900 font-medium mt-1">
                                                {order.customerName || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase">
                                                Total
                                            </p>
                                            <p className="text-sm text-gray-900 font-semibold mt-1">
                                                ₹{order.totalPrice?.toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase">
                                                Payment
                                            </p>
                                            <p className="text-sm text-gray-900 font-medium mt-1">
                                                {order.paymentMethod || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold uppercase">
                                                Shipping To
                                            </p>
                                            <p className="text-sm text-gray-900 font-medium mt-1">
                                                {order.shippingAddress?.city || "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3">
                                        <Link
                                            to={`/order/${order._id}`}
                                            className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition font-medium text-sm"
                                        >
                                            <Eye size={18} />
                                            <span>View Details</span>
                                        </Link>
                                        <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition font-medium text-sm">
                                            <FileText size={18} />
                                            <span>Invoice</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No orders yet
                            </h3>
                            <p className="text-gray-600">
                                Customer orders will appear here once they place purchases
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorOrders;

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { vendorApiService } from "../services/vendorApi";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  History,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

const VENDOR_STATUSES = [
  "Processing",
  "Will be Out for Delivery in 1–2 Days",
  "Out for Delivery",
  "Delivered",
];

const getStatusIndex = (statusStr) => {
  if (!statusStr) return 0;
  const normalized = String(statusStr).trim().replace(/–/g, "-");
  if (normalized === "Processing") return 0;
  if (normalized === "Will be Out for Delivery in 1-2 Days") return 1;
  if (normalized === "Out for Delivery" || normalized === "Shipped") return 2;
  if (normalized === "Delivered") return 3;
  return 0;
};

const getStatusBadge = (status) => {
  const norm = String(status || "").replace(/–/g, "-");
  if (norm === "Delivered") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
      </span>
    );
  }
  if (norm === "Out for Delivery" || norm === "Shipped") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
        <Truck className="w-3.5 h-3.5" /> Out for Delivery
      </span>
    );
  }
  if (norm === "Will be Out for Delivery in 1-2 Days") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
        <Clock className="w-3.5 h-3.5" /> Out in 1–2 Days
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
      <Package className="w-3.5 h-3.5" /> Processing
    </span>
  );
};

const formatDate = (dateVal) => {
  if (!dateVal) return "N/A";
  try {
    return new Date(dateVal).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (e) {
    return String(dateVal);
  }
};

const VendorOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await vendorApiService.getVendorOrders();
      if (res?.success) {
        setOrders(res.orders || []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error loading vendor orders:", err);
      setError(err?.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const vendorToken = localStorage.getItem("vendorToken");
    if (!vendorToken) {
      toast.error("Please login as vendor");
      navigate("/vendor-login");
      return;
    }
    fetchOrders();
  }, [navigate]);

  const handleStatusUpdate = async (orderId, currentStatus, newStatus) => {
    const currentIndex = getStatusIndex(currentStatus);
    const newIndex = getStatusIndex(newStatus);

    if (currentIndex === 3) {
      toast.error("Order is already Delivered and status cannot be changed.");
      return;
    }

    if (newIndex <= currentIndex) {
      toast.error("Status cannot be reverted to a previous or same stage.");
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      const res = await vendorApiService.updateVendorOrderStatus(orderId, newStatus);
      if (res?.success) {
        toast.success(`Order status updated to "${newStatus}"`);
        // Update local list
        setOrders((prev) =>
          prev.map((ord) => (ord._id === orderId ? res.order : ord))
        );
      } else {
        toast.error(res?.message || "Failed to update order status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err?.message || "Error updating status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const normStatus = String(order.status || "").replace(/–/g, "-");
      const matchesFilter =
        statusFilter === "All" ||
        normStatus === statusFilter.replace(/–/g, "-");

      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(search)) ||
        (order._id && order._id.toLowerCase().includes(search)) ||
        (order.customerName && order.customerName.toLowerCase().includes(search)) ||
        (order.user?.name && order.user.name.toLowerCase().includes(search)) ||
        (order.user?.email && order.user.email.toLowerCase().includes(search));

      return matchesFilter && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = orders.length;
    let processing = 0;
    let willBeOut = 0;
    let outForDelivery = 0;
    let delivered = 0;

    orders.forEach((o) => {
      const idx = getStatusIndex(o.status);
      if (idx === 0) processing++;
      else if (idx === 1) willBeOut++;
      else if (idx === 2) outForDelivery++;
      else if (idx === 3) delivered++;
    });

    return { total, processing, willBeOut, outForDelivery, delivered };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
              <Package className="w-8 h-8 text-blue-600" /> Vendor Order Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Update order stages, track delivery progression, and maintain audit timestamps.
            </p>
          </div>
          <button
            onClick={() => navigate("/vendor-dashboard")}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition self-start md:self-auto"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div
            onClick={() => setStatusFilter("All")}
            className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm ${
              statusFilter === "All"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-800 border-slate-200 hover:border-blue-300"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wider ${statusFilter === "All" ? "text-blue-100" : "text-slate-400"}`}>
              Total Orders
            </p>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </div>

          <div
            onClick={() => setStatusFilter("Processing")}
            className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm ${
              statusFilter === "Processing"
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-slate-800 border-slate-200 hover:border-amber-300"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wider ${statusFilter === "Processing" ? "text-amber-100" : "text-amber-600"}`}>
              Processing
            </p>
            <p className="text-2xl font-bold mt-1">{stats.processing}</p>
          </div>

          <div
            onClick={() => setStatusFilter("Will be Out for Delivery in 1–2 Days")}
            className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm ${
              statusFilter.replace(/–/g, "-") === "Will be Out for Delivery in 1-2 Days"
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-slate-800 border-slate-200 hover:border-purple-300"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wider ${statusFilter.replace(/–/g, "-") === "Will be Out for Delivery in 1-2 Days" ? "text-purple-100" : "text-purple-600"}`}>
              Out in 1–2 Days
            </p>
            <p className="text-2xl font-bold mt-1">{stats.willBeOut}</p>
          </div>

          <div
            onClick={() => setStatusFilter("Out for Delivery")}
            className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm ${
              statusFilter === "Out for Delivery"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-800 border-slate-200 hover:border-blue-300"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wider ${statusFilter === "Out for Delivery" ? "text-blue-100" : "text-blue-600"}`}>
              Out for Delivery
            </p>
            <p className="text-2xl font-bold mt-1">{stats.outForDelivery}</p>
          </div>

          <div
            onClick={() => setStatusFilter("Delivered")}
            className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm ${
              statusFilter === "Delivered"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-800 border-slate-200 hover:border-emerald-300"
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-wider ${statusFilter === "Delivered" ? "text-emerald-100" : "text-emerald-600"}`}>
              Delivered
            </p>
            <p className="text-2xl font-bold mt-1">{stats.delivered}</p>
          </div>
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-700 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Processing">Processing</option>
              <option value="Will be Out for Delivery in 1–2 Days">Will be Out for Delivery in 1–2 Days</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Order Number</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Current Status</th>
                    <th className="px-6 py-4">Update Status (One-way)</th>
                    <th className="px-6 py-4 text-right">Timestamps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredOrders.map((order) => {
                    const currentIdx = getStatusIndex(order.status);
                    const isLocked = currentIdx === 3;
                    const historyCount = order.statusHistory?.length || 0;
                    const isHistoryExpanded = expandedHistoryId === order._id;

                    return (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Order Number */}
                        <td className="px-6 py-4 font-mono font-medium text-blue-600">
                          #{order.orderNumber || order._id?.slice(-8)}
                          <span className="block text-[11px] text-slate-400 font-sans font-normal mt-0.5">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>

                        {/* Customer Info */}
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">
                            {order.customerName || order.user?.name || "Guest Customer"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {order.customerEmail || order.user?.email || "N/A"}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          ₹{Number(order.totalPrice || 0).toLocaleString("en-IN")}
                        </td>

                        {/* Current Status Badge */}
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* Unidirectional Status Selector */}
                        <td className="px-6 py-4">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                              <Lock className="w-3.5 h-3.5 text-slate-400" /> Delivered (Locked)
                            </span>
                          ) : (
                            <select
                              disabled={updatingOrderId === order._id}
                              value={order.status}
                              onChange={(e) =>
                                handleStatusUpdate(order._id, order.status, e.target.value)
                              }
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 cursor-pointer disabled:opacity-50"
                            >
                              {VENDOR_STATUSES.map((statusOption, idx) => {
                                const optionDisabled = idx <= currentIdx;
                                return (
                                  <option
                                    key={statusOption}
                                    value={statusOption}
                                    disabled={optionDisabled}
                                  >
                                    {statusOption} {optionDisabled && idx < currentIdx ? "(Passed)" : optionDisabled && idx === currentIdx ? "(Current)" : ""}
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </td>

                        {/* Timestamps / Audit History Button */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              setExpandedHistoryId(isHistoryExpanded ? null : order._id)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition"
                          >
                            <History className="w-3.5 h-3.5" />
                            History ({historyCount})
                            {isHistoryExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Expandable History Modal / Drawer */}
                          {isHistoryExpanded && (
                            <div className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-2xl text-left border border-slate-800 shadow-xl space-y-2.5 animate-in fade-in duration-200">
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800 flex justify-between items-center">
                                <span>📜 Timestamp Log History</span>
                                <span className="text-[10px] text-slate-500">Order #{order.orderNumber || order._id?.slice(-8)}</span>
                              </div>

                              {order.statusHistory && order.statusHistory.length > 0 ? (
                                <div className="space-y-2">
                                  {order.statusHistory.map((item, hIdx) => (
                                    <div key={hIdx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                                      <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                                        <span className="font-semibold text-slate-200">{item.status}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-400 mt-0.5 sm:mt-0 font-mono">
                                        ⏱️ {formatDate(item.timestamp)} {item.updatedBy ? `by ${item.updatedBy}` : ''}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 space-y-1">
                                  <div>Current Status: <span className="text-slate-200 font-semibold">{order.status}</span></div>
                                  <div>Created At: <span className="text-slate-200">{formatDate(order.createdAt)}</span></div>
                                  {order.deliveredAt && <div>Delivered At: <span className="text-slate-200">{formatDate(order.deliveredAt)}</span></div>}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold">No orders found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || statusFilter !== "All"
                  ? "Try clearing filters or search terms."
                  : "Orders assigned to your products will appear here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorOrdersPage;

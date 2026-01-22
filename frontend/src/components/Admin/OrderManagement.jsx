import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchAllOrders,
  updateOrderStatus,
} from "../../redux/slices/adminOrderSlice";

const OrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useSelector((state) => state.auth);  
  const { orders, loading, error } = useSelector((state) => state.adminOrders);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    } else {
      dispatch(fetchAllOrders());
    }
  }, [dispatch, user, navigate]);

  const handleStatusChange = (orderId, status) => {
    dispatch(updateOrderStatus({ id: orderId, status }));
  };

  // Filter and search logic
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "All" || order.status === filter;
    const matchesSearch =
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusColors = {
    Processing: "bg-yellow-100 text-yellow-800",
    Shipped: "bg-blue-100 text-blue-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 flex justify-center items-center h-96">
        <div className="text-lg text-gray-600">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Management
        </h1>
        <p className="text-gray-600">Manage and track all customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">
            {orders.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Processing</p>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter((o) => o.status === "Processing").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Shipped</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter((o) => o.status === "Shipped").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Delivered</p>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter((o) => o.status === "Delivered").length}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Customer Name, Email, or Order ID
            </label>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Orders</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition">
                    {/* Order ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/order/${order._id}`)}
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                      >
                        #{order._id.slice(-8)}
                      </button>
                    </td>

                    {/* Customer Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <p className="text-gray-900 font-medium text-sm">
                          {order.user?.name || "Unknown Customer"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {order.user?.email || "N/A"}
                        </p>
                      </div>
                    </td>

                    {/* Products */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="text-sm bg-gray-100 p-2 rounded"
                            >
                              <p className="font-medium text-gray-900">
                                {item.productName || item.name || "Unknown"}
                              </p>
                              <p className="text-gray-600 text-xs">
                                Qty: {item.quantity} × ₹
                                {item.price?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No items
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-gray-900 font-bold text-sm">
                        ₹{order.totalPrice?.toFixed(2) || "0.00"}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className={`text-xs font-semibold px-3 py-1 rounded-full border-none cursor-pointer ${
                          statusColors[order.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/order/${order._id}`)
                          }
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">
              {searchTerm || filter !== "All"
                ? "No orders found matching your criteria"
                : "No orders yet"}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Orders Shown</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredOrders.length}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ₹
                {filteredOrders
                  .reduce((sum, order) => sum + (order.totalPrice || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Average Order Value</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹
                {(
                  filteredOrders.reduce(
                    (sum, order) => sum + (order.totalPrice || 0),
                    0
                  ) / filteredOrders.length
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

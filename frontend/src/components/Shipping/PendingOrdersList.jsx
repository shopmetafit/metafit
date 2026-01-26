import { useState } from "react";
import { usePendingShipments } from "../../hooks/usePendingShipments";
import GenerateAWBModal from "./GenerateAWBModal";
import "./PendingOrdersList.css";

/**
 * PendingOrdersList Component
 * Shows table of orders pending shipment (Admin only)
 */
export default function PendingOrdersList({ token, onRefresh }) {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const { orders, pagination, loading, error } = usePendingShipments(
    token,
    page
  );

  if (loading && orders.length === 0) {
    return <div className="pending-container loading-state">Loading orders...</div>;
  }

  if (error) {
    return (
      <div className="pending-container error-state">
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="pending-container empty-state">
        <p>No orders pending shipment</p>
      </div>
    );
  }

  const handleShipClick = (order) => {
    setSelectedOrder(order);
  };

  const handleModalClose = () => {
    setSelectedOrder(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="pending-container">
      <div className="pending-header">
        <h2>Pending Shipments</h2>
        <p className="pending-count">
          {pagination?.total || 0} orders waiting to ship
        </p>
      </div>

      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Address</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="order-id">
                  {order._id.slice(0, 8)}...
                </td>
                <td>
                  <div className="customer-info">
                    <div className="customer-name">
                      {order.user?.name || "Unknown"}
                    </div>
                    <div className="customer-email">
                      {order.user?.email || ""}
                    </div>
                  </div>
                </td>
                <td className="amount">
                  ₹{order.totalPrice?.toFixed(2) || "0.00"}
                </td>
                <td>
                  <span className="status-badge pending">
                    {order.shippingStatus}
                  </span>
                </td>
                <td className="address">
                  <div className="address-text">
                    {order.shippingAddress?.city}
                    {order.shippingAddress?.postalCode &&
                      `, ${order.shippingAddress.postalCode}`}
                  </div>
                </td>
                <td className="action">
                  <button
                    className="btn-ship"
                    onClick={() => handleShipClick(order)}
                  >
                    Ship Order
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            ← Previous
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: pagination.pages }, (_, i) => (
              <button
                key={i + 1}
                className={`pagination-number ${
                  page === i + 1 ? "active" : ""
                }`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            onClick={() =>
              setPage(Math.min(pagination.pages, page + 1))
            }
            disabled={page === pagination.pages}
          >
            Next →
          </button>
        </div>
      )}

      {/* AWB Modal */}
      {selectedOrder && (
        <GenerateAWBModal
          orderId={selectedOrder._id}
          token={token}
          customerName={selectedOrder.user?.name || ""}
          customerPhone={selectedOrder.user?.phone || ""}
          customerEmail={selectedOrder.user?.email || ""}
          onSuccess={handleModalClose}
          onCancel={handleModalClose}
        />
      )}
    </div>
  );
}

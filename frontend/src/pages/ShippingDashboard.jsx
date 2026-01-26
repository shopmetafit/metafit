import { useState } from "react";
import { PendingOrdersList } from "../components/Shipping";
import "./ShippingDashboard.css";

/**
 * ShippingDashboard Page
 * Admin dashboard for managing shipments
 */
export default function ShippingDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get token from localStorage (adjust based on your auth setup)
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <div className="shipping-dashboard">
        <div className="auth-error">
          <p>You must be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="shipping-dashboard">
      <div className="dashboard-header">
        <h1>Shipping Management</h1>
        <p className="subtitle">Manage orders and generate shipping labels</p>
      </div>

      <div className="dashboard-content">
        <div className="section">
          <div className="section-header">
            <h2>Pending Orders</h2>
            <button className="btn-refresh" onClick={handleRefresh}>
              ↻ Refresh
            </button>
          </div>

          <div key={refreshKey}>
            <PendingOrdersList
              token={token}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

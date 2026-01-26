import { useParams } from "react-router-dom";
import { TrackingDisplay, ShippingDetails } from "../components/Shipping";
import "./TrackOrder.css";

/**
 * TrackOrder Page
 * User-facing page to track their order
 */
export default function TrackOrder() {
  const { orderId } = useParams();
  
  // Get token from localStorage (adjust based on your auth setup)
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <div className="track-order-page">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please log in to track your order.</p>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="track-order-page">
        <div className="error-box">
          <h2>Invalid Order</h2>
          <p>No order ID provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="track-order-page">
      <div className="page-header">
        <h1>Track Your Order</h1>
        <p className="order-id-display">Order ID: {orderId.slice(0, 8)}...</p>
      </div>

      <div className="page-content">
        <div className="tracking-section">
          <TrackingDisplay orderId={orderId} token={token} />
        </div>

        <div className="details-section">
          <h2>Shipping Details</h2>
          <ShippingDetails orderId={orderId} token={token} />
        </div>

        <div className="info-section">
          <h2>About Tracking</h2>
          <div className="info-box">
            <h3>How it Works</h3>
            <ul>
              <li>
                <strong>Live Tracking:</strong> Shows the latest status from our
                shipping partner
              </li>
              <li>
                <strong>Cached Data:</strong> Shows the last known status when
                live data is unavailable
              </li>
              <li>
                <strong>Refresh:</strong> Click the refresh button to get the
                latest tracking information
              </li>
            </ul>
          </div>

          <div className="info-box">
            <h3>Tracking Status</h3>
            <ul>
              <li>
                <strong>Pending:</strong> Order is being prepared for shipment
              </li>
              <li>
                <strong>In Transit:</strong> Your order is on the way
              </li>
              <li>
                <strong>Out for Delivery:</strong> Your package is being delivered
                today
              </li>
              <li>
                <strong>Delivered:</strong> Your order has been delivered
              </li>
            </ul>
          </div>

          <div className="info-box">
            <h3>Need Help?</h3>
            <p>
              If you have questions about your order, please contact our support
              team with your order ID and AWB number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

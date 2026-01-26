import { useState, useEffect } from "react";
import "./ShippingDetails.css";

/**
 * ShippingDetails Component
 * Shows shipping information for an order
 */
export default function ShippingDetails({ orderId, token }) {
  const [shippingInfo, setShippingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShippingInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/shipment/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setShippingInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId && token) {
      fetchShippingInfo();
    }
  }, [orderId, token]);

  if (loading) {
    return <div className="shipping-details loading">Loading shipping information...</div>;
  }

  if (error) {
    return (
      <div className="shipping-details error">
        <p>Error loading shipping information: {error}</p>
      </div>
    );
  }

  if (!shippingInfo?.success) {
    return (
      <div className="shipping-details info">
        <p>No shipping information available yet.</p>
      </div>
    );
  }

  const { shippingAddress } = shippingInfo;

  return (
    <div className="shipping-details">
      <div className="shipping-section">
        <h3>Shipping Information</h3>

        <div className="info-row">
          <label>Courier</label>
          <span>{shippingInfo.courier}</span>
        </div>

        {shippingInfo.awbNo && (
          <div className="info-row">
            <label>AWB Number</label>
            <span className="awb-number">{shippingInfo.awbNo}</span>
          </div>
        )}

        <div className="info-row">
          <label>Status</label>
          <span className={`status ${shippingInfo.status?.toLowerCase()}`}>
            {shippingInfo.status}
          </span>
        </div>

        <div className="info-row">
          <label>Shipping Status</label>
          <span className={`shipping-status ${shippingInfo.shippingStatus?.toLowerCase()}`}>
            {shippingInfo.shippingStatus}
          </span>
        </div>

        {shippingInfo.shippingError && (
          <div className="info-row error-row">
            <label>Error</label>
            <span className="error-text">{shippingInfo.shippingError}</span>
          </div>
        )}

        {shippingInfo.bluedartGeneratedAt && (
          <div className="info-row">
            <label>Generated At</label>
            <span>
              {new Date(shippingInfo.bluedartGeneratedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {shippingAddress && (
        <div className="shipping-section">
          <h3>Delivery Address</h3>

          {shippingAddress.address && (
            <div className="info-row">
              <label>Street Address</label>
              <span>{shippingAddress.address}</span>
            </div>
          )}

          {shippingAddress.city && (
            <div className="info-row">
              <label>City</label>
              <span>{shippingAddress.city}</span>
            </div>
          )}

          {shippingAddress.postalCode && (
            <div className="info-row">
              <label>Postal Code</label>
              <span>{shippingAddress.postalCode}</span>
            </div>
          )}

          {shippingAddress.state && (
            <div className="info-row">
              <label>State</label>
              <span>{shippingAddress.state}</span>
            </div>
          )}

          {shippingAddress.country && (
            <div className="info-row">
              <label>Country</label>
              <span>{shippingAddress.country}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useTracking } from "../../hooks/useTracking";
import "./TrackingDisplay.css";

/**
 * TrackingDisplay Component
 * Shows tracking info with data source indicator
 */
export default function TrackingDisplay({ orderId, token }) {
  const { tracking, loading, error, forceRefresh } = useTracking(
    orderId,
    token
  );

  if (loading) {
    return (
      <div className="tracking-container">
        <div className="loading">Loading tracking information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracking-container">
        <div className="error-box">
          <h3>Error Loading Tracking</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!tracking?.success) {
    return (
      <div className="tracking-container">
        <div className="info-box">
          <p>Shipment has not been initiated yet.</p>
        </div>
      </div>
    );
  }

  const { tracking: trackData, dataSource } = tracking;

  return (
    <div className="tracking-container">
      {/* Data Source Indicator */}
      <div className="data-source-indicator">
        {dataSource.isLive && (
          <span className="badge badge-live">🟢 Live Tracking</span>
        )}
        {dataSource.isCached && (
          <span className="badge badge-cached">⏱️ Cached Data</span>
        )}
        {dataSource.unavailable && (
          <span className="badge badge-unavailable">⚠️ No Data</span>
        )}
      </div>

      {/* AWB Number */}
      <div className="awb-section">
        <h3>Tracking Information</h3>
        <p className="awb-number">
          <strong>AWB Number:</strong> {tracking.awbNo}
        </p>
      </div>

      {/* Tracking Details */}
      {trackData ? (
        <div className="tracking-details">
          <div className="detail-item">
            <strong>Current Status:</strong>
            <span className="status-badge">{trackData.status}</span>
          </div>

          <div className="detail-item">
            <strong>Description:</strong>
            <p>{trackData.description}</p>
          </div>

          {trackData.location && (
            <div className="detail-item">
              <strong>Location:</strong>
              <p>
                {trackData.location.city}
                {trackData.location.state && `, ${trackData.location.state}`}
              </p>
            </div>
          )}

          <div className="detail-item">
            <strong>Last Updated:</strong>
            <p>{new Date(trackData.lastSyncedAt).toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="info-box">
          <p>Tracking data not yet available. Please try again later.</p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="tracking-actions">
        <button
          className="btn-refresh"
          onClick={forceRefresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Tracking"}
        </button>
      </div>
    </div>
  );
}

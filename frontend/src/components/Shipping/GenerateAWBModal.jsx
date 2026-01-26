import { useState } from "react";
import { useGenerateAWB } from "../../hooks/useGenerateAWB";
import "./GenerateAWBModal.css";

/**
 * GenerateAWBModal Component
 * Modal form to generate AWB for an order (Admin only)
 */
export default function GenerateAWBModal({
  orderId,
  token,
  onSuccess,
  onCancel,
  customerName = "",
  customerPhone = "",
  customerEmail = "",
}) {
  const [formData, setFormData] = useState({
    consigneeName: customerName,
    consigneePhone: customerPhone,
    consigneeEmail: customerEmail,
    weight: "1",
  });

  const { generateAWB, loading, error, success } = useGenerateAWB(token);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await generateAWB(orderId, formData);
      // Call onSuccess after successful generation
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      // Error is handled by the hook
      console.error("AWB generation failed:", err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Generate Shipping Label</h2>
          <button className="modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>AWB Generated Successfully!</h3>
            <p className="awb-display">
              <strong>AWB Number:</strong> {success.awbNo}
            </p>
            <p>{success.message}</p>
            <button
              className="btn-primary"
              onClick={onCancel}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="awb-form">
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="consigneeName">
                Customer Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="consigneeName"
                name="consigneeName"
                value={formData.consigneeName}
                onChange={handleChange}
                placeholder="Full name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="consigneePhone">
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="consigneePhone"
                name="consigneePhone"
                value={formData.consigneePhone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="consigneeEmail">Email Address (Optional)</label>
              <input
                type="email"
                id="consigneeEmail"
                name="consigneeEmail"
                value={formData.consigneeEmail}
                onChange={handleChange}
                placeholder="customer@example.com"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">
                Weight (kg) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="1"
                min="0.1"
                step="0.1"
                required
                disabled={loading}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate AWB"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";

/**
 * useGenerateAWB Hook
 * Generates AWB for an order (Admin only)
 */
export const useGenerateAWB = (token) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const generateAWB = async (orderId, formData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/admin/shipment/${orderId}/generate-awb`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.shippingError || data.message || `HTTP ${response.status}`
        );
      }

      setSuccess({
        awbNo: data.awbNo,
        trackingId: data.trackingId,
        message: data.message,
      });

      return data;
    } catch (err) {
      setError(err.message);
      setSuccess(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const retry = async (orderId, formData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/admin/shipment/${orderId}/retry`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      setSuccess({
        awbNo: data.awbNo,
        message: "Retry successful!",
      });

      return data;
    } catch (err) {
      setError(err.message);
      setSuccess(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateAWB,
    retry,
    loading,
    error,
    success,
  };
};

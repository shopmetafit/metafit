import { useState, useEffect } from "react";

/**
 * useTracking Hook
 * Fetches tracking information for an order
 * Supports both cached and live tracking
 */
export const useTracking = (orderId, token) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTracking = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/shipment/${orderId}/track${
        forceRefresh ? "?forceRefresh=true" : ""
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP ${response.status}`
        );
      }

      const data = await response.json();
      setTracking(data);
    } catch (err) {
      setError(err.message);
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (orderId && token) {
      fetchTracking(false);
    }
  }, [orderId, token]);

  return {
    tracking,
    loading,
    error,
    refetch: () => fetchTracking(true),
    forceRefresh: () => fetchTracking(true),
  };
};

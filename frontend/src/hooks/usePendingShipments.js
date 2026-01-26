import { useState, useEffect } from "react";

/**
 * usePendingShipments Hook
 * Fetches list of orders pending shipment (Admin only)
 */
export const usePendingShipments = (token, page = 1) => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/admin/shipment/pending?page=${page}&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setOrders(data.data || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setError(err.message);
        setOrders([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    }
  }, [token, page]);

  return {
    orders,
    pagination,
    loading,
    error,
  };
};

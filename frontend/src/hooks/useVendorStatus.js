import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

/**
 * Custom hook to check vendor application status
 * Returns: { vendor, loading, error, hasApplication }
 */
export const useVendorStatus = () => {
  const { user } = useSelector((state) => state.auth);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role === "vendor") return; // Skip if not logged in or already vendor

    fetchVendorStatus();
  }, [user]);

  const fetchVendorStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/vendors/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setVendor(response.data);
      setError(null);
    } catch (err) {
      // No vendor application found - user can apply
      setVendor(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    vendor,
    loading,
    error,
    hasApplication: vendor !== null, // User has submitted a vendor application
    isPending: vendor?.status === "pending",
    isApproved: vendor?.isApproved,
  };
};

export default useVendorStatus;

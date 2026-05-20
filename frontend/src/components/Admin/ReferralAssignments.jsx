import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { fetchAllProducts } from "../../redux/slices/productSlice";
import { useDispatch, useSelector } from "react-redux";
import { vendorApiService } from "../../services/vendorApi";

const initialForm = {
  productId: "",
  vendorId: "",
  assignedProductId: "",
  shareCode: "",
  refCode: "",
  commissionType: "percentage",
  commissionValue: 10,
  isActive: true,
};

const ReferralAssignments = () => {
  const dispatch = useDispatch();
  const { allProducts } = useSelector((state) => state.products);
  const [vendors, setVendors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const productOptions = Array.isArray(allProducts?.products)
    ? allProducts.products
    : Array.isArray(allProducts)
      ? allProducts
      : [];

  const loadAssignments = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/referral-assignments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      setAssignments(response.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load assignments");
    }
  };

  useEffect(() => {
    dispatch(fetchAllProducts());
    vendorApiService
      .getAllVendors()
      .then((data) => setVendors(data?.vendors || []))
      .catch(() => toast.error("Failed to load vendors"));
    loadAssignments();
  }, [dispatch]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/referral-assignments`,
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
      toast.success("Referral assignment saved");
      setForm(initialForm);
      loadAssignments();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save assignment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Assignments</h1>
        <p className="text-sm text-gray-600">Create vendor-product mappings, share codes, and commission rules.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-5 md:grid-cols-2">
        <select
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          className="rounded-lg border p-3"
          required
        >
          <option value="">Select product</option>
          {productOptions.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>

        <select
          value={form.vendorId}
          onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
          className="rounded-lg border p-3"
          required
        >
          <option value="">Select vendor</option>
          {vendors.map((vendor) => (
            <option key={vendor._id} value={vendor._id}>
              {vendor.vendorName} ({vendor.businessName})
            </option>
          ))}
        </select>

        <input
          value={form.assignedProductId}
          onChange={(e) => setForm({ ...form, assignedProductId: e.target.value })}
          className="rounded-lg border p-3"
          placeholder="Assigned product id"
          required
        />
        <input
          value={form.shareCode}
          onChange={(e) => setForm({ ...form, shareCode: e.target.value.toUpperCase() })}
          className="rounded-lg border p-3"
          placeholder="Share code"
          required
        />
        <input
          value={form.refCode}
          onChange={(e) => setForm({ ...form, refCode: e.target.value.toUpperCase() })}
          className="rounded-lg border p-3"
          placeholder="Ref code"
        />
        <select
          value={form.commissionType}
          onChange={(e) => setForm({ ...form, commissionType: e.target.value })}
          className="rounded-lg border p-3"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.commissionValue}
          onChange={(e) => setForm({ ...form, commissionValue: Number(e.target.value) })}
          className="rounded-lg border p-3"
          placeholder="Commission value"
          required
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Active link
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Assignment"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Assigned ID</th>
              <th className="px-4 py-3">Share Code</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment._id} className="border-t">
                <td className="px-4 py-3">{assignment.productId?.name || "-"}</td>
                <td className="px-4 py-3">{assignment.vendorId?.vendorName || "-"}</td>
                <td className="px-4 py-3">{assignment.assignedProductId}</td>
                <td className="px-4 py-3">{assignment.shareCode}</td>
                <td className="px-4 py-3">
                  {assignment.commissionType === "percentage"
                    ? `${assignment.commissionValue}%`
                    : `₹${assignment.commissionValue}`}
                </td>
                <td className="px-4 py-3">{assignment.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
            {assignments.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                  No referral assignments found
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReferralAssignments;

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
    CheckCircle,
    XCircle,
    Loader,
    Search,
    Filter,
    Package,
    AlertCircle,
    Eye,
    EyeOff,
} from "lucide-react";

const ProductApprovalPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("pending");
    const [approvingId, setApprovingId] = useState(null);
    const [rejectingId, setRejectingId] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        fetchPendingProducts();
    }, [filterStatus]);

    const fetchPendingProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("userToken");
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/products/pending?status=${filterStatus}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProducts(response.data.products);
            setError(null);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError(
                err.response?.data?.message || "Failed to load products"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleApproveProduct = async (productId) => {
        try {
            setApprovingId(productId);
            const token = localStorage.getItem("userToken");

            if (!token) {
                toast.error("Authentication token not found. Please login again.");
                setApprovingId(null);
                return;
            }

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${productId}/approve`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                }
            );

            // Remove product from list on success
            setProducts(products.filter((p) => p._id !== productId));
            toast.success("Product approved successfully");

            // Optional: Refresh products list to ensure sync
            await fetchPendingProducts();
        } catch (err) {
            console.error("Approval error:", err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to approve product";
            toast.error(errorMessage);

            // Log full error for debugging
            if (err.response?.status === 404) {
                toast.error("Product not found. It may have been deleted.");
            } else if (err.response?.status === 401) {
                toast.error("Unauthorized. Please login again.");
            } else if (err.response?.status === 403) {
                toast.error("You don't have permission to approve products.");
            }
        } finally {
            setApprovingId(null);
        }
    };

    const handleRejectProduct = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        try {
            setRejectingId(selectedProduct._id);
            const token = localStorage.getItem("userToken");

            if (!token) {
                toast.error("Authentication token not found. Please login again.");
                setRejectingId(null);
                return;
            }

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${selectedProduct._id}/reject`,
                { rejectionReason },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                }
            );

            // Remove product from list on success
            setProducts(products.filter((p) => p._id !== selectedProduct._id));
            toast.success("Product rejected successfully");
            setShowRejectModal(false);
            setRejectionReason("");
            setSelectedProduct(null);

            // Optional: Refresh products list to ensure sync
            await fetchPendingProducts();
        } catch (err) {
            console.error("Rejection error:", err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to reject product";
            toast.error(errorMessage);

            // Log full error for debugging
            if (err.response?.status === 404) {
                toast.error("Product not found. It may have been deleted.");
            } else if (err.response?.status === 401) {
                toast.error("Unauthorized. Please login again.");
            } else if (err.response?.status === 403) {
                toast.error("You don't have permission to reject products.");
            } else if (err.response?.status === 400) {
                toast.error(errorMessage || "Invalid request. Check rejection reason.");
            }
        } finally {
            setRejectingId(null);
        }
    };

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.vendorId?.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Product Approvals
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Review and approve/reject vendor products
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
                            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                            <div>{error}</div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 items-center flex-wrap">
                        <div className="flex-1 min-w-xs flex items-center gap-2 bg-gray-100 px-4 py-2.5 rounded-lg">
                            <Search size={18} className="text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by product name, SKU, or vendor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent outline-none flex-1 text-gray-700 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Filter size={18} />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="outline-none bg-gray-100 px-4 py-2.5 rounded-lg text-sm font-medium"
                            >
                                <option value="pending">Pending ({products.length})</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Products Table */}
                    {filteredProducts.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">
                                            Product
                                        </th>
                                        <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">
                                            Vendor
                                        </th>
                                        <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">
                                            Price
                                        </th>
                                        <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">
                                            Stock
                                        </th>
                                        <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">
                                            Status
                                        </th>
                                        <th className="text-center px-6 py-4 font-semibold text-gray-700 text-sm">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr
                                            key={product._id}
                                            className="border-b border-gray-200 hover:bg-gray-50 transition"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product.images && product.images[0] && (
                                                        <img
                                                            src={product.images[0].url}
                                                            alt={product.name}
                                                            className="w-12 h-12 rounded-lg object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            SKU: {product.sku || "N/A"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {product.vendorId?.vendorName || product.vendorId?.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {product.vendorId?.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 font-medium">
                                                ₹{product.price?.toLocaleString("en-IN")}
                                                {product.discountPrice && (
                                                    <p className="text-sm text-green-600">
                                                        Discount: ₹{product.discountPrice.toLocaleString("en-IN")}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${product.countInStock > 10
                                                            ? "bg-green-100 text-green-700"
                                                            : product.countInStock > 0
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {product.countInStock} units
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${product.productApprovalStatus === "pending"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : product.productApprovalStatus === "approved"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {product.productApprovalStatus === "pending" && (
                                                        <AlertCircle size={14} />
                                                    )}
                                                    {product.productApprovalStatus === "approved" && (
                                                        <CheckCircle size={14} />
                                                    )}
                                                    {product.productApprovalStatus === "rejected" && (
                                                        <XCircle size={14} />
                                                    )}
                                                    <span className="capitalize">
                                                        {product.productApprovalStatus}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {filterStatus === "pending" && (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleApproveProduct(product._id)
                                                            }
                                                            disabled={approvingId === product._id}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                                                        >
                                                            {approvingId === product._id ? (
                                                                <>
                                                                    <Loader size={14} className="animate-spin" />
                                                                    Approving...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle size={14} />
                                                                    Approve
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedProduct(product);
                                                                setShowRejectModal(true);
                                                            }}
                                                            disabled={rejectingId === product._id}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                                                        >
                                                            {rejectingId === product._id ? (
                                                                <>
                                                                    <Loader size={14} className="animate-spin" />
                                                                    Rejecting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle size={14} />
                                                                    Reject
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                                {filterStatus !== "pending" && (
                                                    <span className="text-gray-500 text-sm">
                                                        {product.productApprovalStatus === "rejected" &&
                                                            product.rejectionReason && (
                                                                <p
                                                                    title={product.rejectionReason}
                                                                    className="truncate max-w-xs"
                                                                >
                                                                    Reason: {product.rejectionReason}
                                                                </p>
                                                            )}
                                                        {product.productApprovalStatus === "approved" && (
                                                            <span className="text-emerald-600">✓ Approved</span>
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                            <Package size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {filterStatus === "pending"
                                    ? "No pending products"
                                    : `No ${filterStatus} products`}
                            </h3>
                            <p className="text-gray-600">
                                {filterStatus === "pending"
                                    ? "All vendor products have been reviewed"
                                    : "Check another status to view products"}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Reject Product
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to reject "
                            <span className="font-semibold">{selectedProduct.name}</span>"?
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason (Required)
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Explain why this product is being rejected..."
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason("");
                                    setSelectedProduct(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectProduct}
                                disabled={rejectingId === selectedProduct._id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            >
                                {rejectingId === selectedProduct._id ? "Rejecting..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductApprovalPage;

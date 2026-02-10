import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
    Plus,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Loader,
    Search,
    Filter,
    Package,
    AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const VendorProducts = () => {
    const { user } = useSelector((state) => state.auth);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("userToken");
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/vendor/products`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProducts(response.data.products);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load products");
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            const token = localStorage.getItem("userToken");
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/vendor/products/${productId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProducts(products.filter((p) => p._id !== productId));
            toast.success("Product deleted successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete product");
        }
    };

    const handleTogglePublish = async (productId, currentStatus) => {
        try {
            const token = localStorage.getItem("userToken");
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/vendor/products/${productId}/publish`,
                { isPublished: !currentStatus },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setProducts(
                products.map((p) =>
                    p._id === productId ? { ...p, isPublished: !currentStatus } : p
                )
            );
            toast.success(
                !currentStatus ? "Product published" : "Product unpublished"
            );
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update product");
        }
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesFilter =
            filterStatus === "all" ||
            (filterStatus === "published" && product.isPublished) ||
            (filterStatus === "draft" && !product.isPublished);
        return matchesSearch && matchesFilter;
    });

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
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                            <p className="text-gray-600 mt-1">
                                Manage and organize your product inventory
                            </p>
                        </div>
                        <Link
                            to="/vendor/products/new"
                            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition font-semibold"
                        >
                            <Plus size={20} />
                            <span>Add Product</span>
                        </Link>
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
                                placeholder="Search products by name..."
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
                                <option value="all">All Products ({products.length})</option>
                                <option value="published">Published ({products.filter(p => p.isPublished).length})</option>
                                <option value="draft">Draft ({products.filter(p => !p.isPublished).length})</option>
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
                                            Product Name
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
                                        <th className="text-left px-6 py-4 font-semibold text-gray-700 text-sm">
                                            Approval
                                        </th>
                                        <th className="text-center px-6 py-4 font-semibold text-gray-700 text-sm">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
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
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                        <p className="text-xs text-gray-500">ID: {product._id.slice(-8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 font-medium">
                                                ₹{product.price?.toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${product.countInStock > 10
                                                        ? "bg-green-100 text-green-700"
                                                        : product.countInStock > 0
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}>
                                                    {product.countInStock} units
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleTogglePublish(product._id, product.isPublished)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${product.isPublished
                                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                        }`}
                                                    title="Click to toggle"
                                                >
                                                    {product.isPublished ? (
                                                        <>
                                                            <Eye size={14} />
                                                            <span>Published</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeOff size={14} />
                                                            <span>Draft</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded text-sm font-medium ${product.productApprovalStatus === "approved"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : product.productApprovalStatus === "pending"
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {product.productApprovalStatus || "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        to={`/vendor/products/${product._id}/edit`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
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
                                No products yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Start by creating your first product to get started
                            </p>
                            <Link
                                to="/vendor/products/new"
                                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition font-semibold"
                            >
                                <Plus size={20} />
                                <span>Add First Product</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorProducts;

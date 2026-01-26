import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Trash2, Edit2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function BlogDashboard() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("userToken");

  useEffect(() => {
    fetchBlogs();
  }, [statusFilter, search, currentPage]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", 10);
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);

      const response = await axios.get(
        `${API_URL}/api/blogs/admin/my-blogs?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBlogs(response.data.blogs);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      await axios.delete(`${API_URL}/api/blogs/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Blog deleted successfully");
      fetchBlogs();
    } catch (error) {
      toast.error("Failed to delete blog");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Blogs</h1>
            <Link
              to="/admin/blogs/create"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Create New Blog
            </Link>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search blogs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Blogs Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading blogs...
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-4">No blogs found</p>
              <Link
                to="/admin/blogs/create"
                className="text-blue-600 hover:underline font-medium"
              >
                Create your first blog
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Views</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Likes</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map((blog) => (
                  <tr key={blog._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 max-w-xs truncate">
                          {blog.title}
                        </p>
                        <p className="text-sm text-gray-500 max-w-xs truncate">
                          {blog.excerpt}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          blog.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {blog.status === "published" ? (
                          <span className="flex items-center gap-1">
                            <Eye size={12} /> Published
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff size={12} /> Draft
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">
                      {blog.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {blog.views}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {blog.likes.length}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/blogs/${blog._id}`}
                          className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";
import { Heart, MessageCircle, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export default function BlogList() {
  const [blogs, setBlog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchBlogs();
  }, [category, search, currentPage]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", 9);
      if (category) params.append("category", category);
      if (search) params.append("search", search);

      const response = await axios.get(`${API_URL}/api/blogs?${params}`);
      setBlog(response.data.blogs);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Wellness Blog</h1>
          <p className="text-lg text-gray-600">
            Expert insights on fitness, nutrition, and wellness
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search blogs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="fitness">Fitness</option>
              <option value="nutrition">Nutrition</option>
              <option value="wellness">Wellness</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading blogs...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blogs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {blogs.map((blog) => (
              <Link
                key={blog._id}
                to={`/blog/${blog.slug}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
              >
                {blog.featuredImage && (
                  <div className="h-48 overflow-hidden bg-gray-200">
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase">
                      {blog.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(blog.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye size={16} /> {blog.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={16} /> {blog.likes.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={16} /> {blog.comments.length}
                      </span>
                    </div>
                  </div>
                  {blog.author && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                      {blog.author.avatar && (
                        <img
                          src={blog.author.avatar}
                          alt={blog.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {blog.author.name}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
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

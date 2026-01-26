import { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "fitness",
    status: "draft",
    featuredImage: "",
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("userToken");

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/blogs/admin/my-blogs?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const blog = response.data.blogs.find(b => b._id === id);
      if (blog) {
        setFormData({
          title: blog.title,
          content: blog.content,
          excerpt: blog.excerpt,
          category: blog.category,
          status: blog.status,
          featuredImage: blog.featuredImage || "",
        });
        setIsEditing(true);
      }
    } catch (error) {
      toast.error("Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (content) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim() || !formData.content.trim() || !formData.excerpt.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        // Update blog
        await axios.put(
          `${API_URL}/api/blogs/admin/${id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Blog updated successfully");
      } else {
        // Create new blog
        await axios.post(
          `${API_URL}/api/blogs/admin/create`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Blog created successfully");
      }

      setTimeout(() => {
        navigate("/admin/blogs");
      }, 1000);
    } catch (error) {
      console.error("Blog creation error:", error);
      console.log("API URL:", API_URL);
      console.log("Token:", token);
      toast.error(error.response?.data?.message || "Failed to save blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {isEditing ? "Edit Blog" : "Create New Blog"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blog Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter blog title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt (Summary) * (Max 300 characters)
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Brief summary of your blog post"
              rows="3"
              maxLength="300"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.excerpt.length}/300 characters
            </p>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image URL
            </label>
            <input
              type="url"
              name="featuredImage"
              value={formData.featuredImage}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.featuredImage && (
              <div className="mt-2">
                <img
                  src={formData.featuredImage}
                  alt="Preview"
                  className="max-h-48 rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="fitness">Fitness</option>
              <option value="nutrition">Nutrition</option>
              <option value="wellness">Wellness</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Content with TinyMCE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blog Content * (Use rich editor below)
            </label>
            <Editor
              apiKey={import.meta.env.VITE_TINYMCE_API_KEY || "no-api-key"}
              value={formData.content}
              onEditorChange={handleEditorChange}
              init={{
                height: 500,
                menubar: true,
                plugins: [
                  "advlist autolink lists link image charmap print preview anchor",
                  "searchreplace visualblocks code fullscreen",
                  "insertdatetime media table paste code help wordcount",
                ],
                toolbar:
                  "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
                content_style:
                  "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft (Not visible to public)</option>
              <option value="published">Published (Visible to public)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Only published blogs will be visible to readers
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? "Saving..." : isEditing ? "Update Blog" : "Create Blog"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/blogs")}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

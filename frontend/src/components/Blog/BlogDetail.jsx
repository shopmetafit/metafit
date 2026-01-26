import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem("userToken");

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/blogs/${slug}`);
      setBlog(response.data.blog);
      
      // Check if user has already liked
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && response.data.blog.likes.includes(user._id)) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
      toast.error("Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!token) {
      toast.error("Please login to like blogs");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/blogs/${blog._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBlog(response.data.blog);
      setIsLiked(!isLiked);
      toast.success(response.data.message);
    } catch (error) {
      toast.error("Failed to like blog");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please login to comment");
      return;
    }

    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await axios.post(
        `${API_URL}/api/blogs/${blog._id}/comments`,
        { text: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBlog(response.data.blog);
      setComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading blog...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Blog not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Featured Image */}
        {blog.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Article Header */}
        <article className="bg-white rounded-lg shadow-lg p-8">
          {/* Category & Date */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            <span className="text-xs font-semibold text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded">
              {blog.category}
            </span>
            <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>

          {/* Author */}
          {blog.author && (
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
              {blog.author.avatar && (
                <img
                  src={blog.author.avatar}
                  alt={blog.author.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900">{blog.author.name}</p>
                <p className="text-sm text-gray-500">{blog.author.email}</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6 flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                isLiked
                  ? "bg-red-50 text-red-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
              <span>{blog.likes.length} Likes</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
              <Share2 size={20} />
              Share
            </button>
            <span className="ml-auto text-sm text-gray-500">
              {blog.views} views
            </span>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({blog.comments.length})
          </h2>

          {/* Add Comment Form */}
          {token ? (
            <form onSubmit={handleAddComment} className="mb-8">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submittingComment ? "Posting..." : "Post Comment"}
              </button>
            </form>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
              <p className="text-blue-900">
                Please <a href="/login" className="font-semibold underline">login</a> to comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {blog.comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first!</p>
            ) : (
              blog.comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {comment.user?.avatar && (
                      <img
                        src={comment.user.avatar}
                        alt={comment.userName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{comment.userName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

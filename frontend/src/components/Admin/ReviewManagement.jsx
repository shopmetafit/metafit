import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Star, CheckCircle2, Trash2, ExternalLink, ShieldAlert, PlusCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAdminReviews,
  deleteAdminReview,
  createSampleReviews,
} from "../../redux/slices/reviewSlice";

const ReviewManagement = () => {
  const dispatch = useDispatch();

  const {
    adminReviews = [],
    adminCounts = { total: 0 },
    adminPagination = { total: 0, page: 1, pages: 1 },
    adminLoading = false,
    adminError = null,
  } = useSelector((state) => state.reviews || {});

  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminReviews({ page: currentPage, limit: 15 }));
  }, [dispatch, currentPage]);

  const handleDelete = async (reviewId) => {
    const res = await dispatch(deleteAdminReview(reviewId));

    if (deleteAdminReview.fulfilled.match(res)) {
      toast.success("Review deleted permanently");
      setDeleteId(null);
      dispatch(fetchAdminReviews({ page: currentPage, limit: 15 }));
    } else {
      toast.error(res.payload || "Failed to delete review");
    }
  };

  const handleGenerateSample = async () => {
    setGenerating(true);
    const res = await dispatch(createSampleReviews());
    setGenerating(false);

    if (createSampleReviews.fulfilled.match(res)) {
      toast.success("Sample reviews generated successfully!");
      dispatch(fetchAdminReviews({ page: currentPage, limit: 15 }));
    } else {
      toast.error(res.payload || "Failed to generate sample reviews");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            Review Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and delete product reviews submitted by users
          </p>
        </div>
        <button
          onClick={handleGenerateSample}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium text-xs rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          {generating ? "Generating..." : "Generate Sample Reviews"}
        </button>
      </div>

      {/* REVIEWS TOTAL BAR */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm mb-6 text-sm text-gray-600">
        <div className="flex items-center gap-2 font-medium text-gray-800">
          <MessageSquare className="w-4 h-4 text-gray-500" />
          Total Reviews: <span className="font-bold text-gray-900">{adminCounts.total || adminReviews.length}</span>
        </div>
      </div>

      {/* REVIEWS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {adminLoading ? (
          <div className="py-16 text-center text-gray-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-3" />
            Fetching reviews...
          </div>
        ) : adminError ? (
          <div className="py-16 text-center text-red-500">
            <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3 text-center inline-block" />
            <h3 className="text-base font-semibold text-gray-800 mt-2">Error Loading Reviews</h3>
            <p className="text-xs text-red-500 mt-1">{adminError}</p>
          </div>
        ) : adminReviews.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No reviews found</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4 max-w-sm">
              There are currently no product reviews in the database.
            </p>
            <button
              onClick={handleGenerateSample}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-medium text-xs rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              {generating ? "Generating..." : "Generate Test Reviews"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Review Text</th>
                  <th className="px-6 py-4">Verified</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {adminReviews.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/80 transition">
                    {/* Customer */}
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-xs">
                          {item.user?.name ? item.user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {item.user?.name || "Unknown User"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.user?.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-6 py-4">
                      {item.product ? (
                        <a
                          href={`/product/${item.product.slug || item.product._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 group text-gray-900 font-medium hover:text-blue-600 max-w-[200px] truncate"
                        >
                          {item.product.thumbnail && (
                            <img
                              src={item.product.thumbnail}
                              alt=""
                              className="w-7 h-7 object-cover rounded border border-gray-200 flex-shrink-0"
                            />
                          )}
                          <span className="truncate">{item.product.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">Product deleted</span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-900 mr-1">{item.rating}</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= item.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Review Text */}
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-gray-700 text-xs leading-relaxed line-clamp-3">
                        "{item.review}"
                      </p>
                    </td>

                    {/* Verified Purchase */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.verifiedPurchase ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDeleteId(item._id)}
                          title="Delete Review"
                          className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {adminPagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs">
            <span className="text-gray-500">
              Page {adminPagination.page} of {adminPagination.pages} ({adminPagination.total} reviews)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= adminPagination.pages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-8 h-8" />
              <h3 className="text-lg font-bold">Confirm Review Deletion</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete this review? This action cannot be undone and will update the product's average rating calculation.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Star, CheckCircle2, Edit3, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../../redux/slices/reviewSlice";

const ProductReviews = ({ productId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { reviews, userReview, stats, loading, submitting } = useSelector(
    (state) => state.reviews
  );

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductReviews(productId));
    }
  }, [dispatch, productId]);

  // If editing, populate form with user's existing review
  const handleStartEdit = () => {
    if (userReview) {
      setRating(userReview.rating);
      setReviewText(userReview.review);
      setIsEditing(true);
      setShowForm(true);
    }
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setShowForm(false);
    setRating(5);
    setReviewText("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Please write your review text");
      return;
    }

    if (isEditing && userReview) {
      const res = await dispatch(
        updateReview({
          reviewId: userReview._id,
          rating,
          review: reviewText,
        })
      );

      if (updateReview.fulfilled.match(res)) {
        toast.success(res.payload?.message || "Review updated successfully!");
        setIsEditing(false);
        setShowForm(false);
        dispatch(fetchProductReviews(productId));
      } else {
        toast.error(res.payload || "Failed to update review");
      }
    } else {
      const res = await dispatch(
        createReview({
          productId,
          rating,
          review: reviewText,
        })
      );

      if (createReview.fulfilled.match(res)) {
        toast.success(res.payload?.message || "Review submitted successfully!");
        setReviewText("");
        setShowForm(false);
        dispatch(fetchProductReviews(productId));
      } else {
        toast.error(res.payload || "Failed to submit review");
      }
    }
  };

  const handleDelete = async () => {
    if (!userReview) return;
    const res = await dispatch(deleteReview(userReview._id));

    if (deleteReview.fulfilled.match(res)) {
      toast.success("Your review has been deleted");
      setDeleteConfirm(false);
      setIsEditing(false);
      setShowForm(false);
      dispatch(fetchProductReviews(productId));
    } else {
      toast.error(res.payload || "Failed to delete review");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mt-12 border-t pt-10 border-gray-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-black" />
            Customer Ratings & Reviews
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real feedback from verified purchasers and wellness enthusiasts
          </p>
        </div>

        {/* Action Button */}
        {!user ? (
          <button
            onClick={() => navigate("/login")}
            className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800 transition"
          >
            Log in to Write a Review
          </button>
        ) : !userReview && !showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800 transition"
          >
            Write a Review
          </button>
        ) : null}
      </div>

      {/* RATING BREAKDOWN STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl mb-10 border border-gray-100">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 pr-0 md:pr-6">
          <div className="text-5xl font-black text-gray-900 tracking-tight">
            {stats.averageRating > 0 ? stats.averageRating : "0.0"}
          </div>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(stats.averageRating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-gray-600">
            Based on {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Rating Distribution Bars */}
        <div className="md:col-span-2 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((starNum) => {
            const count = stats.ratingCounts[starNum] || 0;
            const pct = stats.ratingPercentages[starNum] || 0;
            return (
              <div key={starNum} className="flex items-center gap-3 text-xs md:text-sm font-medium">
                <span className="w-12 text-gray-600 flex items-center gap-1">
                  {starNum} <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-black h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-16 text-right text-gray-500">
                  {pct}% ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* USER'S OWN REVIEW BANNER */}
      {user && userReview && !showForm && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-base">Your Review</span>
              {userReview.verifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Purchase
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= userReview.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-2">
              {formatDate(userReview.createdAt)}
            </span>
          </div>

          <p className="text-gray-700 text-sm leading-relaxed">{userReview.review}</p>

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="mt-4 p-4 bg-white border border-red-200 rounded-xl flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-red-700">
                Are you sure you want to delete your review?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-xs text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="text-xs text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WRITE / EDIT REVIEW FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 border border-gray-200 p-6 rounded-2xl mb-8 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b pb-3 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              {isEditing ? "Edit Your Review" : "Write a Product Review"}
            </h3>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Cancel
            </button>
          </div>

          {/* Star Rating Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        isFilled
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm font-semibold text-gray-700">
                {rating} out of 5 Stars
              </span>
            </div>
          </div>

          {/* Review Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you like or dislike about this product? Share details about quality, performance, and overall satisfaction."
              className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : isEditing
                ? "Update Review"
                : "Submit Review"}
            </button>
          </div>
        </form>
      )}

      {/* PUBLIC REVIEWS LIST */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-gray-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-3" />
            Loading customer reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-10 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-700 font-medium text-base">No reviews yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Be the first customer to share your experience with this product!
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev._id}
              className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-sm shadow">
                    {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">
                        {rev.user?.name || "Customer"}
                      </span>
                      {rev.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(rev.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rev.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mt-2 pl-1">
                {rev.review}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;

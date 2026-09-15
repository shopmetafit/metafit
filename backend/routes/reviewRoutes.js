const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect, admin } = require("../middleware/authMiddleware");

// Optional Auth Middleware for public GET review route (to fetch user's review if logged in)
const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization || req.headers["x-auth-token"]) {
      return protect(req, res, () => next());
    }
  } catch (error) {
    // Ignore error for public route fallback
  }
  next();
};

// Store / Public & Customer Routes
router.get("/store/reviews/product/:productId", optionalAuth, reviewController.getProductReviews);
router.post("/store/reviews", protect, reviewController.createReview);
router.put("/store/reviews/:reviewId", protect, reviewController.updateReview);
router.delete("/store/reviews/:reviewId", protect, reviewController.deleteReview);

// Admin Routes
router.get("/admin/reviews", protect, admin, reviewController.getAdminReviews);
router.post("/admin/reviews/seed-sample", protect, admin, reviewController.createSampleReviews);
router.delete("/admin/reviews/:reviewId", protect, admin, reviewController.deleteAdminReview);

module.exports = router;

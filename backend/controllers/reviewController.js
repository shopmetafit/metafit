const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

/**
 * Helper: Recalculate and update average rating & total reviews on Product
 */
const updateProductRating = async (productId) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: "$product",
          numReviews: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    let rating = 0;
    let numReviews = 0;

    if (stats.length > 0) {
      numReviews = stats[0].numReviews;
      rating = Math.round(stats[0].avgRating * 10) / 10; // Round to 1 decimal place
    }

    await Product.findByIdAndUpdate(productId, {
      rating,
      numReviews,
    });
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
};

/**
 * Public: Get reviews & rating statistics for a product
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    // Resolve product by ObjectId or slug
    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ slug: productId });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Fetch all reviews for this product
    const reviews = await Review.find({
      product: product._id,
    })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    // Calculate rating breakdown stats
    const totalReviews = reviews.length;
    let sumRating = 0;
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((rev) => {
      sumRating += rev.rating;
      if (ratingCounts[rev.rating] !== undefined) {
        ratingCounts[rev.rating] += 1;
      }
    });

    const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

    const ratingPercentages = {
      5: totalReviews > 0 ? Math.round((ratingCounts[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((ratingCounts[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((ratingCounts[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((ratingCounts[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((ratingCounts[1] / totalReviews) * 100) : 0,
    };

    // If user is authenticated, find their review
    let userReview = null;
    if (req.user) {
      userReview = await Review.findOne({
        product: product._id,
        user: req.user._id,
      }).populate("user", "name avatar");
    }

    return res.status(200).json({
      success: true,
      reviews,
      userReview,
      stats: {
        totalReviews,
        averageRating,
        ratingCounts,
        ratingPercentages,
      },
    });
  } catch (error) {
    console.error("Error in getProductReviews:", error);
    return res.status(500).json({ message: "Failed to fetch product reviews", error: error.message });
  }
};

/**
 * Authenticated: Submit a review for a product
 */
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, review } = req.body;
    const userId = req.user._id;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    if (!review || typeof review !== "string" || !review.trim()) {
      return res.status(400).json({ message: "Review text cannot be empty" });
    }

    // Resolve product
    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne({ slug: productId });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: product._id,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already submitted a review for this product" });
    }

    // Verify Purchase: Check if user has a confirmed/paid order containing this product
    const purchaseOrder = await Order.findOne({
      user: userId,
      "orderItems.productId": product._id,
      $or: [
        { isPaid: true },
        { paymentStatus: { $regex: /^paid$/i } },
        { status: { $in: ["Processing", "Shipped", "Delivered", "Out for Delivery", "Will be Out for Delivery in 1–2 Days"] } },
      ],
    });

    const isVerifiedPurchase = Boolean(purchaseOrder);

    // Create review immediately visible
    const newReview = new Review({
      user: userId,
      product: product._id,
      rating: Number(rating),
      review: review.trim(),
      verifiedPurchase: isVerifiedPurchase,
    });

    await newReview.save();
    await updateProductRating(product._id);

    const populatedReview = await Review.findById(newReview._id).populate("user", "name avatar");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review: populatedReview,
    });
  } catch (error) {
    console.error("Error in createReview:", error);
    return res.status(500).json({ message: "Failed to create review", error: error.message });
  }
};

/**
 * Authenticated: Update user's own review
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user._id;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    if (!review || typeof review !== "string" || !review.trim()) {
      return res.status(400).json({ message: "Review text cannot be empty" });
    }

    const existingReview = await Review.findById(reviewId);

    if (!existingReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (existingReview.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to update this review" });
    }

    existingReview.rating = Number(rating);
    existingReview.review = review.trim();

    await existingReview.save();
    await updateProductRating(existingReview.product);

    const updatedReview = await Review.findById(reviewId).populate("user", "name avatar");

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error in updateReview:", error);
    return res.status(500).json({ message: "Failed to update review", error: error.message });
  }
};

/**
 * Authenticated: Delete user's own review
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const existingReview = await Review.findById(reviewId);

    if (!existingReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Allow user or admin to delete
    const isOwner = existingReview.user.toString() === userId.toString();
    const isAdmin = String(req.user.role).toLowerCase() === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    const productId = existingReview.product;
    await Review.findByIdAndDelete(reviewId);

    await updateProductRating(productId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteReview:", error);
    return res.status(500).json({ message: "Failed to delete review", error: error.message });
  }
};

/**
 * Admin: Get all reviews with pagination
 */
exports.getAdminReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find({})
      .populate("user", "name email avatar")
      .populate("product", "name slug thumbnail")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments({});

    return res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
      counts: {
        total,
      },
    });
  } catch (error) {
    console.error("Error in getAdminReviews:", error);
    return res.status(500).json({ message: "Failed to fetch admin reviews", error: error.message });
  }
};

/**
 * Admin: Delete a review
 */
exports.deleteAdminReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);

    await updateProductRating(productId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteAdminReview:", error);
    return res.status(500).json({ message: "Failed to delete review", error: error.message });
  }
};

/**
 * Admin: Seed sample test reviews
 */
exports.createSampleReviews = async (req, res) => {
  try {
    const User = require("../models/User");
    const products = await Product.find({}).limit(3);
    let user = req.user || (await User.findOne({}));

    if (products.length === 0 || !user) {
      return res.status(400).json({ message: "Need at least 1 product and 1 user in database to generate sample reviews" });
    }

    const sampleReviewsData = [
      {
        user: user._id,
        product: products[0]._id,
        rating: 5,
        review: "Amazing wellness product! Highly recommended for daily health routine.",
        verifiedPurchase: true,
      },
      {
        user: user._id,
        product: products[1 % products.length]._id,
        rating: 4,
        review: "Great taste and neat packaging. Will purchase again.",
        verifiedPurchase: true,
      },
      {
        user: user._id,
        product: products[2 % products.length]._id,
        rating: 3,
        review: "Decent quality, but delivery took longer than expected.",
        verifiedPurchase: false,
      },
    ];

    for (const data of sampleReviewsData) {
      await Review.create(data);
      await updateProductRating(data.product);
    }

    return res.status(201).json({ success: true, message: "Sample test reviews generated successfully!" });
  } catch (error) {
    console.error("Error creating sample reviews:", error);
    return res.status(500).json({ message: "Failed to create sample reviews", error: error.message });
  }
};

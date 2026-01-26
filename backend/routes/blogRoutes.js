const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  getAdminBlogs,
  updateBlog,
  deleteBlog,
  likeBlog,
  addComment,
} = require("../controllers/blogController");

const router = express.Router();

// Public routes
router.get("/", getAllBlogs);
router.get("/:slug", getBlogBySlug);

// Admin routes
router.post("/admin/create", protect, admin, createBlog);
router.get("/admin/my-blogs", protect, admin, getAdminBlogs);
router.put("/admin/:id", protect, admin, updateBlog);
router.delete("/admin/:id", protect, admin, deleteBlog);

// Authenticated user routes
router.post("/:id/like", protect, likeBlog);
router.post("/:id/comments", protect, addComment);

module.exports = router;

const Blog = require("../models/Blog");

// Create blog (Admin only)
exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, category, featuredImage, status } = req.body;

    if (!title || !content || !excerpt) {
      return res.status(400).json({ message: "Title, content, and excerpt are required" });
    }

    const blog = new Blog({
      title,
      content,
      excerpt,
      category,
      featuredImage,
      status,
      author: req.user._id,
      authorName: req.user.name,
    });

    await blog.save();
    res.status(201).json({ message: "Blog created successfully", blog });
  } catch (error) {
    console.error("Create blog error:", error);
    res.status(500).json({ message: "Error creating blog", error: error.message });
  }
};

// Get all published blogs (Public)
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    let filter = { status: "published" };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(filter)
      .populate("author", "name avatar")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Blog.countDocuments(filter);

    res.json({
      message: "Blogs fetched successfully",
      blogs,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get blogs error:", error);
    res.status(500).json({ message: "Error fetching blogs", error: error.message });
  }
};

// Get single blog by slug (Public)
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ slug, status: "published" })
      .populate("author", "name avatar email")
      .populate("comments.user", "name avatar");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json({ message: "Blog fetched successfully", blog });
  } catch (error) {
    console.error("Get blog error:", error);
    res.status(500).json({ message: "Error fetching blog", error: error.message });
  }
};

// Get admin blogs (Admin - all including drafts)
exports.getAdminBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    let filter = { author: req.user._id };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Blog.countDocuments(filter);

    res.json({
      message: "Admin blogs fetched successfully",
      blogs,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
      },
    });
  } catch (error) {
    console.error("Get admin blogs error:", error);
    res.status(500).json({ message: "Error fetching blogs", error: error.message });
  }
};

// Update blog (Admin only)
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, featuredImage, status } = req.body;

    let blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if user is the author or admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this blog" });
    }

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.excerpt = excerpt || blog.excerpt;
    blog.category = category || blog.category;
    blog.featuredImage = featuredImage || blog.featuredImage;
    blog.status = status || blog.status;

    await blog.save();

    res.json({ message: "Blog updated successfully", blog });
  } catch (error) {
    console.error("Update blog error:", error);
    res.status(500).json({ message: "Error updating blog", error: error.message });
  }
};

// Delete blog (Admin only)
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if user is the author or admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this blog" });
    }

    await Blog.findByIdAndDelete(id);

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({ message: "Error deleting blog", error: error.message });
  }
};

// Like blog
exports.likeBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const userId = req.user._id;
    const hasLiked = blog.likes.includes(userId);

    if (hasLiked) {
      blog.likes = blog.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      blog.likes.push(userId);
    }

    await blog.save();

    res.json({
      message: hasLiked ? "Like removed" : "Blog liked",
      blog,
      likes: blog.likes.length,
    });
  } catch (error) {
    console.error("Like blog error:", error);
    res.status(500).json({ message: "Error liking blog", error: error.message });
  }
};

// Add comment to blog
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const comment = {
      user: req.user._id,
      userName: req.user.name,
      text,
    };

    blog.comments.push(comment);
    await blog.save();

    res.json({
      message: "Comment added successfully",
      blog: await Blog.findById(id).populate("comments.user", "name avatar"),
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Error adding comment", error: error.message });
  }
};

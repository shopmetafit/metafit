const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

require("dotenv").config();
const router = express.Router();

// 🔹 Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 Video upload API (Admin)
router.post("/video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video uploaded" });
    }

    // 🔹 Stream upload function for video
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video", // VERY IMPORTANT
            folder: "admin_videos", // optional folder
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );

        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    // 🔹 Response
    res.status(200).json({
      message: "Video uploaded successfully",
      videoUrl: result.secure_url,
      duration: result.duration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});





// 🔹 GET all uploaded videos
router.get("/videos", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("resource_type:video AND folder:admin_videos")
      .sort_by("created_at", "desc")
      .max_results(30)
      .execute();

    const videos = result.resources.map((video) => ({
      public_id: video.public_id,
      url: video.secure_url,
      duration: video.duration,
      format: video.format,
      created_at: video.created_at,
    }));

    res.status(200).json({
      message: "Videos fetched successfully",
      videos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

module.exports = router;

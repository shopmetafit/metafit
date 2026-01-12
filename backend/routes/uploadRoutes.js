const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { processProductImage } = require("../utils/imageProcessor");

require("dotenv").config();
const router = express.Router();
//cloudinary configuration

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer setup using memory storage

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initial upload to get URL
router.post("/", upload.single("image"), async (req, res) => {
  try {
    console.log("req.file:", req.file);
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // function to handle the stream upload to cloudinary
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        //Use streamifier to convert file buffer to a stream
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };
    // call the streamUpload function
    const result = await streamUpload(req.file.buffer);

    //Respond with the uploaded image URL
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error uploading image" });
  }
});

// Process product image - remove background and add logo
router.post("/process-product", upload.single("image"), async (req, res) => {
  try {
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);
    
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const { logoUrl } = req.body;
    const logoUrlToUse = logoUrl || process.env.DEFAULT_LOGO_URL;

    if (!logoUrlToUse) {
      return res.status(400).json({ message: "Logo URL is required" });
    }

    // Process the image using file buffer
    const processedImageBuffer = await processProductImage(req.file.buffer, logoUrlToUse);

    // Upload processed image to cloudinary
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", format: "png" },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const processedResult = await streamUpload(processedImageBuffer);

    res.json({
      processedImageUrl: processedResult.secure_url,
      message: "Product image processed successfully",
    });
  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({ message: "Failed to process image", error: error.message });
  }
});

module.exports = router;

const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Remove background using remove.bg API
const removeBackground = async (imageInput) => {
  try {
    const postData = { type: "product" };
    
    // Check if input is a Buffer or URL string
    if (Buffer.isBuffer(imageInput)) {
      // For file buffer, use form-data
      const FormData = require("form-data");
      const formData = new FormData();
      formData.append("image_file", imageInput, "image.png");
      formData.append("type", "product");
      
      const response = await axios.post(
        "https://api.remove.bg/v1.0/removebg",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            "X-API-Key": process.env.REMOVEBG_API_KEY,
          },
          responseType: "arraybuffer",
        }
      );
      return Buffer.from(response.data, "binary");
    } else {
      // For URL string
      const response = await axios.post(
        "https://api.remove.bg/v1.0/removebg",
        { image_url: imageInput, type: "product" },
        {
          headers: {
            "X-API-Key": process.env.REMOVEBG_API_KEY,
          },
          responseType: "arraybuffer",
        }
      );
      return Buffer.from(response.data, "binary");
    }
  } catch (error) {
    console.error("Background removal failed:", error.message);
    throw new Error("Failed to remove background");
  }
};

// Add logo to product image
const addLogoToImage = async (imageBuffer, logoUrl) => {
  try {
    // Download logo
    const logoResponse = await axios.get(logoUrl, {
      responseType: "arraybuffer",
    });
    const logoBuffer = Buffer.from(logoResponse.data, "binary");

    // Get image metadata
    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageWidth = imageMetadata.width;
    const imageHeight = imageMetadata.height;

    // Resize logo to 20% of image width
    const logoWidth = Math.floor(imageWidth * 0.2);
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoWidth, logoWidth, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Position logo at bottom right with padding
    const padding = 20;
    const logoPositionX = imageWidth - logoWidth - padding;
    const logoPositionY = imageHeight - logoWidth - padding;

    // Composite logo onto image
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: resizedLogo,
          left: logoPositionX,
          top: logoPositionY,
        },
      ])
      .png()
      .toBuffer();

    return result;
  } catch (error) {
    console.error("Logo addition failed:", error.message);
    throw new Error("Failed to add logo");
  }
};

// Complete process: remove bg and add logo
const processProductImage = async (imageUrl, logoUrl) => {
  try {
    // Step 1: Remove background
    console.log("Removing background...");
    const noBgImage = await removeBackground(imageUrl);

    // Step 2: Add logo
    console.log("Adding logo...");
    const finalImage = await addLogoToImage(noBgImage, logoUrl);

    return finalImage;
  } catch (error) {
    console.error("Image processing failed:", error.message);
    throw error;
  }
};

module.exports = {
  removeBackground,
  addLogoToImage,
  processProductImage,
};

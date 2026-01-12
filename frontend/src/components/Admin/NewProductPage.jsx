import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { createProduct } from "../../redux/slices/adminProductSlice";
import axios from "axios";
import { useImageProcessor } from "../../hooks/useImageProcessor";
import { toast } from "sonner";

const NewProductPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { processProductImage, loading: processingImage } = useImageProcessor();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    countInStock: "",
    sku: "",
    category: "",
    brand: "",
    collection: "",
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [video, setVideo] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [processingImageIndices, setProcessingImageIndices] = useState(new Set());

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setImages([...e.target.files]);
    }
  };

  const handleDeleteImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Video size should be less than 5MB");
        e.target.value = "";
        return;
      }
      setVideo(file);
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { label: "", weight: "", quantity: "", price: "", discountPrice: "", stock: "", sku: "", pricePerUnit: "" },
    ]);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  const handleProcessImage = async (index) => {
    setProcessingImageIndices(prev => new Set([...prev, index]));

    try {
      const image = images[index];

      const formData = new FormData();
      formData.append("image", image);

      // 🚀 ONE STEP: upload + process
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload/process-product`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (!data?.processedImageUrl) {
        throw new Error("Background removal failed");
      }

      // 🔥 Replace image with URL object (NOT File)
      const updatedImages = [...images];
      updatedImages[index] = {
        url: data.processedImageUrl,
        altText: form.name,
      };

      setImages(updatedImages);
      toast.success("Background removed successfully ✅");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Image processing failed ❌");
    } finally {
      setProcessingImageIndices(prev => {
        const s = new Set(prev);
        s.delete(index);
        return s;
      });
    }
  };





  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    // ---------- IMAGE UPLOAD ----------
    const imageUrls = [];
    if (images.length > 0) {
      try {
        for (const image of images) {
          // Check if image is already processed (has url property)
          if (image instanceof File) {
            // It's a raw File, upload it
            const formData = new FormData();
            formData.append("image", image);

            try {
              const { data } = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
              imageUrls.push({ url: data.imageUrl, altText: form.name });
              toast.success("Image uploaded successfully");
            } catch (uploadError) {
              // If image upload fails, skip this image and continue
              console.error("Image upload failed:", uploadError);
              toast.error(`Failed to upload image: ${uploadError.response?.data?.message || uploadError.message}`);
            }
          } else {
            // It's already processed, just use the URL
            imageUrls.push({ url: image.url, altText: image.altText || form.name });
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Error processing images");
      }
    }

    if (imageUrls.length > 0) {
      imageUrls[0].isPrimary = true;
    }

    // ---------- VIDEO UPLOAD (NEW) ----------
    let videoUrl = "";
    if (video) {
      try {
        setVideoUploading(true);

        const videoFormData = new FormData();
        videoFormData.append("video", video);

        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/upload/video`,
          videoFormData
        );

        videoUrl = data.videoUrl;
        setVideoUploading(false);
      } catch (error) {
        console.error(error);
        setUploading(false);
        setVideoUploading(false);
        return;
      }
    }

    // ---------- FINAL PRODUCT DATA ----------
    const productData = {
      ...form,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      countInStock: Number(form.countInStock),
      images: imageUrls,
      videoUrl,
      ...(hasVariants && {
        variants: variants.map(v => ({
          label: v.label,
          price: Number(v.price),
          discountPrice: v.discountPrice ? Number(v.discountPrice) : undefined,
          weight: v.weight ? Number(v.weight) : undefined,
          quantity: v.quantity ? Number(v.quantity) : undefined,
          stock: v.stock !== "" ? Number(v.stock) : 0,
          sku: v.sku || "",
          pricePerUnit: v.pricePerUnit || "",
        }))
      })
    };


    try {
      if (imageUrls.length === 0) {
        toast.warning("No images uploaded, but product will be created");
      }
      console.log("Submitting product data:", productData);
      await dispatch(createProduct(productData)).unwrap();
      toast.success("Product created successfully ✅");
      navigate("/admin/products");
    } catch (error) {
      console.error("Create product error:", error);
      const errorMessage = error?.message || error?.payload || JSON.stringify(error) || "Product creation failed";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }

  };


  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="mb-4">
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-gray-700">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        {/* Price */}
        <div className="mb-4">
          <label className="block text-gray-700">Price</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        {/* Discount Price */}
        <div className="mb-4">
          <label className="block text-gray-700">Discount Price</label>
          <input
            type="number"
            name="discountPrice"
            value={form.discountPrice}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        {/* Count In Stock */}
        <div className="mb-4">
          <label className="block text-gray-700">Count In Stock</label>
          <input
            type="number"
            name="countInStock"
            value={form.countInStock}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        {/* SKU */}
        <div className="mb-4">
          <label className="block text-gray-700">SKU</label>
          <input
            type="text"
            name="sku"
            value={form.sku}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-gray-700">Category</label>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        {/* Brand */}
        <div className="mb-4">
          <label className="block text-gray-700">Brand</label>
          <input
            type="text"
            name="brand"
            value={form.brand}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        {/* Collection */}
        <div className="mb-4">
          <label className="block text-gray-700">Collection</label>
          <input
            type="text"
            name="collection"
            value={form.collection}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block text-gray-700">Images</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border rounded"
            multiple
          />
          <div className="flex gap-4 mt-4 flex-wrap">
            {images.map((image, index) => {
              // Handle both File objects and processed image objects
              const imageSrc = image instanceof File 
                ? URL.createObjectURL(image) 
                : image.url;
              
              return (
              <div key={index} className="relative group">
                <img
                  src={imageSrc}
                  alt="Preview"
                  className="w-24 h-24 object-cover shadow-md rounded"
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded flex flex-col gap-1 items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleProcessImage(index)}
                    disabled={processingImageIndices.has(index)}
                    className="bg-teal-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processingImageIndices.has(index) ? "Processing..." : "Remove BG"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(index)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
            })}
          </div>
          <p className="text-sm text-gray-600 mt-2">Hover over image to remove background and add logo</p>
        </div>

        {/* Video Upload */}
        <div className="mb-4">
          <label className="block text-gray-700">Product Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="w-full px-4 py-2 border rounded"
          />

          {video && (
            <video
              src={URL.createObjectURL(video)}
              controls
              className="mt-4 w-64 rounded shadow"
            />
          )}
        </div>

        {/* Variants Section */}
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-700 font-semibold">Has Variants (Different sizes/weights)</span>
            </label>
          </div>

          {hasVariants && (
            <div>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={addVariant}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  + Add Variant
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={index} className="p-4 border rounded bg-white">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm">Label (e.g., "1 kg (Pack of 1)")</label>
                        <input
                          type="text"
                          value={variant.label}
                          onChange={(e) => updateVariant(index, "label", e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm">Weight (kg)</label>
                        <input
                          type="number"
                          value={variant.weight}
                          onChange={(e) => updateVariant(index, "weight", e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm">Quantity (Pack size)</label>
                        <input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) => updateVariant(index, "quantity", e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm">Price</label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, "price", e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm">Discount Price</label>
                        <input
                          type="number"
                          value={variant.discountPrice}
                          onChange={(e) => updateVariant(index, "discountPrice", e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm">Stock</label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, "stock", e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm">SKU</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, "sku", e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm">Price Per Unit (e.g., "₹238/kg")</label>
                        <input
                          type="text"
                          value={variant.pricePerUnit}
                          onChange={(e) => updateVariant(index, "pricePerUnit", e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remove Variant
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end">
          <Link
            to="/admin/products"
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewProductPage;

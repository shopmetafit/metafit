import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { createProduct } from "../../redux/slices/adminProductSlice";
import axios from "axios";

const NewProductPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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


 const handleSubmit = async (e) => {
  e.preventDefault();
  setUploading(true);

  // ---------- IMAGE UPLOAD (same as before) ----------
  const imageUrls = [];
  if (images.length > 0) {
    try {
      for (const image of images) {
        const formData = new FormData();
        formData.append("image", image);

        const { data } = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
          formData
        );

        imageUrls.push({ url: data.imageUrl, altText: form.name });
      }
    } catch (error) {
      console.error(error);
      setUploading(false);
      return;
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
    discountPrice: Number(form.discountPrice),
    countInStock: Number(form.countInStock),
    images: imageUrls,
    videoUrl: videoUrl, // 👈 ADD THIS
  };

  await dispatch(createProduct(productData));
  setUploading(false);
  navigate("/admin/products");
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
          <div className="flex gap-4 mt-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt="Preview"
                  className="w-20 h-20 object-cover shadow-md rounded"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
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

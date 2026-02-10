import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Loader } from "lucide-react";

const VendorAddProductPage = () => {
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
                toast.error("Video size should be less than 5MB");
                e.target.value = "";
                return;
            }
            setVideo(file);
        }
    };

    const addVariant = () => {
        setVariants([
            ...variants,
            {
                label: "",
                weight: "",
                quantity: "",
                price: "",
                discountPrice: "",
                stock: "",
                sku: "",
                pricePerUnit: "",
            },
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
        setProcessingImageIndices((prev) => new Set([...prev, index]));

        try {
            const image = images[index];
            const formData = new FormData();
            formData.append("image", image);

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

            const updatedImages = [...images];
            updatedImages[index] = {
                url: data.processedImageUrl,
                altText: form.name,
            };

            setImages(updatedImages);
            toast.success("Background removed successfully");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Image processing failed");
        } finally {
            setProcessingImageIndices((prev) => {
                const s = new Set(prev);
                s.delete(index);
                return s;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        // Validate required fields
        if (!form.name || !form.price || !form.category || !form.brand || !form.description) {
            toast.error("Please fill in all required fields (Name, Brand, Category, Price, Description)");
            setUploading(false);
            return;
        }

        // IMAGE UPLOAD
        const imageUrls = [];
        if (images.length > 0) {
            try {
                for (const image of images) {
                    if (image instanceof File) {
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
                            console.error("Image upload failed:", uploadError);
                            toast.error(
                                `Failed to upload image: ${uploadError.response?.data?.message || uploadError.message
                                }`
                            );
                        }
                    } else {
                        imageUrls.push({
                            url: image.url,
                            altText: image.altText || form.name,
                        });
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

        // VIDEO UPLOAD
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
                toast.error("Video upload failed");
                return;
            }
        }

        // PRODUCT DATA
        const productData = {
            ...form,
            price: Number(form.price),
            discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
            countInStock: Number(form.countInStock),
            images: imageUrls,
            videoUrl,
            ...(hasVariants && {
                variants: variants.map((v) => ({
                    label: v.label,
                    price: Number(v.price),
                    discountPrice: v.discountPrice ? Number(v.discountPrice) : undefined,
                    weight: v.weight ? Number(v.weight) : undefined,
                    quantity: v.quantity ? Number(v.quantity) : undefined,
                    stock: v.stock !== "" ? Number(v.stock) : 0,
                    sku: v.sku || "",
                    pricePerUnit: v.pricePerUnit || "",
                })),
            }),
        };

        try {
            const token = localStorage.getItem("userToken");
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/vendor/products`,
                productData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Product created successfully");
            navigate("/vendor/products");
        } catch (error) {
            console.error("Create product error:", error);
            toast.error(error.response?.data?.message || "Product creation failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate("/vendor/products")}
                        className="p-2 hover:bg-gray-200 rounded-lg transition"
                    >
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
                        <p className="text-gray-600 mt-1">
                            Create and list a new product for your store
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
                    {/* Basic Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Basic Information
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Organic Green Tea"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Brand *
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={form.brand}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Nature's Best"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category *
                                </label>
                                <input
                                    type="text"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Beverages"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Collection
                                </label>
                                <input
                                    type="text"
                                    name="collection"
                                    value={form.collection}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Summer Collection"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                placeholder="Describe your product..."
                                required
                            />
                        </div>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="mb-8 pb-8 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Pricing & Stock
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Regular Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Discount Price (₹)
                                </label>
                                <input
                                    type="number"
                                    name="discountPrice"
                                    value={form.discountPrice}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stock Quantity
                                </label>
                                <input
                                    type="number"
                                    name="countInStock"
                                    value={form.countInStock}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU
                                </label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={form.sku}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder="e.g., SKU-001"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="mb-8 pb-8 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Product Images
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                multiple
                                accept="image/*"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                You can upload multiple images. First image will be used as primary.
                            </p>
                        </div>

                        {images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {images.map((image, index) => {
                                    const imageSrc =
                                        image instanceof File ? URL.createObjectURL(image) : image.url;

                                    return (
                                        <div key={index} className="relative group">
                                            <img
                                                src={imageSrc}
                                                alt="Preview"
                                                className="w-full h-32 object-cover rounded-lg shadow-sm"
                                            />
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg flex flex-col gap-1 items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleProcessImage(index)}
                                                    disabled={processingImageIndices.has(index)}
                                                    className="bg-teal-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                >
                                                    {processingImageIndices.has(index)
                                                        ? "Processing..."
                                                        : "Remove BG"}
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
                        )}
                    </div>

                    {/* Video */}
                    <div className="mb-8 pb-8 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Product Video (Optional)
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Product Video
                            </label>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                        </div>

                        {video && (
                            <div className="flex justify-center">
                                <video
                                    src={URL.createObjectURL(video)}
                                    controls
                                    className="w-full max-w-md rounded-lg shadow-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Variants */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Product Variants (Optional)
                            </h2>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasVariants}
                                    onChange={(e) => setHasVariants(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700">
                                    This product has variants
                                </span>
                            </label>
                        </div>

                        {hasVariants && (
                            <div>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="mb-4 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                                >
                                    <Plus size={18} />
                                    Add Variant
                                </button>

                                <div className="space-y-4">
                                    {variants.map((variant, index) => (
                                        <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Label (e.g., 250g)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={variant.label}
                                                        onChange={(e) =>
                                                            updateVariant(index, "label", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        placeholder="e.g., 250g Pack"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Weight (kg)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.weight}
                                                        onChange={(e) =>
                                                            updateVariant(index, "weight", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        step="0.1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Quantity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.quantity}
                                                        onChange={(e) =>
                                                            updateVariant(index, "quantity", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Price (₹)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.price}
                                                        onChange={(e) =>
                                                            updateVariant(index, "price", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Discount Price (₹)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.discountPrice}
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                "discountPrice",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Stock
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.stock}
                                                        onChange={(e) =>
                                                            updateVariant(index, "stock", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        SKU
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={variant.sku}
                                                        onChange={(e) =>
                                                            updateVariant(index, "sku", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Price Per Unit (e.g., ₹238/kg)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={variant.pricePerUnit}
                                                        onChange={(e) =>
                                                            updateVariant(index, "pricePerUnit", e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeVariant(index)}
                                                className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
                                            >
                                                <Trash2 size={16} />
                                                Remove Variant
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/vendor/products")}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || videoUploading}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {uploading || videoUploading ? (
                                <>
                                    <Loader size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Product"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VendorAddProductPage;

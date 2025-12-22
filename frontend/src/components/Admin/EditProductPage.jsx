import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductDetails } from "../../redux/slices/productSlice";
import axios from "axios";
import { updateProduct } from "../../redux/slices/adminProductSlice";

const EditProductPage = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const navigate = useNavigate();
  const { selectedProduct, loading, error } = useSelector(
    (state) => state.products
  );
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: 0,
    
    discountPrice: 0,
    countInStock: 0,
    sku: "",
    category: "",
    brand: "",
    sizes: [],
    colors: [],
    collections: "",
    material: "",
    gender: "",
    images: [
      // {
      //   url: "https://picsum.photos/150?random=1",
      // },
      // {
      //   url: "https://picsum.photos/150?random=1",
      // },
    ],
    extraImages: [],
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct) {
      const product = {
        ...selectedProduct,
        colors: selectedProduct.colors || [],
        images: selectedProduct.images || [],
        extraImages: selectedProduct.extraImages || [],
      };

      if (product.images.length > product.colors.length) {
        const colorImageCount = product.colors.length;
        const extra = product.images.slice(colorImageCount);
        product.images = product.images.slice(0, colorImageCount);
        product.extraImages = [...product.extraImages, ...extra];
      }

      setProductData(product);
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prevData) => ({ ...prevData, [name]: value }));
    // console.log("sd=",e.productData.value)
  };

  const handleImageUpload = async (e, index) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setProductData((prevData) => {
        const newImages = [...prevData.images];
        newImages[index] = { url: data.imageUrl, altText: "" };
        return { ...prevData, images: newImages };
      });
      setUploading(false);
    } catch (error) {
      console.log(error);
      setUploading(false);
    }
  };


  const handleExtraImageUpload = async (e) => {
  const file = e.target.files[0];
  const formData = new FormData();
  formData.append("image", file);

  try {
    setUploading(true);
    const { data } = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setProductData((prevData) => ({
      ...prevData,
      extraImages: [...prevData.extraImages, { url: data.imageUrl, altText: "" }],
    }));
    setUploading(false);
  } catch (error) {
    console.log(error);
    setUploading(false);
  }
};


  const handleDeleteImage = (indexToDelete) => {
    setProductData((prevData) => ({
      ...prevData,
      images: prevData.images.filter((_, index) => index !== indexToDelete),
    }));
  };

  const handleDeleteColor = (indexToDelete) => {
    setProductData((prevData) => {
      const newColors = prevData.colors.filter((_, index) => index !== indexToDelete);
      const newImages = prevData.images.filter((_, index) => index !== indexToDelete);
      return { ...prevData, colors: newColors, images: newImages };
    });
  };

  const handleSetPrimaryImage = (indexToSet) => {
    setProductData((prevData) => ({
      ...prevData,
      images: prevData.images.map((image, index) => ({
        ...image,
        isPrimary: index === indexToSet,
      })),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newColors = [];
    const colorImages = [];
    const otherImages = [...productData.extraImages];

    productData.colors.forEach((color, index) => {
      const image = productData.images[index];
      // Only process if there is an image for this color slot
      if (image) {
        if (color && color.trim() !== "") {
          newColors.push(color);
          colorImages.push(image);
        } else {
          // If color is empty, treat the image as an extra image
          otherImages.push(image);
        }
      }
    });

    const dataToSubmit = {
      ...productData,
      colors: newColors,
      images: [...colorImages, ...otherImages].map(img => ({...img, altText: productData.name})),
    };
    delete dataToSubmit.extraImages;
    dispatch(updateProduct({ id, productData: dataToSubmit }));
    navigate("/admin/products");
  };



  if (loading) return <p>Loading..</p>;
  if (error) return <p>Error:{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 shadow-md rounded-md">
      <h2 className="text-3xl font-bold mb-6">Edit Product</h2>
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Product Name</label>
          <input
            type="text"
            name="name"
            value={productData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        {/* description */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Description</label>
          <textarea
            name="description"
            value={productData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={4}
            required
          />
        </div>
        {/* price */}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-semibold mb-2">Price</label>
            <input
              type="number"
              name="price"
              value={productData.price}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Discount Price</label>
            <input
              type="number"
              name="discountPrice"
              value={productData.discountPrice}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>


        {/* count in stock */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Count in stock</label>
          <input
            type="number"
            name="countInStock"
            value={productData.countInStock}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* sku */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">SKU</label>
          <input
            type="text"
            name="sku"
            value={productData.sku}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* Category */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Category</label>
          <input
            type="text"
            name="category"
            value={productData.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* Brand */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Brand</label>
          <input
            type="text"
            name="brand"
            value={productData.brand}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* sizes */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Sizes(Comma-separated)
          </label>
          <input
            type="text"
            name="sizes"
            value={productData.sizes.join(",")}
            onChange={(e) =>
              setProductData({
                ...productData,
                sizes: e.target.value.split(",").map((size) => size.trim()),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="mb-6">
          <label className="block font-semibold mb-2">Colors & Images</label>
          {productData.colors.map((color, index) => (
            <div key={index} className="flex items-center gap-4 mb-2">
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  const newColors = [...productData.colors];
                  newColors[index] = e.target.value;
                  setProductData({ ...productData, colors: newColors });
                }}
                className="w-1/3 border p-2 rounded"
                placeholder="Enter color name"
              />
              <input
                type="file"
                onChange={(e) => handleImageUpload(e, index)}
                className="w-1/3"
              />
              {productData.images[index] && (
                <div className="relative">
                  <img
                    src={productData.images[index].url}
                    alt={color}
                    className="w-20 h-20 object-cover shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
                  >
                    X
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDeleteColor(index)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setProductData({
                ...productData,
                colors: [...productData.colors, ""],
              })
            }
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Color
          </button>

          {/* Extra Images */}
          <div className="mt-6">
            <label className="block font-semibold mb-2">Upload Extra Images</label>
            <input type="file" onChange={handleExtraImageUpload} />
            {uploading && <p>Uploading Image..</p>}
            <div className="flex gap-4 mt-4 overflow-x-auto">
              {productData.extraImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={image.altText || "Extra Image"}
                    className="w-20 h-20 object-cover shadow-md rounded"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProductData((prevData) => ({
                        ...prevData,
                        extraImages: prevData.extraImages.filter((_, i) => i !== index),
                      }))
                    }
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white p-2 hover:bg-green-600"
        >
          Update Product
        </button>

        
      </form>
    </div>
  );
};

export default EditProductPage;
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
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct) {
      setProductData(selectedProduct);
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prevData) => ({ ...prevData, [name]: value }));
    // console.log("sd=",e.productData.value)
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    // console.log(file);
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

      setProductData((prevData) => ({
        ...prevData,
        images: [...prevData.images, { url: data.imageUrl, altText: "" }],
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
    // console.log(productData);
    dispatch(updateProduct({ id, productData }));
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
        {/* colors */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Colors(Comma-separated)
          </label>
          <input
            type="text"
            name="colors"
            value={productData.colors.join(",")}
            onChange={(e) =>
              setProductData({
                ...productData,
                colors: e.target.value.split(",").map((color) => color.trim()),
              })
            }
            className="w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        {/* image */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Upload Image</label>
          <input type="file" onChange={handleImageUpload} />
          {uploading && <p>Uploading Image..</p>}
          <div className="flex gap-4 mt-4">
            {productData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.url}
                  alt={image.altText || "Product Image"}
                  className={`w-20 h-20 object-cover shadow-md ${
                    image.isPrimary ? "border-4 border-blue-500" : ""
                  }`}
                />
                <div className="absolute top-0 right-0 flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(index)}
                    className="bg-red-500 text-white p-1 rounded-full text-xs"
                  >
                    X
                  </button>
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(index)}
                      className="bg-green-500 text-white p-1 mt-1 rounded-full text-xs"
                    >
                      Set Primary
                    </button>
                  )}
                </div>
                {image.isPrimary && (
                  <div className="absolute bottom-0 left-0 bg-blue-500 text-white text-xs px-1">
                    Primary
                  </div>
                )}
              </div>
            ))}
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
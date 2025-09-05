import { useEffect, useState } from "react";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import { useParams } from "react-router-dom";
import YouTube from "react-youtube";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductDetails,
  fetchSimilarProduct,
} from "../../redux/slices/productSlice";
import { addToCart } from "../../redux/slices/cartSlice";

const ProductDetails = ({ productId }) => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { selectedProduct, loading, error, similarProducts } = useSelector(
    (state) => state.products
  );
  const { user, guestId } = useSelector((state) => state.auth);

  const [mainImage, setMainImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const productFetchId = productId || id;

  useEffect(() => {
    if (productFetchId) {
      dispatch(fetchProductDetails(productFetchId));
      dispatch(fetchSimilarProduct({ id: productFetchId }));
    }
  }, [dispatch, productFetchId]);

  useEffect(() => {
    if (selectedProduct?.images?.length > 0) {
      setMainImage(selectedProduct.images[0].url);
    }
  }, [selectedProduct]);

  const handleQuantityChange = (action) => {
    if (action === "plus") setQuantity((prev) => prev + 1);
    if (action === "minus" && quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCart = () => {
    setIsButtonDisabled(true);
    dispatch(
      addToCart({
        productId: productFetchId,
        quantity,
        size: selectedSize || null,
        color: selectedColor || null,
        guestId,
        userId: user?._id,
      })
    )
      .then(() => {
        toast.success("Product added to cart!", { duration: 1500 });
      })
      .finally(() => {
        setIsButtonDisabled(false);
      });
  };

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-6">
      {selectedProduct && (
        <div className="max-w-6xl mx-auto bg-white shadow-lg p-8 rounded-2xl">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Thumbnails */}
            <div className="hidden md:flex flex-col gap-4">
              {selectedProduct.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.altText || `Thumbnail ${index}`}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer transition-all duration-300 ${
                    mainImage === image.url
                      ? "ring-2 ring-black"
                      : "hover:ring-1 hover:ring-gray-400"
                  }`}
                  onClick={() => setMainImage(image.url)}
                />
              ))}
            </div>

            {/* Main Image */}
            <div className="md:w-1/2">
              <img
                src={mainImage}
                alt="Main Product"
                className="w-full h-auto rounded-2xl shadow-md transition-transform duration-300 hover:scale-[1.02]"
              />
              {/* Mobile thumbnails */}
              <div className="md:hidden flex overflow-x-auto gap-3 mt-4 scrollbar-hide">
                {selectedProduct.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={image.altText || `Thumbnail ${index}`}
                    className={`w-20 h-20 object-cover rounded-lg cursor-pointer transition-all ${
                      mainImage === image.url
                        ? "ring-2 ring-black"
                        : "hover:ring-1 hover:ring-gray-400"
                    }`}
                    onClick={() => setMainImage(image.url)}
                  />
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="md:w-1/2">
              <h1 className="text-3xl font-bold mb-2">{selectedProduct.name}</h1>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-lg text-gray-400 line-through">
                  {selectedProduct.price && `₹${selectedProduct.price}`}
                </p>
                <p className="text-2xl font-semibold text-black">
                  ₹{selectedProduct.discountPrice}
                </p>
              </div>
              <p className="text-gray-600 mb-6">{selectedProduct.description}</p>

              {/* Sizes */}
              {selectedProduct?.sizes?.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium text-gray-700">Size:</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedProduct.sizes.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          selectedSize === size
                            ? "bg-black text-white"
                            : "border-gray-300 hover:border-black"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {selectedProduct?.colors?.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium text-gray-700">Color:</p>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {selectedProduct.colors.map((color, index) => {
                      const colorName =
                        selectedProduct.colorsName?.[index] || color;
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${
                            selectedColor === color
                              ? "ring-2 ring-black scale-110"
                              : "border-gray-300 hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                          title={colorName}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <p className="font-medium text-gray-700">Quantity:</p>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleQuantityChange("minus")}
                    className="px-3 py-1 bg-gray-200 rounded-lg text-lg hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange("plus")}
                    className="px-3 py-1 bg-gray-200 rounded-lg text-lg hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={isButtonDisabled}
                className={`bg-black text-white px-6 py-3 rounded-lg w-full transition-all ${
                  isButtonDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-gray-900"
                }`}
              >
                {isButtonDisabled ? "Adding..." : "Add to Cart"}
              </button>

              {/* Characteristics */}
              <div className="mt-10">
                <h3 className="text-xl font-bold mb-4">Characteristics</h3>
                <table className="w-full text-sm text-gray-600 border-t border-gray-200">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Brand</td>
                      <td className="py-2">{selectedProduct.brand}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Material</td>
                      <td className="py-2">{selectedProduct.material}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Video */}
              {selectedProduct?.videoUrl && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-3">Product Video</h3>
                  <YouTube
                    videoId={selectedProduct.videoUrl.split("/").pop()
                    }
                    iframeClassName="w-full aspect-video rounded-xl shadow-md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Similar Products */}
          <div className="mt-20">
            <h2 className="text-2xl text-center font-semibold mb-6">
              You May Also Like
            </h2>
            <ProductGrid
              products={similarProducts}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;

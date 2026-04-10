import { useEffect, useState } from "react";
import { FaPlayCircle } from "react-icons/fa";
import { toast } from "sonner";
import ProductGrid from "./ProductGrid";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductDetails, fetchSimilarProduct } from "../../redux/slices/productSlice";
import { addToCart } from "../../redux/slices/cartSlice";
import { ShieldCheck, Truck, RefreshCw, ChevronRight, Minus, Plus, ShoppingCart } from "lucide-react";

const ProductDetails = ({ productId }) => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { selectedProduct, loading, error, similarProducts } = useSelector((state) => state.products);
  const { user, guestId } = useSelector((state) => state.auth);

  const [mainImage, setMainImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

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

  const handleColorClick = (color, index) => {
    setSelectedColor(color);
    if (selectedProduct.images[index]) {
      setMainImage(selectedProduct.images[index].url);
    }
  };

  const handleAddToCart = () => {
    if (selectedProduct.hasVariants && !selectedVariant) {
      toast.error("Please select a variant", { duration: 1500 });
      return;
    }
    setIsButtonDisabled(true);
    dispatch(
      addToCart({
        productId: productFetchId,
        quantity,
        size: selectedSize || null,
        color: selectedColor || null,
        guestId,
        userId: user?._id,
        variant: selectedVariant ? { label: selectedVariant.label, price: selectedVariant.price } : null,
      })
    )
      .then(() => toast.success("Added to cart!", { duration: 1500 }))
      .finally(() => setIsButtonDisabled(false));
  };

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f0f2f2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#047ca8] mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading product...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f0f2f2]">
        <p className="text-red-500">{error}</p>
      </div>
    );

  if (!selectedProduct) return null;

  const discountPct =
    selectedProduct.price && selectedProduct.discountPrice
      ? Math.round(((selectedProduct.price - selectedProduct.discountPrice) / selectedProduct.price) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#f0f2f2]">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <Link to="/" className="hover:text-[#047ca8] hover:underline">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/collections/all" className="hover:text-[#047ca8] hover:underline">Shop</Link>
          {selectedProduct.category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link
                to={`/collections/all?category=${selectedProduct.category}`}
                className="hover:text-[#047ca8] hover:underline capitalize"
              >
                {selectedProduct.category}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-800 font-medium line-clamp-1">{selectedProduct.name}</span>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-4">

        {/* ── Main Product Card ── */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row gap-0">

            {/* ── Left: Images ── */}
            <div className="lg:w-[460px] xl:w-[520px] flex-shrink-0 p-4 lg:border-r border-gray-100">
              {/* Desktop: vertical thumbnails + main image side by side */}
              <div className="hidden lg:flex gap-3">
                {/* Vertical thumbnail strip */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {selectedProduct?.videoUrl && (
                    <button
                      onClick={() => setMainImage("video")}
                      className={`w-14 h-14 flex-shrink-0 rounded-md border-2 overflow-hidden transition-all ${
                        mainImage === "video" ? "border-[#047ca8]" : "border-gray-200 hover:border-[#047ca8]"
                      }`}
                    >
                      <video src={selectedProduct.videoUrl} muted className="w-full h-full object-cover" />
                    </button>
                  )}
                  {selectedProduct.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(img.url)}
                      className={`w-14 h-14 flex-shrink-0 rounded-md border-2 overflow-hidden bg-gray-50 transition-all ${
                        mainImage === img.url ? "border-[#047ca8]" : "border-gray-200 hover:border-[#047ca8]"
                      }`}
                    >
                      <img src={img.url} alt={img.altText || `View ${i + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>

                {/* Main image */}
                <div className="relative flex-1 aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {mainImage === "video" ? (
                    <video src={selectedProduct.videoUrl} controls autoPlay className="w-full h-full object-contain" />
                  ) : (
                    <img src={mainImage} alt={selectedProduct.name} className="w-full h-full object-contain" />
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 rounded-lg p-2 shadow">
                    <img
                      src="https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png"
                      alt="M Wellness Bazaar"
                      className="h-12 object-contain"
                    />
                  </div>
                  {discountPct > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{discountPct}% OFF
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile: main image + horizontal thumbnails below */}
              <div className="lg:hidden">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {mainImage === "video" ? (
                    <video src={selectedProduct.videoUrl} controls autoPlay className="w-full h-full object-contain" />
                  ) : (
                    <img src={mainImage} alt={selectedProduct.name} className="w-full h-full object-contain" />
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 rounded-lg p-2 shadow">
                    <img
                      src="https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png"
                      alt="M Wellness Bazaar"
                      className="h-10 object-contain"
                    />
                  </div>
                  {discountPct > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{discountPct}% OFF
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {selectedProduct.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(img.url)}
                      className={`w-14 h-14 flex-shrink-0 rounded-md border-2 overflow-hidden bg-gray-50 ${
                        mainImage === img.url ? "border-[#047ca8]" : "border-gray-200"
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Center: Details ── */}
            <div className="flex-1 p-4 lg:p-6">
              {/* Brand */}
              {selectedProduct.brand && (
                <p className="text-sm text-[#047ca8] font-semibold mb-1">
                  Visit the <span className="underline cursor-pointer">{selectedProduct.brand}</span> Store
                </p>
              )}

              {/* Name */}
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 leading-snug mb-3">
                {selectedProduct.name}
              </h1>

              {/* Rating placeholder */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-sm">★★★★★</span>
                <span className="text-xs text-[#047ca8] hover:underline cursor-pointer">4.9 out of 5</span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-[#047ca8] hover:underline cursor-pointer">50,000+ sold</span>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-4" />

              {/* Price Section */}
              {!selectedProduct.hasVariants ? (
                <div className="mb-4">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{selectedProduct.discountPrice?.toLocaleString()}
                    </span>
                    {selectedProduct.price && selectedProduct.price !== selectedProduct.discountPrice && (
                      <span className="text-base text-gray-400 line-through">
                        M.R.P: ₹{selectedProduct.price?.toLocaleString()}
                      </span>
                    )}
                    {discountPct > 0 && (
                      <span className="text-base font-semibold text-red-500">({discountPct}% off)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                  <p className="text-sm text-gray-600 mt-1">+ ₹30 delivery charge</p>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2 font-medium">
                    From ₹{Math.min(...selectedProduct.variants.map((v) => v.discountPrice || v.price))?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Select a variant below to see pricing</p>
                </div>
              )}

              {/* Variants */}
              {selectedProduct.hasVariants && selectedProduct.variants?.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-bold text-gray-800 mb-2">Pack Options:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedProduct.variants.map((variant, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${
                          selectedVariant?.label === variant.label
                            ? "border-[#047ca8] bg-blue-50"
                            : "border-gray-200 hover:border-[#047ca8]"
                        }`}
                      >
                        <p className="text-xs font-bold text-gray-800 mb-0.5">{variant.label}</p>
                        <p className="text-base font-bold text-gray-900">
                          ₹{(variant.discountPrice || variant.price)?.toLocaleString()}
                        </p>
                        {variant.discountPrice && variant.price && variant.discountPrice < variant.price && (
                          <p className="text-xs text-gray-400 line-through">₹{variant.price}</p>
                        )}
                        {variant.pricePerUnit && (
                          <p className="text-xs text-gray-500">({variant.pricePerUnit})</p>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedVariant && (
                    <div className="mt-2 px-3 py-2 bg-[#e8f4f8] border border-[#b3d9e8] rounded text-sm text-[#047ca8] font-medium">
                      Selected: {selectedVariant.label} — ₹{(selectedVariant.discountPrice || selectedVariant.price)?.toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Sizes */}
              {selectedProduct.sizes?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-800 mb-2">Size:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map((size, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded border-2 text-sm font-medium transition-all ${
                          selectedSize === size
                            ? "border-[#047ca8] bg-blue-50 text-[#047ca8]"
                            : "border-gray-300 hover:border-[#047ca8] text-gray-800"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {selectedProduct.colors?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-800 mb-2">Color:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.colors.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => handleColorClick(color, i)}
                        title={selectedProduct.colorsName?.[i] || color}
                        className={`w-9 h-9 rounded-full border-2 transition-all ${
                          selectedColor === color ? "ring-2 ring-[#047ca8] ring-offset-2" : "border-gray-300 hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              {!selectedProduct.hasVariants && (
                <div className="mb-5">
                  <p className="text-sm font-bold text-gray-800 mb-2">Quantity:</p>
                  <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange("minus")}
                      className="px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors border-r border-gray-300"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-6 py-2 font-bold text-gray-900 text-base min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange("plus")}
                      className="px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors border-l border-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isButtonDisabled}
                className={`w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all shadow-md ${
                  isButtonDisabled
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#0FB7A3] hover:bg-[#0DA28E] text-white hover:shadow-lg active:scale-95"
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {isButtonDisabled ? "Adding..." : "Add to Cart"}
              </button>

              {/* Characteristics table */}
              <div className="mt-6 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Product Details</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {selectedProduct.brand && (
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-500 font-medium w-32">Brand</td>
                        <td className="py-2 text-gray-900">{selectedProduct.brand}</td>
                      </tr>
                    )}
                    {selectedProduct.category && (
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-500 font-medium w-32">Category</td>
                        <td className="py-2 text-gray-900 capitalize">{selectedProduct.category}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Extra Info Images */}
              {selectedProduct.extraImages?.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">More Details</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {selectedProduct.extraImages.map((img, i) => (
                      <img
                        key={i}
                        src={img.url}
                        alt={img.altText || `Detail ${i + 1}`}
                        className="w-24 h-24 object-contain rounded-lg border border-gray-200 flex-shrink-0 hover:scale-105 transition-transform cursor-zoom-in"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Buy Box (desktop only) ── */}
            <div className="hidden xl:block w-64 flex-shrink-0 p-4">
              <div className="border border-gray-200 rounded-lg p-4 sticky top-[110px]">
                {/* Price */}
                <div className="mb-3">
                  {selectedProduct.hasVariants ? (
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{selectedVariant
                        ? (selectedVariant.discountPrice || selectedVariant.price)?.toLocaleString()
                        : Math.min(...selectedProduct.variants.map((v) => v.discountPrice || v.price))?.toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{selectedProduct.discountPrice?.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">+ ₹30 delivery</p>
                </div>

                {/* Stock status */}
                <p className="text-green-600 font-semibold text-sm mb-3">In Stock</p>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={isButtonDisabled}
                  className={`w-full py-2.5 rounded-full font-bold text-sm mb-2 transition-all ${
                    isButtonDisabled
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#0FB7A3] hover:bg-[#0DA28E] text-white shadow-md"
                  }`}
                >
                  {isButtonDisabled ? "Adding..." : "Add to Cart"}
                </button>

                {/* Trust signals */}
                <div className="mt-3 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Secure transaction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[#047ca8] flex-shrink-0" />
                    <span>Ships within 24hrs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span>10-day return policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {selectedProduct.description && (
            <div className="px-4 lg:px-6 pb-6 border-t border-gray-100 pt-4">
              <h2 className="text-base font-bold text-gray-900 mb-3">About this product</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedProduct.description}
              </p>
            </div>
          )}
        </div>

        {/* ── Similar Products ── */}
        {similarProducts?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
              Customers also viewed
            </h2>
            <ProductGrid products={similarProducts} loading={loading} error={error} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;

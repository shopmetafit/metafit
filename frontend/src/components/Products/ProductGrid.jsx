import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";
import { toast } from "sonner";
import { useState } from "react";

const ProductGrid = ({ products, loading, error }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const guestId = useSelector((state) => state.auth.guestId);
  const [hoveredImage, setHoveredImage] = useState({});
  const [showVariants, setShowVariants] = useState({});

  const handleAddToCart = (e, product, variant = null) => {
    e.preventDefault();

    dispatch(
      addToCart({
        productId: product._id,
        quantity: 1,
        size: null,
        color: null,
        guestId,
        userId: user?._id,
        variant: variant ? { label: variant.label, price: variant.price } : null,
      })
    )
      .then(() => toast.success("Product added to cart!", { duration: 1500 }))
      .catch(() => toast.error("Failed to add product!", { duration: 1500 }));
  };

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (error)
    return <p className="text-center text-red-600 py-10">Error: {error}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products && products.length > 0 ? (
        products.map((product, index) => (
          <div
            key={product._id}
            className="bg-white rounded-lg shadow-md overflow-hidden group flex flex-col h-full"
            onMouseLeave={() => setHoveredImage({})}
          >
            <Link to={`/product/${product._id}`} className="block flex flex-col flex-1">
              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
                  <span
                    className={`text-white text-xs font-semibold px-2 py-1 rounded-full ${
                      product.tags.includes("NEW")
                        ? "bg-blue-500"
                        : product.tags.includes("BESTSELLER")
                        ? "bg-yellow-500"
                        : product.tags.includes("SALE")
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                  >
                    {product.tags.join(" / ")}
                  </span>
                </div>
              )}
              <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                <img
                  src={
                    hoveredImage[product._id] ||
                    (product.images && product.images.length > 0
                      ? product.images[0].url
                      : "https://cdn-icons-png.flaticon.com/512/4076/4076504.png")
                  }
                  alt={
                    product.images && product.images.length > 0
                      ? product.images[0].altText || product.name
                      : product.name
                  }
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm mb-3 font-semibold text-gray-900 line-clamp-2">{product.name}</h3>

                  {/* Price + Discount */}
                  {!product.hasVariants ? (
                    <>
                      <p className="text-sm text-gray-500 mb-1 line-through">
                        ₹{product.price}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{product.discountPrice}
                        </p>
                        {product.price && product.discountPrice && (
                          <span className="text-white text-xs font-bold bg-red-500 px-2 py-1 rounded-full">
                            {Math.round(
                              ((product.price - product.discountPrice) /
                                product.price) *
                                100
                            )}% OFF
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Multiple Options</p>
                      <p className="text-lg font-bold text-gray-900">
                        From ₹{Math.min(...product.variants.map(v => v.discountPrice || v.price))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Variants Dropdown or Add to Cart */}
            <div className="px-4 pb-4">
              {product.hasVariants ? (
                <div>
                  <button
                    onClick={() => setShowVariants({ ...showVariants, [product._id]: !showVariants[product._id] })}
                    className="w-full bg-teal-600 text-white py-2 px-3 rounded-lg hover:bg-teal-700 transition-colors duration-300 text-sm font-semibold"
                  >
                    {showVariants[product._id] ? "Hide Options" : "View Sizes"}
                  </button>
                  {showVariants[product._id] && (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {product.variants.map((variant, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => handleAddToCart(e, product, variant)}
                          className="w-full text-left p-2.5 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm transition-all duration-200"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800">{variant.label}</span>
                            <span className="font-bold text-gray-900">₹{variant.discountPrice || variant.price}</span>
                          </div>
                          {variant.pricePerUnit && (
                            <span className="text-xs text-gray-600">({variant.pricePerUnit})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className="w-full bg-teal-600 text-white py-2 px-3 rounded-lg hover:bg-teal-700 transition-colors duration-300 text-sm font-semibold"
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        // No products found placeholder
        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 md:p-12 text-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4076/4076504.png"
              alt="No products"
              className="w-24 h-24 mx-auto mb-6 opacity-40"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Products Found
            </h2>
            <p className="text-gray-600 text-base mb-6">
              We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
            </p>
            <Link
              to="/collections/all"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-300 font-semibold"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
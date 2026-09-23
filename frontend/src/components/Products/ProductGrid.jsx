import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
} from "../../redux/slices/cartSlice";
import { addToWishlist, removeFromWishlist } from "../../redux/slices/wishlistSlice";
import { toast } from "sonner";
import { useState } from "react";
import { trackMetaEvent } from "../../lib/meta-pixel";
import {
  Heart,
  Star,
  CheckCircle2,
  Activity,
  ShoppingCart,
  ShieldCheck,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";

// Amazon/Nykaa-style Shimmer Skeleton Card
export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 sm:p-3 flex flex-col h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="bg-gray-100 rounded-lg aspect-square w-full relative overflow-hidden" />

      {/* Content Skeleton */}
      <div className="mt-2.5 flex flex-col flex-1">
        {/* Brand */}
        <div className="h-2.5 bg-gray-100 rounded-full w-20 mb-1.5" />

        {/* Title */}
        <div className="h-3.5 bg-gray-100 rounded-md w-full mb-1" />
        <div className="h-3.5 bg-gray-100 rounded-md w-3/4 mb-2" />

        {/* Rating & Category */}
        <div className="h-3 bg-gray-100 rounded-full w-24 mb-2" />

        {/* Wellness Goal Tag */}
        <div className="h-4.5 bg-gray-100 rounded w-20 mb-2" />

        {/* Price & Button */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <div className="flex flex-col gap-0.5">
            <div className="h-4 bg-gray-100 rounded w-14" />
            <div className="h-2.5 bg-gray-100 rounded w-8" />
          </div>
          <div className="h-7 w-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onProductClick }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const guestId = useSelector((state) => state.auth.guestId);
  const wishlistItems = useSelector((state) => state.wishlist?.products || []);
  const cart = useSelector((state) => state.cart?.cart || state.cart);
  const cartProducts = cart?.products || [];

  const [hoveredImage, setHoveredImage] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Find if product is already in cart
  const cartItem = cartProducts.find((item) => {
    const itemId = item.productId?._id || item.productId || item._id;
    return itemId === product._id;
  });
  const cartQuantity = cartItem?.quantity || 0;

  const isWishlisted = wishlistItems.some(
    (item) => (item._id || item.productId || item) === product._id
  );

  const handleAddToCart = async (e, prod, variant = null) => {
    e.preventDefault();
    e.stopPropagation();

    if (!prod?._id) {
      toast.error("Product ID not available");
      return;
    }

    setIsUpdating(true);

    try {
      const result = await dispatch(
        addToCart({
          productId: prod._id,
          quantity: 1,
          size: null,
          color: null,
          guestId,
          userId: user?._id,
          variant: variant
            ? {
                label: variant.label,
                price: variant.discountPrice || variant.price,
              }
            : null,
        })
      );

      if (result?.error) {
        throw new Error(
          result.error.message || "Failed to add product to cart"
        );
      }

      // Meta Pixel - AddToCart
      const itemPrice = Number(
        (variant
          ? variant.discountPrice || variant.price
          : null) ||
          prod.discountPrice ||
          prod.price ||
          0
      );

      trackMetaEvent("AddToCart", {
        content_ids: [prod._id],
        content_name: prod.name,
        content_type: "product",
        value: itemPrice,
        currency: "INR",
        quantity: 1,
      });

      toast.success("Product added to cart!", { duration: 1500 });
    } catch (cartError) {
      console.error("ProductGrid AddToCart error:", cartError);
      toast.error(cartError?.message || "Failed to add product!", {
        duration: 1500,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const nextQty = (cartItem?.quantity || 1) + 1;
      const result = await dispatch(
        updateCartItemQuantity({
          productId: product._id,
          quantity: nextQty,
          guestId,
          userId: user?._id,
          size: cartItem?.size || null,
          color: cartItem?.color || null,
        })
      );

      if (result?.error) {
        throw new Error(result.error.message || "Failed to update quantity");
      }
    } catch (err) {
      console.error("Increment error:", err);
      toast.error(err?.message || "Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const currentQty = cartItem?.quantity || 1;
      if (currentQty <= 1) {
        const result = await dispatch(
          removeFromCart({
            productId: product._id,
            guestId,
            userId: user?._id,
            size: cartItem?.size || null,
            color: cartItem?.color || null,
          })
        );

        if (result?.error) {
          throw new Error(result.error.message || "Failed to remove item");
        }
        toast.info("Removed from cart", { duration: 1200 });
      } else {
        const nextQty = currentQty - 1;
        const result = await dispatch(
          updateCartItemQuantity({
            productId: product._id,
            quantity: nextQty,
            guestId,
            userId: user?._id,
            size: cartItem?.size || null,
            color: cartItem?.color || null,
          })
        );

        if (result?.error) {
          throw new Error(result.error.message || "Failed to update quantity");
        }
      }
    } catch (err) {
      console.error("Decrement error:", err);
      toast.error(err?.message || "Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWishlistToggle = async (e, prod) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please log in to save items to your wishlist");
      return;
    }

    try {
      if (isWishlisted) {
        const result = await dispatch(
          removeFromWishlist({ productId: prod._id, user })
        );
        if (result?.error) {
          throw new Error(result.error.message || "Failed to remove from wishlist");
        }
        toast.info("Removed from Wishlist");
      } else {
        const result = await dispatch(
          addToWishlist({ product: prod, user })
        );
        if (result?.error) {
          throw new Error(result.error.message || "Failed to add to wishlist");
        }

        // Meta Pixel - AddToWishlist
        trackMetaEvent("AddToWishlist", {
          content_ids: [prod._id],
          content_name: prod.name,
          content_type: "product",
          value: Number(prod.discountPrice || prod.price || 0),
          currency: "INR",
        });

        toast.success("Added to Wishlist");
      }
    } catch (wishlistError) {
      console.error("Wishlist error:", wishlistError);
      toast.error(wishlistError?.message || "Wishlist update failed");
    }
  };

  const primaryImage =
    (product.images && product.images.length > 0 && product.images[0]?.url) ||
    "https://cdn-icons-png.flaticon.com/512/4076/4076504.png";

  const secondaryImage =
    product.images && product.images.length > 1 && product.images[1]?.url
      ? product.images[1].url
      : null;

  const currentImage = hoveredImage || primaryImage;

  const discountPercentage =
    product.price && product.discountPrice && product.price > product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : null;

  const rawRating = typeof product.rating === "number" ? product.rating : 0;
  const ratingValue = rawRating > 0 ? Number(rawRating).toFixed(1) : "0.0";
  const numReviewsValue = typeof product.numReviews === "number" ? product.numReviews : 0;
  const productUrl = `/product/${product.slug || product._id}`;

  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-[0_1px_6px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full overflow-hidden group"
      onMouseEnter={() => secondaryImage && setHoveredImage(secondaryImage)}
      onMouseLeave={() => setHoveredImage(null)}
    >
      {/* Top Image Section */}
      <div className="relative aspect-square w-full bg-[#f8f8f6] p-2.5 sm:p-3 flex items-center justify-center overflow-hidden border-b border-gray-100/60">
        <Link
          to={productUrl}
          onClick={() => onProductClick && onProductClick()}
          className="w-full h-full flex items-center justify-center relative"
        >
          {/* Skeleton Placeholder until loaded */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg" />
          )}

          <img
            src={currentImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-contain drop-shadow-xs transition-transform duration-300 ease-out group-hover:scale-105 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </Link>

        {/* Bestseller Badge */}
        {(product.tags?.includes("BESTSELLER") || product.countInStock > 100) && (
          <div className="absolute top-2 left-2 bg-[#1e4620] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs z-10 pointer-events-none">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>BESTSELLER</span>
          </div>
        )}

        {/* Discount Badge */}
        {discountPercentage && (
          <div
            className={`absolute ${
              product.tags?.includes("BESTSELLER") || product.countInStock > 100
                ? "bottom-2 left-2"
                : "top-2 left-2"
            } bg-amber-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs z-10 pointer-events-none`}
          >
            {discountPercentage}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => handleWishlistToggle(e, product)}
          aria-label="Add to wishlist"
          className={`absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-xs border border-gray-100 flex items-center justify-center transition-all duration-150 z-10 ${
            isWishlisted
              ? "text-red-500"
              : "text-gray-400 hover:text-red-500 hover:scale-110 active:scale-95"
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isWishlisted ? "fill-red-500 text-red-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Card Content Section */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1">
        <Link
          to={productUrl}
          onClick={() => onProductClick && onProductClick()}
          className="flex flex-col flex-1"
        >
          {/* Brand Row */}
          <div className="flex items-center gap-1 text-[#1e4620] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-0.5">
            <span className="truncate max-w-[130px] sm:max-w-[150px]">
              {product.brand || "Metafit"}
            </span>
            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1e4620] flex-shrink-0" />
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-[13px] font-semibold text-gray-900 leading-tight line-clamp-2 mb-1 group-hover:text-[#1e4620] transition-colors">
            {product.name}
          </h3>

          {/* Rating & Category Row */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-500 mb-1.5 flex-wrap">
            {rawRating > 0 && numReviewsValue > 0 && (
              <>
                <div className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-900 border border-amber-200/60 px-1 py-0.2 rounded font-semibold text-[10px]">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{ratingValue}</span>
                </div>
                <span className="text-gray-400 font-normal">({numReviewsValue})</span>
                <span className="text-gray-300">·</span>
              </>
            )}
            <span className="text-gray-500 capitalize truncate max-w-[130px] sm:max-w-[160px]">
              {product.category || "Wellness"}
            </span>
          </div>

          {/* Wellness Goal Pill */}
          <div className="mb-2">
            {product.wellnessGoal && product.wellnessGoal.length > 0 ? (
              <span className="inline-flex items-center gap-1 bg-[#eef7f0] text-[#1e4620] px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium border border-[#d8ecd9] max-w-full truncate">
                <Activity className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{product.wellnessGoal[0]}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-[#eef7f0] text-[#1e4620] px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium border border-[#d8ecd9]">
                <Activity className="w-2.5 h-2.5 flex-shrink-0" />
                <span>Wellness</span>
              </span>
            )}
          </div>
        </Link>

        {/* Price & Add to Cart Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-1.5 mt-auto">
          {/* Price */}
          <div className="flex flex-col">
            <span className="text-sm sm:text-[15px] font-bold text-gray-900 leading-none">
              ₹{product.discountPrice || product.price}
            </span>
            {product.discountPrice && product.price > product.discountPrice && (
              <span className="text-[10px] sm:text-[11px] text-gray-400 line-through font-normal mt-0.5">
                ₹{product.price}
              </span>
            )}
          </div>

          {/* Add to Cart / Quantity Controller Button */}
          {cartQuantity > 0 ? (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex items-center bg-[#1e4620] text-white rounded-lg shadow-xs overflow-hidden flex-shrink-0"
            >
              <button
                type="button"
                onClick={handleDecrement}
                disabled={isUpdating}
                className="w-6 sm:w-7 h-6 sm:h-7 flex items-center justify-center hover:bg-[#153216] active:bg-[#0f2410] transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3 stroke-[2.5]" />
              </button>
              <span className="min-w-[20px] sm:min-w-[24px] text-center font-bold text-[11px] sm:text-xs select-none">
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                ) : (
                  cartQuantity
                )}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={isUpdating}
                className="w-6 sm:w-7 h-6 sm:h-7 flex items-center justify-center hover:bg-[#153216] active:bg-[#0f2410] transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) =>
                handleAddToCart(
                  e,
                  product,
                  product.hasVariants ? product.variants?.[0] : null
                )
              }
              disabled={isUpdating}
              className="bg-[#1e4620] hover:bg-[#153216] active:scale-95 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-semibold shadow-xs hover:shadow transition-all disabled:opacity-50 flex-shrink-0 cursor-pointer"
            >
              {isUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3" />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductGrid = ({
  products,
  loading,
  loadingMore,
  error,
  onProductClick,
  gridClassName = "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4.5",
}) => {
  // Show initial skeletons when loading and no products are rendered yet
  if (loading && (!products || products.length === 0)) {
    return (
      <div className={gridClassName}>
        {[...Array(12)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error && (!products || products.length === 0)) {
    return <p className="text-center text-red-600 py-10">Error: {error}</p>;
  }

  return (
    <div>
      <div className={gridClassName}>
        {products && products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onProductClick={onProductClick}
            />
          ))
        ) : (
          <div className="col-span-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-2xl mx-auto">
              <ShieldCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                No Products Found
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                We couldn't find any products matching your criteria. Try
                adjusting your filters.
              </p>
              <Link
                to="/collections/all"
                className="inline-block px-5 py-2.5 bg-[#1e4620] text-white rounded-xl hover:bg-[#153216] transition-colors font-semibold text-sm shadow-sm"
              >
                Browse All Products
              </Link>
            </div>
          </div>
        )}

        {/* Loading More Skeletons appended seamlessly at bottom */}
        {loadingMore && (
          <>
            {[...Array(5)].map((_, i) => (
              <ProductSkeleton key={`loading-more-${i}`} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export { ProductCard };
export default ProductGrid;
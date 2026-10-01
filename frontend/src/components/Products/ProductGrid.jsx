import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "../../redux/slices/wishlistSlice";
import { toggleCompare } from "../../redux/slices/compareSlice";
import { toast } from "sonner";
import { useState } from "react";
import { trackMetaEvent } from "../../lib/meta-pixel";
import {
  Heart,
  ShieldCheck,
  ArrowLeftRight,
  Star,
} from "lucide-react";

// Clean borderless Shimmer Skeleton Card
export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-lg p-2 flex flex-col h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="bg-gray-100 rounded-lg aspect-square w-full relative overflow-hidden mb-2.5" />

      {/* Content Skeleton */}
      <div className="flex flex-col flex-1 px-0.5">
        {/* Title */}
        <div className="h-3.5 bg-gray-100 rounded-md w-full mb-1.5" />
        <div className="h-3.5 bg-gray-100 rounded-md w-3/4 mb-3" />

        {/* Price & MRP Skeleton */}
        <div className="mt-auto flex flex-col gap-1">
          <div className="h-4 bg-gray-100 rounded w-16" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onProductClick }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const wishlistItems = useSelector((state) => state.wishlist?.products || []);
  const compareItems = useSelector((state) => state.compare?.items || []);

  const [hoveredImage, setHoveredImage] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isWishlisted = wishlistItems.some(
    (item) => (item._id || item.productId || item) === product._id
  );

  const isCompared = compareItems.some((item) => item._id === product._id);

  const isBestseller = Boolean(
    product.isBestSeller ||
    product.tags?.includes("BESTSELLER") ||
    Number(product.soldCount || 0) >= 50 ||
    Number(product.totalSold || 0) >= 50
  );

  const handleCompareToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleCompare(product));
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

  const sellingPrice = Number(product.discountPrice || product.price || 0);
  const mrpPrice = Number(product.price || 0);
  const hasMrp = Boolean(product.discountPrice && mrpPrice > sellingPrice);

  const discountPercentage = hasMrp
    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
    : null;

  const productUrl = `/product/${product.slug || product._id}`;

  return (
    <div
      className="group flex flex-col h-full bg-white transition-all duration-200 cursor-pointer relative hover:-translate-y-0.5"
      onMouseEnter={() => secondaryImage && setHoveredImage(secondaryImage)}
      onMouseLeave={() => setHoveredImage(null)}
    >
      <Link
        to={productUrl}
        onClick={() => onProductClick && onProductClick()}
        className="flex flex-col flex-1 h-full w-full"
      >
        {/* PRODUCT IMAGE */}
        <div className="relative aspect-square w-full bg-[#f8f9fa] rounded-xl overflow-hidden flex items-center justify-center p-3 mb-2.5">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-xl" />
          )}

          <img
            src={currentImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-contain drop-shadow-2xs transition-transform duration-300 ease-out group-hover:scale-105 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Bestseller Ribbon */}
          {isBestseller && (
            <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden z-20 pointer-events-none rounded-tl-xl">
              <div className="absolute top-[15px] -left-[30px] w-[112px] -rotate-45 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 text-stone-950 font-extrabold text-[8px] sm:text-[8.5px] tracking-wider uppercase py-0.5 text-center shadow-[0_2px_4px_rgba(0,0,0,0.2)] flex items-center justify-center gap-0.5 border-y border-amber-200/70">
                <Star className="w-2 h-2 fill-stone-950 text-stone-950" />
                <span>BESTSELLER</span>
              </div>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => handleWishlistToggle(e, product)}
            aria-label="Add to wishlist"
            className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center transition-all duration-150 z-10 ${
              isWishlisted
                ? "text-[#D4A017]"
                : "text-gray-400 hover:text-[#D4A017] hover:scale-110 active:scale-95"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isWishlisted ? "fill-[#D4A017] text-[#D4A017]" : ""
              }`}
            />
          </button>

          {/* Compare Button */}
          <button
            type="button"
            onClick={handleCompareToggle}
            aria-label="Compare product"
            title={isCompared ? "In Comparison (Click to remove)" : "Add to Compare"}
            className={`absolute top-10 right-2 w-7 h-7 rounded-full backdrop-blur-xs shadow-xs flex items-center justify-center transition-all duration-150 z-10 ${
              isCompared
                ? "bg-[#D4A017] text-[#3A0610] shadow-[#D4A017]/30 scale-105 opacity-100 font-bold"
                : "bg-white/90 text-gray-400 hover:text-[#D4A017] opacity-90 sm:opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
            }`}
          >
            <ArrowLeftRight className="w-3 h-3 stroke-[2.2]" />
          </button>
        </div>

        {/* PRODUCT DETAILS AREA */}
        <div className="flex flex-col flex-1 px-0.5 pb-1">
          {/* PRODUCT NAME */}
          <h3 className="text-xs sm:text-[13px] font-medium text-gray-800 leading-snug line-clamp-2 mb-2 group-hover:text-[#7A1522] transition-colors">
            {product.name}
          </h3>

          {/* PRICES HIERARCHY */}
          <div className="mt-auto flex flex-col gap-0.5">
            {/* SELLING PRICE */}
            <span className="text-sm sm:text-base font-bold text-[#650B18]">
              ₹{sellingPrice.toLocaleString()}
            </span>

            {/* MRP & DISCOUNT ROW */}
            {hasMrp && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-gray-400 line-through font-normal">
                  M.R.P. ₹{mrpPrice.toLocaleString()}
                </span>
                {discountPercentage && (
                  <span className="font-bold text-[#D4A017]">
                    {discountPercentage}% off
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

const ProductGrid = ({
  products,
  loading,
  loadingMore,
  error,
  onProductClick,
  gridClassName = "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-6 sm:gap-x-5 sm:gap-y-7",
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
            <div className="bg-white rounded-2xl p-12 text-center max-w-2xl mx-auto">
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
                className="inline-block px-5 py-2.5 bg-[#022824] text-white rounded-xl hover:bg-[#046559] transition-colors font-semibold text-sm shadow-sm"
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
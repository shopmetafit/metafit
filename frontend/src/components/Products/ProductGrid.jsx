import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";
import { addToWishlist } from "../../redux/slices/wishlistSlice";
import { toast } from "sonner";
import { useState } from "react";
import {
  Heart,
  Star,
  CheckCircle2,
  Leaf,
  Eye,
  Activity,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Award
} from "lucide-react";

const ProductGrid = ({ products, loading, error, onProductClick }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const guestId = useSelector((state) => state.auth.guestId);
  const [hoveredImage, setHoveredImage] = useState({});
  const [addingId, setAddingId] = useState(null);

  const handleAddToCart = (e, product, variant = null) => {
    e.preventDefault();
    setAddingId(product._id);
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
      .catch(() => toast.error("Failed to add product!", { duration: 1500 }))
      .finally(() => setAddingId(null));
  };

  const handleAddToWishlist = (e, product) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to save items to your wishlist");
      return;
    }
    dispatch(addToWishlist({ product, user }));
    toast.success("Added to Wishlist");
  };

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (error)
    return <p className="text-center text-red-600 py-10">Error: {error}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products && products.length > 0 ? (
        products.map((product) => {
          const imageSrc = hoveredImage[product._id] ||
            (product.images && product.images.length > 0
              ? product.images[0].url
              : "https://cdn-icons-png.flaticon.com/512/4076/4076504.png");

          return (
            <div
              key={product._id}
              className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-3 flex flex-col h-full relative group transition-shadow hover:shadow-md"
              onMouseEnter={() => {
                if (product.images?.length > 1) {
                  setHoveredImage({ [product._id]: product.images[1].url });
                }
              }}
              onMouseLeave={() => setHoveredImage({})}
            >
              <Link to={`/product/${product._id}`} className="flex flex-col flex-1" onClick={() => onProductClick && onProductClick()}>
                {/* Image Section */}
                <div className="bg-[#fcf8f2] rounded-[20px] aspect-[4/3] w-full relative overflow-hidden flex items-center justify-center group-hover:bg-[#f6f0e6] transition-colors">

                  {/* Background Blurred Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110 group-hover:opacity-50 transition-opacity z-0"
                    style={{ backgroundImage: `url(${imageSrc})` }}
                  ></div>

                  {/* BESTSELLER Tag */}
                  {(product.tags?.includes("BESTSELLER") || product.countInStock > 100) && (
                    <div className="absolute top-3 left-3 bg-[#1e4620] text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 z-10 shadow-sm">
                      <Star className="w-3 h-3 fill-current" /> BESTSELLER
                    </div>
                  )}

                  {/* Wishlist */}
                  <button
                    onClick={(e) => handleAddToWishlist(e, product)}
                    className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-sm z-10 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                  </button>

                  {/* Discount Ribbon */}
                  {product.price && product.discountPrice && (
                    <div
                      className="absolute top-12 right-1 bg-[#e8cd98] text-[#5c4923] font-bold text-center leading-tight px-2 py-1.5 z-10 shadow-sm"
                      style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)' }}
                    >
                      <div className="text-[11px] leading-tight">{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%</div>
                      <div className="text-[8px] leading-tight">OFF</div>
                    </div>
                  )}

                  <img
                    src={imageSrc}
                    alt={product.name}
                    className="w-full h-full object-contain p-6 relative z-0 mix-blend-multiply drop-shadow-lg transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Content Section */}
                <div className="mt-4 flex flex-col flex-1 px-1.5">

                  {/* Brand */}
                  <div className="flex items-center gap-1 mb-1 text-[#1e4620]">
                    <span className="text-xs font-semibold">{product.brand || "Metafit Wellness"}</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-serif text-gray-900 leading-tight mb-1">{product.name}</h3>

                  {/* Subtitle */}
                  <p className="text-[13px] text-gray-500 mb-2 capitalize">
                    {product.category || 'Nutrition'} {product.subCategory && <><span className="mx-1 text-gray-300">|</span> {product.subCategory}</>}
                  </p>

                  {/* Ratings */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#f5a623] text-[#f5a623]" />
                    ))}
                    <span className="text-sm font-bold text-gray-900 ml-1">4.8</span>
                    <span className="text-[11px] text-gray-500 font-medium">(326 Reviews)</span>
                  </div>

                  {/* Tags (Wellness Goals) */}
                  {(product.wellnessGoal && product.wellnessGoal.length > 0) ? (
                    <div className="inline-flex items-center gap-2 bg-[#eef7f0] text-[#1e4620] px-3 py-1.5 rounded-lg mb-3 text-[11px] font-bold w-fit">
                      <Activity className="w-3.5 h-3.5" />
                      {product.wellnessGoal.slice(0, 2).join(" • ")}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-[#eef7f0] text-[#1e4620] px-3 py-1.5 rounded-lg mb-3 text-[11px] font-bold w-fit">
                      <Activity className="w-3.5 h-3.5" /> General Wellness
                    </div>
                  )}


                  {/* Price & Add to Cart */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-auto pt-3 border-t border-gray-100">
                    <div className="flex flex-col items-start">
                      <span className="text-[24px] font-serif text-gray-900 leading-none">
                        ₹{product.discountPrice || product.price}
                      </span>
                      {product.discountPrice && (
                        <span className="text-[12px] font-medium text-gray-400 line-through mt-1.5">₹{product.price}</span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(e, product, product.hasVariants ? product.variants[0] : null)}
                      disabled={addingId === product._id}
                      className="bg-[#1e4620] text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold hover:bg-[#153216] transition-colors shadow-sm disabled:bg-gray-400 w-full sm:w-auto flex-shrink-0"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {addingId === product._id ? "..." : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          );
        })
      ) : (
        <div className="col-span-full">
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-12 text-center max-w-2xl mx-auto">
            <ShieldCheck className="w-20 h-20 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-serif text-gray-900 mb-2">No Products Found</h2>
            <p className="text-gray-500 text-sm mb-6">We couldn't find any products matching your criteria. Try adjusting your filters.</p>
            <Link to="/collections/all" className="inline-block px-6 py-3 bg-[#1e4620] text-white rounded-xl hover:bg-[#153216] transition-colors font-semibold shadow-md">
              Browse All Products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;

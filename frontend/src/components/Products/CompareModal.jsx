import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  removeFromCompare,
  clearCompare,
  closeCompareModal,
} from "../../redux/slices/compareSlice";
import { addToCart, openCartDrawer } from "../../redux/slices/cartSlice";
import { trackMetaEvent } from "../../lib/meta-pixel";
import { toast } from "sonner";
import {
  X,
  ArrowLeftRight,
  Sparkles,
  Star,
  CheckCircle2,
  ShoppingCart,
  TrendingDown,
  Layers,
  Truck,
  Globe2,
  Factory,
  ExternalLink,
  Tag,
  Boxes,
  Plus,
  SlidersHorizontal,
} from "lucide-react";

const CompareModal = () => {
  const dispatch = useDispatch();
  const { items, isCompareModalOpen } = useSelector(
    (state) => state.compare || { items: [], isCompareModalOpen: false }
  );
  const { user, guestId } = useSelector((state) => state.auth || {});
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [addingId, setAddingId] = useState(null);

  // Close modal when Escape key is pressed
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isCompareModalOpen) {
        dispatch(closeCompareModal());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCompareModalOpen, dispatch]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isCompareModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCompareModalOpen]);

  // Exact real-world calculations
  const {
    lowestPriceId,
    highestPrice,
    lowestPrice,
    highestDiscountId,
    highestRatedId,
  } = useMemo(() => {
    if (!items || items.length === 0) return {};

    let minP = Infinity;
    let minId = null;
    let maxP = -Infinity;
    let maxDisc = -1;
    let maxDiscId = null;
    let maxRating = -1;
    let maxRatingId = null;

    items.forEach((p) => {
      const price = Number(p.discountPrice || p.price || 0);
      const original = Number(p.price || 0);
      const discountPct = original > price ? Math.round(((original - price) / original) * 100) : 0;
      const rating = Number(p.rating || 0);

      if (price > 0 && price < minP) {
        minP = price;
        minId = p._id;
      }
      if (price > maxP) {
        maxP = price;
      }
      if (discountPct > maxDisc && discountPct > 0) {
        maxDisc = discountPct;
        maxDiscId = p._id;
      }
      if (rating > maxRating && rating > 0) {
        maxRating = rating;
        maxRatingId = p._id;
      }
    });

    return {
      lowestPriceId: items.length > 1 ? minId : null,
      lowestPrice: minP !== Infinity ? minP : 0,
      highestPrice: maxP !== -Infinity ? maxP : 0,
      highestDiscountId: items.length > 1 ? maxDiscId : null,
      highestRatedId: items.length > 1 ? maxRatingId : null,
    };
  }, [items]);

  const uniqueCategories = useMemo(() => {
    if (!items || items.length === 0) return [];
    return Array.from(new Set(items.map((p) => (p.category || "General").trim()).filter(Boolean)));
  }, [items]);

  const categoryDisplay = useMemo(() => {
    if (!items || items.length === 0) return "";
    if (uniqueCategories.length === 1) {
      return `Category: ${uniqueCategories[0]}`;
    }
    return `Category: ${uniqueCategories.length} categories`;
  }, [items, uniqueCategories]);

  const handleAddToCartDirect = async (product) => {
    if (!product?._id) return;
    setAddingId(product._id);

    try {
      const result = await dispatch(
        addToCart({
          productId: product._id,
          quantity: 1,
          size: null,
          color: null,
          guestId,
          userId: user?._id,
          variant: null,
        })
      );

      if (result?.error) {
        throw new Error(result.error.message || "Failed to add to cart");
      }

      const itemPrice = Number(product.discountPrice || product.price || 0);
      trackMetaEvent("AddToCart", {
        content_ids: [product._id],
        content_name: product.name,
        content_type: "product",
        value: itemPrice,
        currency: "INR",
        quantity: 1,
      });

      toast.success(`"${product.name.slice(0, 22)}..." added to cart`);
      dispatch(openCartDrawer());
    } catch (err) {
      toast.error(err.message || "Could not add to cart");
    } finally {
      setAddingId(null);
    }
  };

  if (!isCompareModalOpen || !items || items.length === 0) {
    return null;
  }

  // Comparison Rows
  const candidateRows = [
    {
      id: "price",
      label: "Selling Price",
      icon: <TrendingDown className="w-4 h-4 text-emerald-600" />,
      hasData: () => true,
      getValue: (p) => Number(p.discountPrice || p.price || 0),
      render: (p) => {
        const finalPrice = Number(p.discountPrice || p.price || 0);
        const originalPrice = Number(p.price || 0);
        const isLowest = p._id === lowestPriceId && items.length > 1;
        const priceDiff = highestPrice - finalPrice;

        return (
          <div className="space-y-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-stone-900">
                ₹{finalPrice.toLocaleString("en-IN")}
              </span>
              {originalPrice > finalPrice && (
                <span className="text-xs text-stone-400 line-through">
                  M.R.P. ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {isLowest && priceDiff > 0 && (
              <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                <span>₹{priceDiff.toLocaleString("en-IN")} Cheaper</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "discount",
      label: "Discount & Savings",
      icon: <Tag className="w-4 h-4 text-amber-500" />,
      hasData: (prods) => prods.some((p) => p.price > (p.discountPrice || p.price)),
      getValue: (p) => {
        const orig = Number(p.price || 0);
        const disc = Number(p.discountPrice || orig);
        return orig > disc ? Math.round(((orig - disc) / orig) * 100) : 0;
      },
      render: (p) => {
        const orig = Number(p.price || 0);
        const finalP = Number(p.discountPrice || orig);
        const savings = orig - finalP;
        const discountPct = orig > finalP ? Math.round((savings / orig) * 100) : 0;
        const isBestDiscount = p._id === highestDiscountId && discountPct > 0;

        if (savings <= 0) {
          return <span className="text-xs text-stone-400 font-medium">Regular Price</span>;
        }

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-emerald-50 text-[#1e4620] border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-md">
                {discountPct}% OFF
              </span>
              <span className="text-xs text-emerald-700 font-bold">
                (Save ₹{savings.toLocaleString("en-IN")})
              </span>
            </div>
            {isBestDiscount && items.length > 1 && (
              <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                ★ Best Savings
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "rating",
      label: "Customer Rating",
      icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />,
      hasData: (prods) => prods.some((p) => Number(p.rating || 0) > 0 || Number(p.numReviews || 0) > 0),
      getValue: (p) => Number(p.rating || 0),
      render: (p) => {
        const rating = Number(p.rating || 0);
        const reviews = Number(p.numReviews || 0);
        const isTop = p._id === highestRatedId && rating > 0 && items.length > 1;

        if (rating === 0 && reviews === 0) {
          return <span className="text-xs text-stone-400 italic">No reviews yet</span>;
        }

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="text-xs font-bold text-amber-950">{rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-stone-500">
                ({reviews} {reviews === 1 ? "review" : "reviews"})
              </span>
            </div>
            {isTop && (
              <span className="text-[10px] font-bold text-[#1e4620] block">
                ✓ Highest Rated
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "wellnessGoal",
      label: "Target Health Benefits",
      icon: <Sparkles className="w-4 h-4 text-teal-600" />,
      hasData: (prods) => prods.some((p) => Array.isArray(p.wellnessGoal) && p.wellnessGoal.length > 0),
      getValue: (p) => (Array.isArray(p.wellnessGoal) ? p.wellnessGoal.join(",") : ""),
      render: (p) => {
        const goals = Array.isArray(p.wellnessGoal) ? p.wellnessGoal : [];
        if (goals.length === 0) {
          return <span className="text-xs text-stone-400 italic">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {goals.slice(0, 6).map((g, idx) => (
              <span
                key={idx}
                className="bg-teal-50 text-teal-900 border border-teal-200/80 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              >
                {g}
              </span>
            ))}
            {goals.length > 6 && (
              <span className="text-[10px] text-teal-700 font-bold self-center">
                +{goals.length - 6} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "category",
      label: "Category",
      icon: <Layers className="w-4 h-4 text-emerald-600" />,
      hasData: (prods) => prods.some((p) => p.category && p.category.trim()),
      getValue: (p) => p.category || "",
      render: (p) => (
        <span className="text-xs font-semibold text-stone-800">
          {p.category || <span className="text-stone-400 font-normal italic">—</span>}
        </span>
      ),
    },
    {
      id: "subCategory",
      label: "Sub-Category / Type",
      icon: <Layers className="w-4 h-4 text-sky-600" />,
      hasData: (prods) => prods.some((p) => p.subCategory && p.subCategory.trim()),
      getValue: (p) => p.subCategory || "",
      render: (p) => (
        <span className="text-xs font-semibold text-stone-800">
          {p.subCategory || <span className="text-stone-400 font-normal italic">—</span>}
        </span>
      ),
    },
    {
      id: "shipping",
      label: "Delivery & Shipping Cost",
      icon: <Truck className="w-4 h-4 text-blue-600" />,
      hasData: (prods) => prods.some((p) => p.shippingCharge !== undefined),
      getValue: (p) => Number(p.shippingCharge || 0),
      render: (p) => {
        const charge = Number(p.shippingCharge || 0);
        if (charge === 0) {
          return (
            <span className="text-xs font-bold text-[#1e4620] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
              FREE Delivery
            </span>
          );
        }
        return (
          <span className="text-xs font-semibold text-stone-800">
            ₹{charge} Shipping Charge
          </span>
        );
      },
    },
    {
      id: "origin",
      label: "Country of Origin",
      icon: <Globe2 className="w-4 h-4 text-stone-600" />,
      hasData: (prods) => prods.some((p) => p.countryOfOrigin && p.countryOfOrigin.trim()),
      getValue: (p) => p.countryOfOrigin || "",
      render: (p) => (
        <span className="text-xs font-medium text-stone-700">
          {p.countryOfOrigin || <span className="text-stone-400 italic">—</span>}
        </span>
      ),
    },
    {
      id: "manufacturer",
      label: "Manufacturer / Brand",
      icon: <Factory className="w-4 h-4 text-stone-600" />,
      hasData: (prods) => prods.some((p) => (p.manufacturer && p.manufacturer.trim()) || p.brand),
      getValue: (p) => p.manufacturer || p.brand || "",
      render: (p) => (
        <span className="text-xs font-semibold text-stone-800">
          {p.manufacturer || p.brand || <span className="text-stone-400 italic">—</span>}
        </span>
      ),
    },
    {
      id: "stock",
      label: "Availability & Stock",
      icon: <Boxes className="w-4 h-4 text-teal-700" />,
      hasData: () => true,
      getValue: (p) => (Number(p.countInStock || 0) > 0 ? "in-stock" : "out-of-stock"),
      render: (p) => {
        const stock = Number(p.countInStock || 0);
        if (stock <= 0) {
          return (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md inline-block">
              Out of Stock
            </span>
          );
        }
        if (stock <= 5) {
          return (
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
              Only {stock} Left
            </span>
          );
        }
        return (
          <span className="text-xs font-bold text-[#1e4620] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
            In Stock
          </span>
        );
      },
    },
  ];

  const activeRows = candidateRows.filter((r) => r.hasData(items));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-1.5 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch(closeCompareModal())}
          className="absolute inset-0 bg-stone-950/75 backdrop-blur-sm"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-[calc(100vw-16px)] md:w-full max-w-[1400px] h-[95dvh] md:h-[90vh] max-h-[92vh] bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-stone-200/80 flex flex-col overflow-hidden z-[2100] mx-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-3.5 sm:px-6 py-2 sm:py-2.5 border-b border-stone-200/80 bg-gradient-to-r from-stone-50 via-emerald-50/20 to-stone-50 flex-wrap gap-2 flex-shrink-0">
            {/* Left Title & Subtitle */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#1e4620] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">
                    Product Comparison
                  </h2>
                  <span className="bg-emerald-100/90 text-[#1e4620] border border-emerald-200/80 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length} of 4 Products
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-stone-500 font-medium">
                  Compare products side-by-side
                  {categoryDisplay && (
                    <span className="text-stone-400 font-normal"> • {categoryDisplay}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
              {items.length > 1 && (
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer bg-white px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg border border-stone-200/80 hover:bg-stone-50 transition-colors shadow-2xs">
                  <input
                    type="checkbox"
                    checked={highlightDifferences}
                    onChange={(e) => setHighlightDifferences(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#1e4620] accent-[#1e4620] cursor-pointer"
                  />
                  <span className="hidden sm:inline">Show Differences Only</span>
                  <span className="sm:hidden text-[10px]">Differences</span>
                </label>
              )}

              <button
                type="button"
                onClick={() => dispatch(clearCompare())}
                className="text-stone-500 hover:text-rose-600 text-xs font-semibold px-2 py-1 transition-colors cursor-pointer"
                title="Clear all compared items"
                aria-label="Clear all items from comparison"
              >
                Clear All
              </button>

              <button
                type="button"
                onClick={() => dispatch(closeCompareModal())}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                title="Close comparison modal"
                aria-label="Close comparison modal"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MOBILE DEDICATED LAYOUT (< 768px)                          */}
          {/* ========================================================= */}
          <div className="block md:hidden flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white">
            {/* Top Swipable / Grid Product Header Cards */}
            <div className="p-2 bg-stone-50/60 border-b border-stone-200/80">
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                {items.map((prod) => {
                  const imageSrc =
                    prod.thumbnail ||
                    (prod.images && prod.images[0]?.url) ||
                    (typeof prod.images?.[0] === "string" ? prod.images[0] : null) ||
                    "https://via.placeholder.com/150";

                  const hasOptions =
                    prod.hasVariants ||
                    (Array.isArray(prod.variants) && prod.variants.length > 0) ||
                    (Array.isArray(prod.sizes) && prod.sizes.length > 1);

                  const isOutOfStock = Number(prod.countInStock || 0) <= 0;
                  const finalPrice = Number(prod.discountPrice || prod.price || 0);
                  const originalPrice = Number(prod.price || 0);

                  return (
                    <div
                      key={prod._id}
                      className="w-[140px] min-w-[140px] max-w-[155px] flex-shrink-0 bg-white p-2 rounded-lg border border-stone-200/80 relative flex flex-col justify-between shadow-2xs"
                    >
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => dispatch(removeFromCompare(prod._id))}
                        className="absolute top-1 right-1 w-5 h-5 bg-stone-100 hover:bg-rose-500 hover:text-white text-stone-400 rounded-full flex items-center justify-center transition-all z-10 cursor-pointer"
                        title="Remove product"
                        aria-label={`Remove ${prod.name}`}
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>

                      <div className="flex flex-col items-center text-center">
                        <Link
                          to={`/product/${prod._id}`}
                          onClick={() => dispatch(closeCompareModal())}
                          className="w-16 h-16 rounded-md bg-stone-50 border border-stone-100 p-1 flex items-center justify-center overflow-hidden"
                        >
                          <img
                            src={imageSrc}
                            alt={prod.name}
                            className="w-full h-full object-contain"
                          />
                        </Link>

                        <div className="flex items-center gap-1 text-[9px] font-bold text-[#1e4620] uppercase tracking-wider mt-1">
                          <span className="truncate max-w-[95px]">{prod.brand || "Metafit"}</span>
                          <CheckCircle2 className="w-2.5 h-2.5 text-[#1e4620] flex-shrink-0" />
                        </div>

                        <Link
                          to={`/product/${prod._id}`}
                          onClick={() => dispatch(closeCompareModal())}
                          className="text-[11px] font-bold text-stone-900 line-clamp-2 leading-tight mt-0.5 h-7 flex items-center justify-center text-center"
                          title={prod.name}
                        >
                          {prod.name}
                        </Link>

                        <div className="mt-0.5 flex items-baseline gap-1 justify-center flex-wrap">
                          <span className="text-xs font-black text-stone-900">
                            ₹{finalPrice.toLocaleString("en-IN")}
                          </span>
                          {originalPrice > finalPrice && (
                            <span className="text-[9px] text-stone-400 line-through">
                              ₹{originalPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>

                      {hasOptions ? (
                        <Link
                          to={`/product/${prod._id}`}
                          onClick={() => dispatch(closeCompareModal())}
                          className="w-full mt-1.5 py-1 px-1.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-800 flex items-center justify-center gap-1 border border-stone-200/60 h-7"
                        >
                          <span>Options</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCartDirect(prod)}
                          disabled={addingId === prod._id || isOutOfStock}
                          className={`w-full mt-1.5 py-1 px-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer h-7 ${
                            isOutOfStock
                              ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                              : "bg-[#1e4620] text-white"
                          }`}
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>{addingId === prod._id ? "Adding..." : isOutOfStock ? "Out" : "Add"}</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {items.length < 4 && (
                  <Link
                    to="/collections/all"
                    onClick={() => dispatch(closeCompareModal())}
                    className="w-[140px] min-w-[140px] flex-shrink-0 bg-gradient-to-b from-emerald-50/80 to-white hover:from-emerald-100/70 hover:to-emerald-50 p-2.5 rounded-lg border border-emerald-200/90 hover:border-[#1e4620] flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-2xs group"
                    title="Browse catalog to add product to comparison"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1e4620] text-white flex items-center justify-center mb-1 shadow-xs group-hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-[11px] font-extrabold text-[#1e4620] leading-tight">
                      + Add Product
                    </span>
                    <span className="text-[9px] text-stone-500 font-medium mt-0.5">
                      Up to 4 items
                    </span>
                    <span className="mt-1.5 px-2.5 py-0.5 bg-emerald-100/80 text-[#1e4620] border border-emerald-200 rounded text-[9px] font-extrabold inline-flex items-center gap-0.5 shadow-2xs">
                      Browse
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Stacked Specification Sections */}
            <div className="p-2.5 space-y-2.5">
              {activeRows.map((row) => {
                const values = items.map((p) => String(row.getValue(p)));
                const isDifferent = new Set(values).size > 1;

                if (highlightDifferences && !isDifferent) {
                  return null;
                }

                return (
                  <div
                    key={row.id}
                    className="bg-white rounded-lg border border-stone-200/80 p-2.5 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 pb-1 border-b border-stone-100">
                      <div className="w-4 h-4 rounded bg-stone-100 flex items-center justify-center text-stone-600">
                        {row.icon}
                      </div>
                      <span className="text-xs font-extrabold text-stone-800">{row.label}</span>
                    </div>

                    <div className={`grid gap-1.5 ${items.length === 2 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
                      {items.map((prod) => (
                        <div
                          key={prod._id}
                          className="bg-stone-50/70 p-1.5 rounded-md border border-stone-200/60 text-xs flex flex-col justify-between min-w-0"
                        >
                          <span className="text-[9px] font-bold text-[#1e4620] uppercase truncate mb-0.5 block">
                            {prod.name.slice(0, 16)}...
                          </span>
                          <div className="break-words min-w-0">{row.render(prod)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* DESKTOP DEDICATED LAYOUT (>= 768px)                        */}
          {/* ========================================================= */}
          <div className="hidden md:block flex-1 min-h-0 overflow-x-auto overflow-y-auto bg-white custom-scrollbar">
            <table className="w-full border-collapse min-w-[680px] table-fixed">
              <colgroup>
                <col className="w-48 lg:w-56 bg-stone-50/70" />
                {items.map((prod) => (
                  <col key={prod._id} className="min-w-[180px]" />
                ))}
                {items.length < 4 && <col className="w-44 lg:w-48 min-w-[160px]" />}
              </colgroup>

              <thead className="sticky top-0 z-20 bg-white shadow-xs">
                <tr className="border-b-2 border-stone-200/80">
                  {/* Specification Column Header */}
                  <th className="p-3 text-left align-bottom font-extrabold text-stone-500 uppercase text-[10px] tracking-wider sticky left-0 bg-stone-50/98 z-30 border-r border-stone-200/80 w-48 lg:w-56 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#1e4620]">
                        <SlidersHorizontal className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span>SPECIFICATIONS</span>
                    </div>
                  </th>

                  {/* Selected Product Cards */}
                  {items.map((prod) => {
                    const imageSrc =
                      prod.thumbnail ||
                      (prod.images && prod.images[0]?.url) ||
                      (typeof prod.images?.[0] === "string" ? prod.images[0] : null) ||
                      "https://via.placeholder.com/150";

                    const hasOptions =
                      prod.hasVariants ||
                      (Array.isArray(prod.variants) && prod.variants.length > 0) ||
                      (Array.isArray(prod.sizes) && prod.sizes.length > 1);

                    const isOutOfStock = Number(prod.countInStock || 0) <= 0;
                    const finalPrice = Number(prod.discountPrice || prod.price || 0);
                    const originalPrice = Number(prod.price || 0);
                    const discountPct =
                      originalPrice > finalPrice
                        ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
                        : 0;

                    return (
                      <th
                        key={prod._id}
                        className="p-3 text-left align-top font-normal border-r border-stone-200/60 bg-white relative group"
                      >
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCompare(prod._id))}
                          className="absolute top-2 right-2 w-7 h-7 bg-stone-100 hover:bg-rose-500 hover:text-white text-stone-400 rounded-full flex items-center justify-center transition-all shadow-2xs z-10 cursor-pointer"
                          title="Remove product"
                          aria-label={`Remove ${prod.name} from comparison`}
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                          {/* Product Image */}
                          <Link
                            to={`/product/${prod._id}`}
                            onClick={() => dispatch(closeCompareModal())}
                            className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-stone-50 border border-stone-100 p-1.5 flex items-center justify-center overflow-hidden hover:border-emerald-300 transition-colors group/img"
                          >
                            <img
                              src={imageSrc}
                              alt={prod.name}
                              className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-200"
                            />
                          </Link>

                          {/* Seller / Brand */}
                          <div className="flex items-center gap-1 text-[10px] font-bold text-[#1e4620] uppercase tracking-wider mt-1.5">
                            <span className="truncate max-w-[120px]">{prod.brand || "Metafit"}</span>
                            <CheckCircle2 className="w-3 h-3 text-[#1e4620] flex-shrink-0" />
                          </div>

                          {/* Product Name */}
                          <Link
                            to={`/product/${prod._id}`}
                            onClick={() => dispatch(closeCompareModal())}
                            className="text-xs lg:text-sm font-bold text-stone-900 hover:text-[#1e4620] line-clamp-2 leading-snug transition-colors mt-0.5 h-8 lg:h-9 flex items-center justify-center"
                            title={prod.name}
                          >
                            {prod.name}
                          </Link>

                          {/* Price Header Display */}
                          <div className="mt-1 flex items-baseline gap-1 flex-wrap justify-center">
                            <span className="text-sm lg:text-base font-black text-stone-900">
                              ₹{finalPrice.toLocaleString("en-IN")}
                            </span>
                            {originalPrice > finalPrice && (
                              <span className="text-[11px] text-stone-400 line-through">
                                ₹{originalPrice.toLocaleString("en-IN")}
                              </span>
                            )}
                            {discountPct > 0 && (
                              <span className="text-[9px] font-bold text-[#1e4620] bg-emerald-50 border border-emerald-200/80 px-1 py-0.2 rounded">
                                {discountPct}% OFF
                              </span>
                            )}
                          </div>

                          {/* Add to Cart CTA */}
                          {hasOptions ? (
                            <Link
                              to={`/product/${prod._id}`}
                              onClick={() => dispatch(closeCompareModal())}
                              className="w-full mt-2 py-1.5 px-2.5 h-8 lg:h-9 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center gap-1 transition-colors border border-stone-200/60"
                            >
                              <span>Select Options</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCartDirect(prod)}
                              disabled={addingId === prod._id || isOutOfStock}
                              className={`w-full mt-2 py-1.5 px-2.5 h-8 lg:h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer ${
                                isOutOfStock
                                  ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                                  : "bg-[#1e4620] hover:bg-[#153417] text-white shadow-emerald-900/10"
                              }`}
                              aria-label={`Add ${prod.name} to cart`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>
                                {addingId === prod._id
                                  ? "Adding..."
                                  : isOutOfStock
                                  ? "Out of Stock"
                                  : "Add to Cart"}
                              </span>
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}

                  {/* Add Product Action Column Header */}
                  {items.length < 4 && (
                    <th className="p-3 text-center align-middle border-r border-stone-200/60 bg-stone-50/30 w-44 lg:w-48 min-w-[160px]">
                      <Link
                        to="/collections/all"
                        onClick={() => dispatch(closeCompareModal())}
                        className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-gradient-to-b from-emerald-50/80 to-white hover:from-emerald-100/70 hover:to-emerald-50 border border-emerald-200/90 hover:border-[#1e4620] text-center transition-all cursor-pointer group shadow-2xs hover:shadow-md space-y-2 h-full min-h-[165px]"
                        title="Add product to comparison"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#1e4620] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <span className="block text-xs lg:text-sm font-extrabold text-[#1e4620] group-hover:text-[#153417]">
                            + Add Product
                          </span>
                          <span className="block text-[10px] sm:text-[11px] text-stone-500 font-medium mt-0.5">
                            Compare up to 4 products
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1e4620] bg-white border border-emerald-200/90 group-hover:border-emerald-400 px-2.5 py-1 rounded-md shadow-2xs transition-colors mt-0.5">
                          Browse Catalog
                        </span>
                      </Link>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {activeRows.map((row, rIdx) => {
                  const values = items.map((p) => String(row.getValue(p)));
                  const isDifferent = new Set(values).size > 1;

                  if (highlightDifferences && !isDifferent) {
                    return null;
                  }

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-stone-100 transition-colors ${
                        rIdx % 2 === 0 ? "bg-[#fcfdfc]" : "bg-white"
                      } ${
                        isDifferent && items.length > 1
                          ? "bg-amber-50/20"
                          : ""
                      }`}
                    >
                      {/* Left Feature Column */}
                      <td className="p-2.5 text-xs font-bold text-stone-700 sticky left-0 bg-stone-50/98 z-10 border-r border-stone-200/80 flex items-center gap-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                        <div className="w-5 h-5 rounded bg-stone-100 flex items-center justify-center flex-shrink-0 text-stone-600">
                          {row.icon}
                        </div>
                        <span className="line-clamp-2 min-w-0 break-words">{row.label}</span>
                      </td>

                      {/* Values for each product */}
                      {items.map((prod) => (
                        <td
                          key={prod._id}
                          className="p-2.5 border-r border-stone-100 align-middle text-xs break-words min-w-0"
                        >
                          {row.render(prod)}
                        </td>
                      ))}

                      {/* Add Product Action Column Value Cell */}
                      {items.length < 4 && (
                        <td className="p-2.5 border-r border-stone-100 text-center text-stone-300 text-xs italic bg-stone-50/20">
                          —
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-2 min-h-[48px] max-h-[56px] bg-stone-50/90 border-t border-stone-200/80 flex items-center justify-between gap-2 text-xs text-stone-500 flex-shrink-0">
            <span className="font-medium text-stone-500 text-[11px] sm:text-xs truncate max-w-[75%] sm:max-w-none">
              Real specifications directly from the Metafit catalog
            </span>
            <button
              type="button"
              onClick={() => dispatch(closeCompareModal())}
              className="px-4 py-1.5 rounded-lg bg-[#1e4620] hover:bg-[#153417] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer ml-auto flex-shrink-0"
              aria-label="Close modal"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CompareModal;

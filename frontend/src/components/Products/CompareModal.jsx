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
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-stone-900">
                ₹{finalPrice.toLocaleString("en-IN")}
              </span>
              {originalPrice > finalPrice && (
                <span className="text-xs text-stone-400 line-through">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {isLowest && priceDiff > 0 && (
              <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
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
          return <span className="text-xs text-stone-400 font-medium">Regular Price (No Discount)</span>;
        }

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">
                {discountPct}% OFF
              </span>
              <span className="text-xs text-emerald-700 font-bold">
                (Saves ₹{savings.toLocaleString("en-IN")})
              </span>
            </div>
            {isBestDiscount && items.length > 1 && (
              <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                ★ Highest Discount
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
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="text-xs font-bold text-amber-950">{rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-stone-500">
                ({reviews} {reviews === 1 ? "review" : "reviews"})
              </span>
            </div>
            {isTop && (
              <span className="text-[10px] font-bold text-emerald-700 block">
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
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
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
            <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              Out of Stock
            </span>
          );
        }
        if (stock <= 5) {
          return (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Only {stock} Left
            </span>
          );
        }
        return (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            In Stock
          </span>
        );
      },
    },
  ];

  const activeRows = candidateRows.filter((r) => r.hasData(items));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch(closeCompareModal())}
          className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-stone-200 bg-stone-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                  <span>Product Comparison Matrix</span>
                  <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length} of 4 Products
                  </span>
                </h2>
                <p className="text-xs text-stone-500">
                  {uniqueCategories.length === 1 ? (
                    <>Category: <span className="font-semibold text-stone-700">{uniqueCategories[0]}</span></>
                  ) : (
                    <>Categories: <span className="font-semibold text-stone-700">{uniqueCategories.join(" & ")}</span></>
                  )}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5">
              {items.length > 1 && (
                <label className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={highlightDifferences}
                    onChange={(e) => setHighlightDifferences(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <span>Show Differences Only</span>
                </label>
              )}

              <button
                type="button"
                onClick={() => dispatch(clearCompare())}
                className="text-stone-500 hover:text-rose-600 text-xs font-semibold px-2 py-1 transition-colors"
              >
                Clear All
              </button>

              <button
                type="button"
                onClick={() => dispatch(closeCompareModal())}
                className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-5 pb-8 bg-white">
            <table className="w-full border-collapse min-w-[600px] table-fixed mb-4">
              <colgroup>
                <col className="w-32 sm:w-44 bg-stone-50/70" />
                {items.map((prod) => (
                  <col key={prod._id} className="w-48 sm:w-56" />
                ))}
                {items.length === 1 && <col className="w-48 sm:w-56" />}
              </colgroup>

              <thead className="sticky top-0 z-20 bg-white shadow-xs">
                <tr className="border-b-2 border-stone-200">
                  <th className="p-3 text-left align-bottom font-bold text-stone-400 uppercase text-[11px] tracking-wider sticky top-0 left-0 bg-stone-50 z-30 border-r border-stone-200">
                    Product
                  </th>

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

                    return (
                      <th
                        key={prod._id}
                        className="p-3 text-left align-top font-normal border-l border-stone-200 bg-white relative group"
                      >
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCompare(prod._id))}
                          className="absolute top-2 right-2 w-6 h-6 bg-stone-100 hover:bg-rose-500 hover:text-white text-stone-500 rounded-full flex items-center justify-center transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>

                        <div className="flex flex-col items-center text-center gap-2">
                          <Link
                            to={`/product/${prod._id}`}
                            onClick={() => dispatch(closeCompareModal())}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-stone-100 p-2 flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={imageSrc}
                              alt={prod.name}
                              className="w-full h-full object-contain"
                            />
                          </Link>

                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#1e4620] uppercase tracking-wider">
                            <span className="truncate max-w-[130px]">{prod.brand || "Metafit"}</span>
                            <CheckCircle2 className="w-3 h-3 text-[#1e4620] flex-shrink-0" />
                          </div>

                          <Link
                            to={`/product/${prod._id}`}
                            onClick={() => dispatch(closeCompareModal())}
                            className="text-xs sm:text-sm font-bold text-stone-900 hover:text-teal-700 line-clamp-2 leading-snug transition-colors"
                            title={prod.name}
                          >
                            {prod.name}
                          </Link>

                          {/* CTA: If item has variants, link to detail page; if simple, allow direct Add to Cart */}
                          {hasOptions ? (
                            <Link
                              to={`/product/${prod._id}`}
                              onClick={() => dispatch(closeCompareModal())}
                              className="w-full mt-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center gap-1 transition-colors"
                            >
                              <span>Select Size / Options</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCartDirect(prod)}
                              disabled={addingId === prod._id || isOutOfStock}
                              className={`w-full mt-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                                isOutOfStock
                                  ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20"
                              }`}
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

                  {/* If only 1 product is present, show second slot guidance */}
                  {items.length === 1 && (
                    <th className="p-4 text-center align-middle border-l border-dashed border-stone-200 bg-stone-50/50">
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                          <ArrowLeftRight className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-stone-700">Add 2nd product</p>
                        <p className="text-[11px] text-stone-400 max-w-[130px]">
                          Choose another item from catalog to compare side-by-side
                        </p>
                        <Link
                          to={`/collections/all`}
                          onClick={() => dispatch(closeCompareModal())}
                          className="mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          Browse Products
                        </Link>
                      </div>
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
                        rIdx % 2 === 0 ? "bg-stone-50/20" : "bg-white"
                      } ${
                        isDifferent && items.length > 1
                          ? "bg-amber-50/30"
                          : ""
                      }`}
                    >
                      {/* Left Feature Column */}
                      <td className="p-3 text-xs font-bold text-stone-700 sticky left-0 bg-stone-50/95 z-10 border-r border-stone-200 flex items-center gap-2">
                        {row.icon}
                        <span>{row.label}</span>
                      </td>

                      {/* Values for each product */}
                      {items.map((prod) => (
                        <td
                          key={prod._id}
                          className="p-3 border-l border-stone-200 align-middle"
                        >
                          {row.render(prod)}
                        </td>
                      ))}

                      {items.length === 1 && (
                        <td className="p-3 border-l border-dashed border-stone-200 text-center text-stone-300 text-xs">
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
          <div className="px-4 sm:px-6 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
            <span>Real specifications directly from the Metafit catalog</span>
            <button
              type="button"
              onClick={() => dispatch(closeCompareModal())}
              className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors"
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

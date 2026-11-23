import { useEffect, useState } from "react";
import { FaPlayCircle, FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { toast } from "sonner";
import ProductGrid, { ProductSkeleton } from "./ProductGrid";
import ProductReviews from "./ProductReviews";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SEO from "../SEO/SEO";
import { fetchSimilarProduct } from "../../redux/slices/productSlice";
import { addToCart, updateCartItemQuantity, removeFromCart, openCartDrawer } from "../../redux/slices/cartSlice";
import { addToWishlist, removeFromWishlist } from "../../redux/slices/wishlistSlice";
import { toggleCompare } from "../../redux/slices/compareSlice";
import { fetchProductReviews } from "../../redux/slices/reviewSlice";
import {
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
  Loader2,
  ArrowLeftRight,
  ArrowLeft,
  Sprout,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import {
  clearReferralContext,
  readReferralParams,
  saveReferralContext,
} from "../../services/referralStorage";

import { trackMetaEvent } from "../../lib/meta-pixel";

const formatCurrency = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return `₹${numericValue.toLocaleString()}`;
};

const getVariantPriceRange = (variants = []) => {
  const prices = variants
    .map((variant) =>
      Number(variant.discountPrice || variant.price)
    )
    .filter((price) => Number.isFinite(price));

  return prices.length ? Math.min(...prices) : null;
};

const formatProductDescription = (rawHtml, productName) => {
  if (!rawHtml || typeof rawHtml !== "string") return "";
  let html = rawHtml;

  // Remove duplicate product title at the beginning if present
  if (productName) {
    const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const titleRegex = new RegExp(`^\\s*(?:<p>\\s*<strong>\\s*${escaped}\\s*<\\/strong>\\s*<\\/p>|<h[1-4][^>]*>\\s*${escaped}\\s*<\\/h[1-4]>)`, "i");
    html = html.replace(titleRegex, "");
  }

  // Remove "Key Features" heading right before lists
  html = html.replace(/<h[2-4][^>]*>\s*(?:Key\s+)?Features:?\s*<\/h[2-4]>/gi, "");
  html = html.replace(/<p>\s*<strong>\s*(?:Key\s+)?Features:?\s*<\/strong>\s*<\/p>/gi, "");

  // Strip leading emojis inside <li> items (e.g. 🌿, ☁️, 🚫, etc.) so custom maroon checkmark displays cleanly
  html = html.replace(
    /<li>(?:\s*<p>)?\s*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA70}-\u{1FAFF}\u{FE0F}]+\s*/gu,
    (match) => (match.includes("<p>") ? "<li><p>" : "<li>")
  );

  return html;
};

const ProductDetails = ({ productId }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { similarProducts, similarLoading } = useSelector(
    (state) => state.products
  );

  const { user, guestId } = useSelector(
    (state) => state.auth
  );

  const cart = useSelector((state) => state.cart?.cart || state.cart);
  const cartProducts = cart?.products || [];

  const wishlistState = useSelector((state) => state.wishlist || { products: [] });
  const wishlistProducts = wishlistState?.products || [];
  const compareItems = useSelector((state) => state.compare?.items || []);

  const { reviews, stats, productId: reviewProductId } = useSelector(
    (state) => state.reviews
  );

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isButtonDisabled, setIsButtonDisabled] =
    useState(false);
  const [isBuyNowLoading, setIsBuyNowLoading] =
    useState(false);
  const [selectedVariant, setSelectedVariant] =
    useState(null);
  const [activeReferral, setActiveReferral] =
    useState(null);
  const [isAboutExpanded, setIsAboutExpanded] =
    useState(true);

  /*
  ============================================================
  PRODUCT FETCH ID
  ============================================================
  URL me slug ho sakta hai:

  /product/metafit-wellness-protein-bite

  Product fetch ke liye slug/id dono allowed hain.
  ============================================================
  */

  const productFetchId = productId || id;
  const actualProductId = selectedProduct?._id || null;

  const cartItem = cartProducts.find((item) => {
    const itemId = item.productId?._id || item.productId || item._id;
    return (actualProductId && itemId === actualProductId) || (selectedProduct?.slug && item.productId?.slug === selectedProduct.slug);
  });
  const cartQuantity = cartItem?.quantity || 0;

  const isWishlisted = wishlistProducts.some(
    (item) => (actualProductId && (item._id || item.productId || item) === actualProductId) || (selectedProduct?.slug && item.slug === selectedProduct.slug)
  );

  const isCompared = compareItems.some(
    (item) => actualProductId && item._id === actualProductId
  );

  /*
  ============================================================
  RELATED PRODUCTS FILTERING & ROUTE SCROLL RESET
  ============================================================
  */
  const displayedRelatedProducts = (() => {
    if (!selectedProduct?._id || !Array.isArray(similarProducts)) return [];
    const currentId = String(selectedProduct._id);
    const currentSlug = selectedProduct.slug ? String(selectedProduct.slug) : null;

    const seen = new Set([currentId]);
    if (currentSlug) seen.add(currentSlug);

    const result = [];
    for (const p of similarProducts) {
      if (!p || (!p._id && !p.id)) continue;
      const pId = String(p._id || p.id);
      const pSlug = p.slug ? String(p.slug) : null;

      if (seen.has(pId)) continue;
      if (pSlug && seen.has(pSlug)) continue;

      seen.add(pId);
      if (pSlug) seen.add(pSlug);
      result.push(p);
    }
    return result.slice(0, 4);
  })();

  const extraImageList = (() => {
    const list = [];
    if (Array.isArray(selectedProduct?.extraImages)) {
      selectedProduct.extraImages.forEach((img) => {
        const baseStr = typeof img === "string" ? img : img?.url;
        if (baseStr) {
          baseStr.split(",").forEach((urlStr) => {
            const trimmed = urlStr.trim();
            if (trimmed && !list.includes(trimmed)) list.push(trimmed);
          });
        }
      });
    }
    if (list.length === 0 && Array.isArray(selectedProduct?.images)) {
      selectedProduct.images.forEach((img) => {
        const url = typeof img === "string" ? img : img?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    return list;
  })();

  const allProductThumbnails = (() => {
    const list = [];
    if (Array.isArray(selectedProduct?.images)) {
      selectedProduct.images.forEach((img) => {
        const url = typeof img === "string" ? img : img?.url;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    if (Array.isArray(selectedProduct?.extraImages)) {
      selectedProduct.extraImages.forEach((img) => {
        const baseStr = typeof img === "string" ? img : img?.url;
        if (baseStr) {
          baseStr.split(",").forEach((urlStr) => {
            const trimmed = urlStr.trim();
            if (trimmed && !list.includes(trimmed)) list.push(trimmed);
          });
        }
      });
    }
    return list;
  })();

  const keyFeatures = (() => {
    if (!selectedProduct?.description) return [];
    const htmlString = selectedProduct.description;
    const items = [];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match;
    while ((match = liRegex.exec(htmlString)) !== null) {
      const content = match[1];
      const strongMatch = content.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
      let title = "";
      if (strongMatch) {
        title = strongMatch[1].replace(/<[^>]+>/g, "").trim();
      } else {
        const plainText = content.replace(/<[^>]+>/g, "").trim();
        title = plainText.split(/[–—\-:]/)[0].trim();
      }
      title = title
        .replace(/&amp;/g, "&")
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA70}-\u{1FAFF}\u{FE0F}]/gu, "")
        .trim();
      if (title && !items.includes(title)) {
        items.push(title);
      }
    }
    return items;
  })();

  useEffect(() => {
    if (productFetchId) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [productFetchId]);

  /*
  ============================================================
  REAL MONGODB REVIEW DATA CALCULATIONS
  ============================================================
  */

  const isCurrentProductReviews =
    selectedProduct?._id && reviewProductId === selectedProduct._id;

  const totalReviews = isCurrentProductReviews && stats
    ? stats.totalReviews
    : (isCurrentProductReviews && reviews ? reviews.length : 0);

  const rawAverage = isCurrentProductReviews && stats
    ? stats.averageRating
    : (totalReviews > 0 && reviews ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews) : 0);

  const averageRating = Math.round(rawAverage * 10) / 10;
  const formattedAverage = averageRating.toFixed(1);

  const renderRatingStars = (ratingVal) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (ratingVal >= i) {
        stars.push(<FaStar key={i} className="text-yellow-400 text-sm" />);
      } else if (ratingVal >= i - 0.5) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400 text-sm" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-300 text-sm" />);
      }
    }
    return stars;
  };

  /*
  ============================================================
  FETCH REAL PRODUCT REVIEWS FROM MONGODB
  ============================================================
  */

  useEffect(() => {
    if (selectedProduct?._id) {
      dispatch(fetchProductReviews(selectedProduct._id));
    }
  }, [dispatch, selectedProduct?._id]);

  /*
  ============================================================
  FETCH SIMILAR PRODUCTS
  ============================================================
  */

  useEffect(() => {
    if (selectedProduct?._id) {
      dispatch(
        fetchSimilarProduct({
          id: selectedProduct._id,
        })
      );
    }
  }, [dispatch, selectedProduct?._id]);

  /*
  ============================================================
  FETCH PRODUCT
  ============================================================
  */

  useEffect(() => {
    if (!productFetchId) return;

    setSelectedProduct(null);
    setMainImage("");
    setSelectedSize("");
    setSelectedColor("");
    setSelectedVariant(null);
    setQuantity(1);
    setLoading(true);
    setError(null);

    const referralFromQuery = readReferralParams(
      location.search
    );

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        let validReferral = null;

        /*
        --------------------------------------------------------
        REFERRAL VALIDATION
        --------------------------------------------------------
        */

        if (referralFromQuery) {
          try {
            await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/store/referrals/validate`,
              {
                params: {
                  productId: productFetchId,
                  vendorId:
                    referralFromQuery.vendorId,
                  assignedProductId:
                    referralFromQuery.assignedProductId,
                  ref: referralFromQuery.shareCode,
                },
              }
            );

            validReferral = {
              productId: productFetchId,
              vendorId: referralFromQuery.vendorId,
              assignedProductId:
                referralFromQuery.assignedProductId,
              shareCode:
                referralFromQuery.shareCode,
            };

            saveReferralContext(validReferral);
          } catch (validationError) {
            validReferral = null;

            clearReferralContext();

            toast.error(
              validationError?.response?.data
                ?.message ||
              "Referral link invalid or expired"
            );
          }
        }

        /*
        --------------------------------------------------------
        PRODUCT API
        --------------------------------------------------------
        */

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/store/products/${productFetchId}`,
          {
            params: referralFromQuery
              ? {
                vendorId:
                  referralFromQuery.vendorId,
                assignedProductId:
                  referralFromQuery.assignedProductId,
                ref: referralFromQuery.shareCode,
              }
              : undefined,
          }
        );

        const product =
          response.data?.product ||
          response.data;

        setSelectedProduct(product);
        setActiveReferral(validReferral);
      } catch (fetchError) {
        setError(
          fetchError?.response?.data?.message ||
          "Failed to load product"
        );

        if (referralFromQuery) {
          clearReferralContext();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [
    location.search,
    productFetchId,
  ]);

  /*
  ============================================================
  MAIN IMAGE
  ============================================================
  */

  useEffect(() => {
    if (!selectedProduct) return;

    if (
      selectedProduct?.images?.length > 0
    ) {
      const firstImage =
        typeof selectedProduct.images[0] ===
          "string"
          ? selectedProduct.images[0]
          : selectedProduct.images[0].url;

      setMainImage(firstImage || "");
    } else {
      setMainImage("");
    }

    if (
      selectedProduct?.sizes?.length > 0
    ) {
      setSelectedSize(selectedProduct.sizes[0]);
    } else {
      setSelectedSize("");
    }

    if (
      selectedProduct?.hasVariants &&
      selectedProduct?.variants?.length > 0
    ) {
      setSelectedVariant(selectedProduct.variants[0]);
    } else {
      setSelectedVariant(null);
    }

    if (
      selectedProduct?.colors?.length > 0
    ) {
      setSelectedColor(selectedProduct.colors[0]);
    } else {
      setSelectedColor("");
    }
  }, [selectedProduct]);

  /*
  ============================================================
  META PIXEL - VIEW CONTENT
  ============================================================
  */

  useEffect(() => {
    if (!selectedProduct) return;

    const metaProductId =
      selectedProduct._id || productFetchId;

    const productPrice = Number(
      selectedProduct.discountPrice ||
      selectedProduct.price ||
      0
    );

    trackMetaEvent("ViewContent", {
      content_ids: [metaProductId],
      content_name: selectedProduct.name,
      content_type: "product",
      value: productPrice,
      currency: "INR",
    });
  }, [
    selectedProduct?._id,
    productFetchId,
  ]);

  /*
  ============================================================
  CLEAN PRODUCT URL
  ============================================================
  */

  useEffect(() => {
    if (
      id &&
      selectedProduct &&
      (selectedProduct._id === id || selectedProduct.slug === id) &&
      selectedProduct.slug &&
      id !== selectedProduct.slug
    ) {
      navigate(
        `/product/${selectedProduct.slug}${location.search}`,
        {
          replace: true,
        }
      );
    }
  }, [
    id,
    selectedProduct,
    location.search,
    navigate,
  ]);

  /*
  ============================================================
  QUANTITY
  ============================================================
  */

  const handleQuantityChange = (action) => {
    if (action === "plus") {
      setQuantity((prev) => prev + 1);
    }

    if (
      action === "minus" &&
      quantity > 1
    ) {
      setQuantity((prev) => prev - 1);
    }
  };

  /*
  ============================================================
  COLOR
  ============================================================
  */

  const handleColorClick = (
    color,
    index
  ) => {
    setSelectedColor(color);

    const colorImage =
      selectedProduct.images?.find(
        (img) => img.color === color
      );

    if (
      colorImage &&
      colorImage.url
    ) {
      setMainImage(colorImage.url);
    } else if (
      selectedProduct.images &&
      selectedProduct.images[index]
    ) {
      const image =
        selectedProduct.images[index];

      setMainImage(
        typeof image === "string"
          ? image
          : image.url
      );
    }
  };

  /*
  ============================================================
  ADD TO CART
  ============================================================
  IMPORTANT:

  Product URL can use slug.

  But backend Cart API requires MongoDB ObjectId.

  Therefore:

  productId: selectedProduct._id

  NOT:

  productId: productFetchId
  ============================================================
  */

  const handleAddToCart = async () => {
    if (!selectedProduct?._id) {
      toast.error(
        "Product ID not available"
      );
      return;
    }

    if (
      selectedProduct.hasVariants &&
      !selectedVariant
    ) {
      toast.error(
        "Please select a variant",
        {
          duration: 1500,
        }
      );

      return;
    }

    setIsButtonDisabled(true);

    try {
      /*
      --------------------------------------------------------
      ACTUAL MONGODB PRODUCT ID
      --------------------------------------------------------
      */

      const actualProductId =
        selectedProduct._id;

      /*
      --------------------------------------------------------
      SELECTED PRICE
      --------------------------------------------------------
      */

      const itemPrice = selectedVariant
        ? Number(
          selectedVariant.discountPrice ||
          selectedVariant.price ||
          0
        )
        : Number(
          selectedProduct.discountPrice ||
          selectedProduct.price ||
          0
        );

      /*
      --------------------------------------------------------
      ADD CART
      --------------------------------------------------------
      */

      const result = await dispatch(
        addToCart({
          /*
          IMPORTANT:
          Backend ko ObjectId chahiye
          */

          productId: actualProductId,

          quantity,

          size:
            selectedSize || null,

          color:
            selectedColor || null,

          guestId,

          userId: user?._id,

          variant: selectedVariant
            ? {
              label:
                selectedVariant.label,

              price:
                selectedVariant.discountPrice ||
                selectedVariant.price,
            }
            : null,

          referral: activeReferral
            ? {
              productId:
                actualProductId,

              vendorId:
                activeReferral.vendorId,

              assignedProductId:
                activeReferral.assignedProductId,

              shareCode:
                activeReferral.shareCode,
            }
            : null,
        })
      );

      /*
      --------------------------------------------------------
      CHECK REDUX THUNK ERROR
      --------------------------------------------------------
      */

      if (result?.error) {
        throw new Error(
          result.error.message ||
          "Failed to add product to cart"
        );
      }

      /*
      --------------------------------------------------------
      META PIXEL - ADD TO CART
      --------------------------------------------------------
      */

      trackMetaEvent("AddToCart", {
        content_ids: [
          actualProductId,
        ],

        content_name:
          selectedProduct.name,

        content_type: "product",

        value:
          itemPrice * quantity,

        currency: "INR",

        quantity,
      });

      /*
      --------------------------------------------------------
      SUCCESS
      --------------------------------------------------------
      */

      toast.success(
        "Added to cart!",
        {
          duration: 1500,
        }
      );

      /*
      --------------------------------------------------------
      AUTO OPEN CART DRAWER
      --------------------------------------------------------
      */
      dispatch(openCartDrawer());
    } catch (cartError) {
      console.error(
        "Add to cart error:",
        cartError
      );

      toast.error(
        cartError?.message ||
        "Failed to add product to cart",
        {
          duration: 2000,
        }
      );
    } finally {
      setIsButtonDisabled(false);
    }
  };

  const handleIncrementCart = async (e) => {
    if (e) e.preventDefault();
    if (isButtonDisabled) return;
    setIsButtonDisabled(true);

    try {
      const nextQty = (cartQuantity || 1) + 1;
      const result = await dispatch(
        updateCartItemQuantity({
          productId: actualProductId,
          quantity: nextQty,
          guestId,
          userId: user?._id,
          size: selectedSize || cartItem?.size || null,
          color: selectedColor || cartItem?.color || null,
        })
      );

      if (result?.error) {
        throw new Error(result.error.message || "Failed to update quantity");
      }
    } catch (err) {
      console.error("Increment error:", err);
      toast.error(err?.message || "Failed to update quantity");
    } finally {
      setIsButtonDisabled(false);
    }
  };

  const handleDecrementCart = async (e) => {
    if (e) e.preventDefault();
    if (isButtonDisabled) return;
    setIsButtonDisabled(true);

    try {
      const currentQty = cartQuantity || 1;
      if (currentQty <= 1) {
        const result = await dispatch(
          removeFromCart({
            productId: actualProductId,
            guestId,
            userId: user?._id,
            size: selectedSize || cartItem?.size || null,
            color: selectedColor || cartItem?.color || null,
          })
        );

        if (result?.error) {
          throw new Error(result.error.message || "Failed to remove item");
        }
        toast.info("Removed from cart", { duration: 1500 });
      } else {
        const nextQty = currentQty - 1;
        const result = await dispatch(
          updateCartItemQuantity({
            productId: actualProductId,
            quantity: nextQty,
            guestId,
            userId: user?._id,
            size: selectedSize || cartItem?.size || null,
            color: selectedColor || cartItem?.color || null,
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
      setIsButtonDisabled(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      toast.error("Please log in to save items to your wishlist");
      return;
    }

    try {
      if (isWishlisted) {
        const result = await dispatch(
          removeFromWishlist({ productId: actualProductId, user })
        );
        if (result?.error) {
          throw new Error(result.error.message || "Failed to remove from wishlist");
        }
        toast.info("Removed from Wishlist");
      } else {
        const result = await dispatch(
          addToWishlist({ product: selectedProduct, user })
        );
        if (result?.error) {
          throw new Error(result.error.message || "Failed to add to wishlist");
        }

        trackMetaEvent("AddToWishlist", {
          content_ids: [actualProductId],
          content_name: selectedProduct?.name,
          content_type: "product",
          value: Number(selectedProduct?.discountPrice || selectedProduct?.price || 0),
          currency: "INR",
        });

        toast.success("Added to Wishlist");
      }
    } catch (wishlistError) {
      console.error("Wishlist error:", wishlistError);
      toast.error(wishlistError?.message || "Wishlist update failed");
    }
  };

  /*
  ============================================================
  BUY NOW (SELECTED PRODUCT IMMEDIATE CHECKOUT)
  ============================================================
  */

  const handleBuyNow = async () => {
    if (!selectedProduct?._id) {
      toast.error(
        "Product ID not available"
      );
      return;
    }

    if (
      selectedProduct.hasVariants &&
      !selectedVariant
    ) {
      toast.error(
        "Please select a variant",
        {
          duration: 1500,
        }
      );
      return;
    }

    setIsBuyNowLoading(true);

    try {
      const actualProductId =
        selectedProduct._id;

      const itemPrice = selectedVariant
        ? Number(
          selectedVariant.discountPrice ||
          selectedVariant.price ||
          0
        )
        : Number(
          selectedProduct.discountPrice ||
          selectedProduct.price ||
          0
        );

      const result = await dispatch(
        addToCart({
          productId: actualProductId,
          quantity,
          size:
            selectedSize || null,
          color:
            selectedColor || null,
          guestId,
          userId: user?._id,
          variant: selectedVariant
            ? {
              label:
                selectedVariant.label,
              price:
                selectedVariant.discountPrice ||
                selectedVariant.price,
            }
            : null,
          referral: activeReferral
            ? {
              productId:
                actualProductId,
              vendorId:
                activeReferral.vendorId,
              assignedProductId:
                activeReferral.assignedProductId,
              shareCode:
                activeReferral.shareCode,
            }
            : null,
        })
      );

      if (result?.error) {
        throw new Error(
          result.error.message ||
          "Failed to proceed to checkout"
        );
      }

      trackMetaEvent("AddToCart", {
        content_ids: [actualProductId],
        content_name: selectedProduct.name,
        content_type: "product",
        value: itemPrice * quantity,
        currency: "INR",
        quantity,
      });

      trackMetaEvent("InitiateCheckout", {
        content_ids: [actualProductId],
        content_name: selectedProduct.name,
        content_type: "product",
        value: itemPrice * quantity,
        currency: "INR",
        num_items: quantity,
      });

      navigate("/checkout");
    } catch (buyError) {
      console.error(
        "Buy now error:",
        buyError
      );

      toast.error(
        buyError?.message ||
        "Failed to proceed to checkout",
        {
          duration: 2000,
        }
      );
    } finally {
      setIsBuyNowLoading(false);
    }
  };

  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F7F1E7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A5794F] mx-auto mb-3" />

          <p className="text-gray-600 text-sm">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  /*
  ============================================================
  ERROR
  ============================================================
  */

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F7F1E7]">
        <p className="text-red-500">
          {error}
        </p>
      </div>
    );
  }

  if (!selectedProduct) {
    return null;
  }

  /*
  ============================================================
  PRODUCT CALCULATIONS
  ============================================================
  */

  const discountPct =
    selectedProduct.price &&
      selectedProduct.discountPrice
      ? Math.round(
        ((selectedProduct.price -
          selectedProduct.discountPrice) /
          selectedProduct.price) *
        100
      )
      : 0;

  const cleanDescription =
    selectedProduct?.description
      ? selectedProduct.description
        .replace(
          /<[^>]*>?/gm,
          ""
        )
        .slice(0, 300)
      : "";

  const primaryImageUrl =
    selectedProduct?.images?.[0]?.url ||
    "https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png";

  const productPrice =
    selectedProduct?.discountPrice ||
    selectedProduct?.price ||
    0;

  const productAvailability =
    selectedProduct?.countInStock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const productSlugOrId =
    selectedProduct?.slug ||
    selectedProduct?._id ||
    productFetchId;

  const categorySlug =
    selectedProduct?.category
      ? selectedProduct.category
        .toLowerCase()
        .trim()
        .replace(
          /&/g,
          "and"
        )
        .replace(
          /[^\w\s-]/g,
          ""
        )
        .replace(
          /\s+/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        )
      : "all";

  /*
  ============================================================
  PRODUCT JSON-LD
  ============================================================
  */

  const productJsonLd =
    selectedProduct
      ? [
        {
          "@context":
            "https://schema.org/",
          "@type":
            "Product",

          name:
            selectedProduct.name,

          image:
            selectedProduct.images
              ?.map(
                (img) =>
                  typeof img ===
                    "string"
                    ? img
                    : img.url
              )
              .filter(Boolean) || [
              primaryImageUrl,
            ],

          description:
            cleanDescription,

          sku:
            selectedProduct.sku ||
            selectedProduct._id,

          mpn:
            selectedProduct.sku ||
            selectedProduct._id,

          brand: {
            "@type":
              "Brand",

            name:
              selectedProduct.brand ||
              "M Wellness Bazaar",
          },

          offers: {
            "@type":
              "Offer",

            url: `https://mwellnessbazaar.com/product/${productSlugOrId}`,

            priceCurrency:
              "INR",

            price:
              productPrice,

            priceValidUntil:
              "2027-12-31",

            itemCondition:
              "https://schema.org/NewCondition",

            availability:
              productAvailability,

            seller: {
              "@type":
                "Organization",
              "@id":
                "https://mwellnessbazaar.com/#organization",

              name:
                "M Wellness Bazaar",
            },

            hasMerchantReturnPolicy: {
              "@type":
                "MerchantReturnPolicy",
              "@id":
                "https://mwellnessbazaar.com/#merchant-return-policy",
              applicableCountry:
                "IN",
              returnPolicyCategory:
                "https://schema.org/MerchantReturnNotPermitted",
              merchantReturnLink:
                "https://mwellnessbazaar.com/refund-policy",
            },

            shippingDetails: {
              "@type":
                "OfferShippingDetails",
              shippingRate: {
                "@type":
                  "MonetaryAmount",
                value:
                  selectedProduct?.shippingCharge !== undefined && selectedProduct?.shippingCharge !== null
                    ? Number(selectedProduct.shippingCharge)
                    : 0,
                currency:
                  "INR",
              },
              shippingDestination: {
                "@type":
                  "DefinedRegion",
                addressCountry:
                  "IN",
              },
              deliveryTime: {
                "@type":
                  "ShippingDeliveryTime",
                handlingTime: {
                  "@type":
                    "QuantitativeValue",
                  minValue: 2,
                  maxValue: 3,
                  unitCode:
                    "DAY",
                },
                transitTime: {
                  "@type":
                    "QuantitativeValue",
                  minValue: 10,
                  maxValue: 20,
                  unitCode:
                    "DAY",
                },
              },
            },
          },

          ...(totalReviews > 0
            ? {
              aggregateRating:
              {
                "@type":
                  "AggregateRating",

                ratingValue:
                  averageRating,

                reviewCount:
                  totalReviews,
              },
            }
            : {}),
        },

        {
          "@context":
            "https://schema.org",

          "@type":
            "BreadcrumbList",

          itemListElement:
            [
              {
                "@type":
                  "ListItem",

                position: 1,

                name:
                  "Home",

                item:
                  "https://mwellnessbazaar.com/",
              },

              {
                "@type":
                  "ListItem",

                position: 2,

                name:
                  selectedProduct.category ||
                  "Products",

                item: `https://mwellnessbazaar.com/category/${categorySlug}`,
              },

              {
                "@type":
                  "ListItem",

                position: 3,

                name:
                  selectedProduct.name,

                item: `https://mwellnessbazaar.com/product/${productSlugOrId}`,
              },
            ],
        },
      ]
      : null;

  return (
    <div className="min-h-screen bg-herb-background">
      <SEO
        title={
          selectedProduct.name
        }
        description={
          cleanDescription
        }
        canonical={`/product/${productSlugOrId}`}
        ogImage={
          primaryImageUrl
        }
        ogType="product"
        jsonLd={
          productJsonLd
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">

        {/* ====================================================
            MAIN PRODUCT CARD
        ==================================================== */}

        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm mb-6 border border-gray-200/90 p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

            {/* ==================================================
                LEFT - IMAGES
            ================================================== */}

            <div className="w-full lg:w-[35%] xl:w-[48%] flex-shrink-0">
              {/* MAIN PRODUCT IMAGE CARD (Generous border-radius, clean aesthetic fill) */}
              <div className="relative w-full aspect-square rounded-[22px] md:rounded-[24px] overflow-hidden bg-[#F2EEE9] flex items-center justify-center shadow-xs">
                {mainImage === "video" ? (
                  <video
                    src={selectedProduct.videoUrl}
                    controls
                    className="w-full h-full object-cover rounded-[22px] md:rounded-[24px]"
                  />
                ) : (
                  <img
                    src={mainImage || "https://via.placeholder.com/600"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover rounded-[22px] md:rounded-[24px] transition-all duration-300"
                  />
                )}

                {/* LOGO WATERMARK */}
                <div className="absolute top-3.5 right-3.5 bg-white rounded-2xl p-2.5 shadow-sm border border-stone-200/40 z-10">
                  <img
                    src="https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png"
                    alt="M Wellness Bazaar"
                    className="h-10 md:h-11 object-contain"
                  />
                </div>

                {/* DISCOUNT BADGE */}
                {discountPct > 0 && (
                  <div className="absolute top-3.5 left-3.5 bg-[#ff3b30] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
                    -{discountPct}% OFF
                  </div>
                )}
              </div>

              {/* THUMBNAILS (Clean horizontal row underneath the main image with arrows) */}
              {allProductThumbnails.length > 1 && (
                <div className="flex items-center gap-2 mt-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("main-thumbnails-scroll");
                      if (el) el.scrollBy({ left: -120, behavior: "smooth" });
                    }}
                    className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-xs flex-shrink-0 cursor-pointer"
                    aria-label="Previous thumbnails"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div id="main-thumbnails-scroll" className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none flex-1">
                    {selectedProduct?.videoUrl && (
                      <button
                        title="Product Video"
                        onClick={() => setMainImage("video")}
                        className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all relative flex-shrink-0 ${mainImage === "video"
                          ? "border-[#007084] ring-2 ring-[#007084]/20"
                          : "border-gray-200 hover:border-[#007084]"
                          }`}
                      >
                        <video src={selectedProduct.videoUrl} muted className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                          <FaPlayCircle className="text-white text-lg" />
                          <span className="text-[8px] font-bold text-white uppercase">Video</span>
                        </div>
                      </button>
                    )}

                    {allProductThumbnails.map((imgUrl, i) => (
                      <button
                        key={`main-thumb-${i}`}
                        onClick={() => setMainImage(imgUrl)}
                        className={`w-14 h-14 flex-shrink-0 rounded-xl border-2 overflow-hidden bg-gray-50 transition-all ${mainImage === imgUrl
                          ? "border-[#007084] ring-2 ring-[#007084]/20"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <img src={imgUrl} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("main-thumbnails-scroll");
                      if (el) el.scrollBy({ left: 120, behavior: "smooth" });
                    }}
                    className="w-7 h-7 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-xs flex-shrink-0 cursor-pointer"
                    aria-label="Next thumbnails"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ==================================================
                CENTER - DETAILS
            ================================================== */}

            <div className="flex-1 w-full min-w-0">

              {/* BRAND */}

              {selectedProduct.brand && (
                <div className="mb-1.5">
                  <Link
                    to={`/collections/all?brand=${encodeURIComponent(selectedProduct.brand.trim())}`}
                    className="inline-block text-[13px] text-gray-600 font-medium group transition-colors"
                  >
                    Visit the{" "}
                    <span className="text-[#007084] font-semibold underline group-hover:text-[#005a6a]">
                      {selectedProduct.brand}
                    </span>{" "}
                    Store
                  </Link>
                </div>
              )}

              {/* NAME & COMPARE CONTROL */}

              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl md:text-[26px] font-bold text-gray-900 tracking-tight leading-snug">
                  {selectedProduct.name}
                </h1>

                <button
                  type="button"
                  onClick={() => selectedProduct && dispatch(toggleCompare(selectedProduct))}
                  title={isCompared ? "In Comparison (Click to remove)" : "Compare with Other Products"}
                  aria-label={isCompared ? "Remove from comparison" : "Compare product"}
                  className={`w-7 h-7 min-w-[28px] min-h-[28px] rounded-md border transition-all flex items-center justify-center cursor-pointer shadow-xs flex-shrink-0 ${isCompared
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800"
                    }`}
                >
                  <ArrowLeftRight className={`h-3.5 w-3.5 ${isCompared ? "stroke-[2.5]" : ""}`} />
                </button>
              </div>

              {activeReferral && (
                <div className="mb-2.5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Recommended by Vendor
                </div>
              )}

              {/* RATING */}

              <div className="flex items-center gap-2 mb-3">
                {totalReviews > 0 ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      {renderRatingStars(averageRating)}
                    </div>

                    <span className="text-xs text-[#007084] font-semibold">
                      {formattedAverage} out of 5 ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 font-normal">
                    No reviews yet
                  </span>
                )}
              </div>

              {/* PRICE */}

              {!selectedProduct.hasVariants ? (
                (() => {
                  let displayPrice =
                    selectedProduct.discountPrice ||
                    selectedProduct.price;

                  let displayMrp =
                    selectedProduct.price;

                  if (
                    selectedSize &&
                    typeof selectedSize ===
                    "string" &&
                    selectedSize.includes(":")
                  ) {
                    const parts =
                      selectedSize.split(
                        ":"
                      );

                    if (
                      parts.length ===
                      3
                    ) {
                      if (
                        !isNaN(
                          Number(
                            parts[1]
                          )
                        )
                      ) {
                        displayMrp =
                          Number(
                            parts[1]
                          );
                      }

                      if (
                        !isNaN(
                          Number(
                            parts[2]
                          )
                        )
                      ) {
                        displayPrice =
                          Number(
                            parts[2]
                          );
                      }
                    } else if (
                      parts.length ===
                      2
                    ) {
                      if (
                        !isNaN(
                          Number(
                            parts[1]
                          )
                        )
                      ) {
                        displayPrice =
                          Number(
                            parts[1]
                          );
                      }
                    }
                  }

                  const computedDiscountPct =
                    displayMrp &&
                      displayMrp >
                      displayPrice
                      ? Math.round(
                        ((displayMrp -
                          displayPrice) /
                          displayMrp) *
                        100
                      )
                      : 0;

                  return (
                    <div className="mb-3.5">

                      <div className="flex items-baseline gap-2.5 flex-wrap">

                        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                          {
                            formatCurrency(
                              displayPrice
                            )
                          }
                        </span>

                        {displayMrp &&
                          displayMrp >
                          displayPrice && (
                            <span className="text-sm text-gray-400 line-through font-normal">
                              M.R.P:{" "}
                              {
                                formatCurrency(
                                  displayMrp
                                )
                              }
                            </span>
                          )}

                        {computedDiscountPct >
                          0 && (
                            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                              (
                              {
                                computedDiscountPct
                              }
                              % off)
                            </span>
                          )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1 font-normal">
                        Inclusive of all taxes
                      </p>

                    </div>
                  );
                })()
              ) : (
                <div className="mb-3.5">

                  <p className="text-sm text-gray-500 mb-1 font-medium">
                    From{" "}
                    {
                      formatCurrency(
                        getVariantPriceRange(
                          selectedProduct.variants
                        )
                      )
                    }
                  </p>

                  <p className="text-xs text-gray-500">
                    Select a variant below to see pricing
                  </p>
                </div>
              )}

              {/* VARIANTS */}

              {selectedProduct.hasVariants &&
                selectedProduct.variants
                  ?.length > 0 && (
                  <div className="mb-4">

                    <p className="text-sm font-bold text-gray-800 mb-2">
                      Pack Options:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                      {selectedProduct.variants.map(
                        (
                          variant,
                          idx
                        ) => (
                          <button
                            key={idx}
                            onClick={() =>
                              setSelectedVariant(
                                variant
                              )
                            }
                            className={`p-3 border-2 rounded-lg text-left transition-all ${selectedVariant?.label ===
                              variant.label
                              ? "border-[#007084] bg-teal-50/50"
                              : "border-gray-200 hover:border-[#007084]"
                              }`}
                          >
                            <p className="text-xs font-bold text-gray-800 mb-0.5">
                              {
                                variant.label
                              }
                            </p>

                            <p className="text-base font-bold text-gray-900">
                              {
                                formatCurrency(
                                  variant.discountPrice ||
                                  variant.price
                                )
                              }
                            </p>

                            {variant.discountPrice &&
                              variant.price &&
                              variant.discountPrice <
                              variant.price && (
                                <p className="text-xs text-gray-400 line-through">
                                  {
                                    formatCurrency(
                                      variant.price
                                    )
                                  }
                                </p>
                              )}

                            {variant.pricePerUnit && (
                              <p className="text-xs text-gray-500">
                                (
                                {
                                  variant.pricePerUnit
                                }
                                )
                              </p>
                            )}
                          </button>
                        )
                      )}
                    </div>

                    {selectedVariant && (
                      <div className="mt-2 px-3 py-2 bg-[#e6f4f7] border border-[#b3d9e8] rounded text-sm text-[#007084] font-medium">
                        Selected:{" "}
                        {
                          selectedVariant.label
                        }{" "}
                        —{" "}
                        {
                          formatCurrency(
                            selectedVariant.discountPrice ||
                            selectedVariant.price
                          )
                        }
                      </div>
                    )}
                  </div>
                )}

              {/* SIZES */}

              {selectedProduct.sizes
                ?.length > 0 && (
                  <div className="mb-4">

                    <p className="text-sm font-bold text-gray-900 mb-2">
                      Size:{" "}
                      <span className="font-bold text-gray-900">
                        {selectedSize ? selectedSize.split(":")[0] : ""}
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-2.5">

                      {selectedProduct.sizes.map(
                        (
                          sizeRaw,
                          i
                        ) => {
                          const parts =
                            sizeRaw.split(
                              ":"
                            );

                          const sizeName =
                            parts[0];

                          const sizePrice =
                            parts.length ===
                              3
                              ? parts[2]
                              : parts[1];

                          const isSelected = selectedSize === sizeRaw;

                          return (
                            <button
                              key={i}
                              onClick={() =>
                                setSelectedSize(
                                  sizeRaw
                                )
                              }
                              className={`relative min-w-[76px] py-2 px-4 rounded-lg text-center flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected
                                ? "border-2 border-[#007084] bg-[#e6f4f7]"
                                : "border border-gray-300 bg-white hover:border-gray-400 text-gray-800"
                                }`}
                            >
                              {isSelected && (
                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#007084] text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                                  ✓
                                </div>
                              )}
                              <span className={`text-sm ${isSelected ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                                {
                                  sizeName
                                }
                              </span>

                              {sizePrice && (
                                <span className={`text-xs mt-0.5 ${isSelected ? "font-semibold text-[#007084]" : "font-medium text-gray-600"}`}>
                                  ₹
                                  {
                                    sizePrice
                                  }
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* COLORS */}

              {selectedProduct.colors
                ?.length > 0 && (
                  <div className="mb-4">

                    <p className="text-sm font-bold text-gray-800 mb-2">
                      Color:
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {selectedProduct.colors.map(
                        (
                          color,
                          i
                        ) => (
                          <button
                            key={i}
                            onClick={() =>
                              handleColorClick(
                                color,
                                i
                              )
                            }
                            title={
                              selectedProduct.colorsName?.[
                              i
                              ] ||
                              color
                            }
                            className={`w-9 h-9 rounded-full border-2 transition-all ${selectedColor ===
                              color
                              ? "ring-2 ring-[#007084] ring-offset-2"
                              : "border-gray-300 hover:scale-110"
                              }`}
                            style={{
                              backgroundColor:
                                color,
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* ==================================================
                  ACTION BUTTONS & QUANTITY CONTROLS (CART-BASED)
              ================================================== */}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 my-4">
                {cartQuantity > 0 ? (
                  /* CART QUANTITY CONTROL */
                  <div className="flex-1 h-11 flex items-center justify-between sm:justify-center border-[1.5px] border-[#007084] bg-[#e6f4f7] rounded-lg px-2.5 shadow-xs">
                    <button
                      type="button"
                      onClick={handleDecrementCart}
                      disabled={isButtonDisabled}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 active:bg-gray-200 text-[#007084] rounded-md transition-colors border border-[#b3d9e8] disabled:opacity-50 cursor-pointer shadow-xs"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>

                    <div className="flex flex-col items-center justify-center px-3">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500">In Cart</span>
                      <span className="font-bold text-gray-900 text-sm leading-none">
                        {isButtonDisabled ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#007084]" /> : cartQuantity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleIncrementCart}
                      disabled={isButtonDisabled}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 active:bg-gray-200 text-[#007084] rounded-md transition-colors border border-[#b3d9e8] disabled:opacity-50 cursor-pointer shadow-xs"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  /* ADD TO CART BUTTON */
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isButtonDisabled || isBuyNowLoading}
                    className={`flex-1 h-11 flex items-center justify-center gap-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 border-[1.5px] ${isButtonDisabled
                      ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-[#007084] bg-white text-[#007084] hover:bg-[#007084]/5 active:scale-[0.99] cursor-pointer shadow-xs"
                      }`}
                  >
                    <ShoppingCart className="h-4 w-4 text-[#007084]" />
                    <span>{isButtonDisabled ? "Adding..." : "Add to Cart"}</span>
                  </button>
                )}

                {/* BUY NOW */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isButtonDisabled || isBuyNowLoading}
                  className={`flex-1 h-11 flex items-center justify-center gap-2 px-4 rounded-lg font-semibold text-sm text-white transition-all duration-200 shadow-xs active:scale-[0.99] ${isBuyNowLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#005f73] hover:bg-[#004e5f] cursor-pointer"
                    }`}
                >
                  <Zap className="h-4 w-4 fill-white text-white" />
                  <span>{isBuyNowLoading ? "Processing..." : "Buy Now"}</span>
                </button>

                {/* WISHLIST HEART BUTTON */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg border border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center cursor-pointer transition-all flex-shrink-0 shadow-xs p-0 ${isWishlisted
                    ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "text-gray-700"
                    }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-700"}`} />
                </button>
              </div>

              {/* TRUST BADGES */}
              <div className="grid grid-cols-3 py-3 px-3 mt-3 bg-[#f4f7f8] rounded-xl border border-gray-100 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <Truck className="h-4 w-4 text-[#007084]" />
                  <span className="font-semibold text-xs text-gray-800">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 border-x border-gray-200/80 px-2">
                  <ShieldCheck className="h-4 w-4 text-[#007084]" />
                  <span className="font-semibold text-xs text-gray-800">100% Genuine</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <RotateCcw className="h-4 w-4 text-[#007084]" />
                  <span className="font-semibold text-xs text-gray-800">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            ABOUT THIS PRODUCT & PRODUCT DETAILS (2-COLUMN GRID)
        ====================================================== */}
        {(selectedProduct.description || selectedProduct.brand || selectedProduct.category || selectedProduct.wellnessGoal?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 my-6 items-stretch">
            {/* LEFT CARD: About this product */}
            <div className="bg-[#FAF8F5] rounded-2xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs h-full flex flex-col">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#F5EDE4] text-[#8C4A2F] flex items-center justify-center flex-shrink-0">
                  <Sprout className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#520000] tracking-tight">
                  About this product
                </h2>
              </div>

              <div className="flex-1 flex flex-col justify-start">
                {keyFeatures.length > 0 ? (
                  <ul className="flex flex-col gap-3.5 mt-2">
                    {keyFeatures.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <div className="w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full bg-[#520000] text-white flex items-center justify-center flex-shrink-0 text-[10px] font-extrabold shadow-xs">
                          ✓
                        </div>
                        <span className="text-sm md:text-[15px] font-normal text-stone-700 leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : selectedProduct.description ? (
                  <div
                    className="about-product-rich-text text-sm text-stone-700 leading-relaxed mt-2"
                    dangerouslySetInnerHTML={{
                      __html: formatProductDescription(selectedProduct.description, selectedProduct.name),
                    }}
                  />
                ) : (
                  <p className="text-sm text-stone-500 italic">No description available for this product.</p>
                )}
              </div>
            </div>

            {/* RIGHT CARD: Product Details */}
            <div className="bg-[#FAF8F5] rounded-2xl border border-[#EFEAE2] p-5 sm:p-6 shadow-xs h-full flex flex-col">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#F5EDE4] text-[#8C4A2F] flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#520000] tracking-tight">
                  Product Details
                </h2>
              </div>

              <div className="border border-[#EFEAE2] rounded-xl overflow-hidden bg-white shadow-xs flex-1 flex flex-col">
                <table className="w-full h-full text-sm text-left border-collapse">
                  <tbody>
                    {selectedProduct.brand && (
                      <tr className="border-b border-[#EFEAE2] last:border-b-0">
                        <td className="w-36 sm:w-44 py-3 sm:py-3.5 px-4 font-normal text-stone-500 bg-stone-50/40 border-r border-[#EFEAE2]">
                          Brand
                        </td>
                        <td className="py-3 sm:py-3.5 px-4 text-stone-700 font-normal">
                          {selectedProduct.brand}
                        </td>
                      </tr>
                    )}

                    {selectedProduct.category && (
                      <tr className="border-b border-[#EFEAE2] last:border-b-0">
                        <td className="w-36 sm:w-44 py-3 sm:py-3.5 px-4 font-normal text-stone-500 bg-stone-50/40 border-r border-[#EFEAE2]">
                          Category
                        </td>
                        <td className="py-3 sm:py-3.5 px-4 text-stone-700 font-normal capitalize">
                          {selectedProduct.category}
                        </td>
                      </tr>
                    )}

                    {selectedProduct.wellnessGoal?.length > 0 && (
                      <tr className="border-b border-[#EFEAE2] last:border-b-0">
                        <td className="w-36 sm:w-44 py-3 sm:py-3.5 px-4 font-normal text-stone-500 bg-stone-50/40 border-r border-[#EFEAE2] align-middle">
                          Wellness Goals
                        </td>
                        <td className="py-3 sm:py-3.5 px-4 text-stone-700">
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.wellnessGoal.map((goal, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-normal bg-[#DDF0F8] text-[#036B94] border border-[#BCE1F1]"
                              >
                                {goal}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr className="border-b border-[#EFEAE2] last:border-b-0">
                      <td className="w-36 sm:w-44 py-3 sm:py-3.5 px-4 font-normal text-stone-500 bg-stone-50/40 border-r border-[#EFEAE2]">
                        Country of Origin
                      </td>
                      <td className="py-3 sm:py-3.5 px-4 text-stone-700 font-normal">
                        {selectedProduct.countryOfOrigin || "India"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================
            PRODUCT REVIEWS
        ====================================================== */}
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 my-6 border border-gray-100">
          {selectedProduct?._id && (
            <ProductReviews productId={selectedProduct._id} />
          )}
        </div>

        {/* ======================================================
            RELATED PRODUCTS
        ====================================================== */}

        {(similarLoading || displayedRelatedProducts.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 my-6 border border-gray-100">
            <div className="mb-5 border-b border-gray-100 pb-3">
              <h2 className="font-display text-xl md:text-2xl font-bold text-herb-ink tracking-tight">
                Related Products
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Explore more products you may like
              </p>
            </div>

            {similarLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
                {[...Array(4)].map((_, i) => (
                  <ProductSkeleton key={`related-skel-${i}`} />
                ))}
              </div>
            ) : (
              <ProductGrid
                products={displayedRelatedProducts}
                loading={false}
                gridClassName="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
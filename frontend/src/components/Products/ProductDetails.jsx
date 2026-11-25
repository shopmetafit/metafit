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
  MapPin,
  CheckCircle2,
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

  /* Delivery Pincode checker state */
  const [deliveryPincode, setDeliveryPincode] = useState(() => {
    return localStorage.getItem("mwellness_pincode") || "313001";
  });
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [pincodeError, setPincodeError] = useState("");

  const calculateDeliveryEstimate = (code) => {
    const cleanCode = (code || "").trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setDeliveryEstimate(null);
      setPincodeError("Please enter a valid 6-digit pincode");
      return;
    }
    setPincodeError("");
    const now = new Date();
    const minDate = new Date(now);
    minDate.setDate(now.getDate() + 5);
    const maxDate = new Date(now);
    maxDate.setDate(now.getDate() + 7);

    const options = { weekday: "short", day: "numeric", month: "short" };
    setDeliveryEstimate({
      pincode: cleanCode,
      minDate: minDate.toLocaleDateString("en-IN", options),
      maxDate: maxDate.toLocaleDateString("en-IN", options),
    });
    localStorage.setItem("mwellness_pincode", cleanCode);
  };

  useEffect(() => {
    if (deliveryPincode && /^\d{6}$/.test(deliveryPincode.trim())) {
      calculateDeliveryEstimate(deliveryPincode);
    }
  }, []);

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setDeliveryPincode(val);
    if (val.length === 6) {
      calculateDeliveryEstimate(val);
    } else {
      setDeliveryEstimate(null);
      if (val.length > 0 && val.length < 6) {
        setPincodeError("");
      }
    }
  };

  const handleCheckPincode = () => {
    if (!deliveryPincode || deliveryPincode.length !== 6) {
      setPincodeError("Please enter a valid 6-digit pincode");
      setDeliveryEstimate(null);
    } else {
      calculateDeliveryEstimate(deliveryPincode);
    }
  };

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">

        {/* BACK TO DEALS */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#6E5D4B] hover:text-[#1A1612] font-normal cursor-pointer transition-colors"
          >
            <span>← Back to deals</span>
          </button>
        </div>

        {/* ====================================================
            MAIN PRODUCT SECTION (LOVABLE STYLE)
        ==================================================== */}

        <div className="mb-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

            {/* ==================================================
                LEFT - CLEAN IMAGE GALLERY
            ================================================== */}

            <div className="w-full lg:w-[46%] max-w-[490px] flex-shrink-0 mx-auto lg:mx-0 lg:sticky lg:top-28">
              {/* MAIN PRODUCT IMAGE CARD */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#ECE6DD] flex items-center justify-center">
                {mainImage === "video" ? (
                  <video
                    src={selectedProduct.videoUrl}
                    controls
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <img
                    src={mainImage || "https://via.placeholder.com/600"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover rounded-2xl transition-all duration-300"
                  />
                )}
              </div>

              {/* THUMBNAILS */}
              {allProductThumbnails.length > 1 && (
                <div className="flex items-center gap-2 mt-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("main-thumbnails-scroll");
                      if (el) el.scrollBy({ left: -120, behavior: "smooth" });
                    }}
                    className="w-8 h-8 rounded-full border border-[#E6DDD0] bg-white flex items-center justify-center text-[#5C4D3C] hover:text-[#1A1612] shadow-xs flex-shrink-0 cursor-pointer transition-colors"
                    aria-label="Previous thumbnails"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div id="main-thumbnails-scroll" className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none flex-1">
                    {selectedProduct?.videoUrl && (
                      <button
                        title="Product Video"
                        onClick={() => setMainImage("video")}
                        className={`w-16 h-16 rounded-xl border-2 overflow-hidden transition-all relative flex-shrink-0 cursor-pointer ${mainImage === "video"
                          ? "border-[#14110E] ring-2 ring-[#14110E]/15"
                          : "border-[#E6DDD0] hover:border-[#8E5E3C]"
                          }`}
                      >
                        <video src={selectedProduct.videoUrl} muted className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center">
                          <FaPlayCircle className="text-white text-lg" />
                          <span className="text-[8px] font-bold text-white uppercase">Video</span>
                        </div>
                      </button>
                    )}

                    {allProductThumbnails.map((imgUrl, i) => (
                      <button
                        key={`main-thumb-${i}`}
                        onClick={() => setMainImage(imgUrl)}
                        className={`w-16 h-16 flex-shrink-0 rounded-xl border-2 overflow-hidden bg-white transition-all cursor-pointer ${mainImage === imgUrl
                          ? "border-[#14110E] ring-2 ring-[#14110E]/15"
                          : "border-[#E6DDD0] hover:border-[#8E5E3C]"
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
                    className="w-8 h-8 rounded-full border border-[#E6DDD0] bg-white flex items-center justify-center text-[#5C4D3C] hover:text-[#1A1612] shadow-xs flex-shrink-0 cursor-pointer transition-colors"
                    aria-label="Next thumbnails"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ==================================================
                RIGHT - CLEAN PRODUCT DETAILS
            ================================================== */}

            <div className="flex-1 w-full min-w-0 pt-1">

              {/* BRAND & LOCATION / CATEGORY SUBTITLE */}
              {selectedProduct.brand && (
                <div className="mb-1.5 text-xs sm:text-sm text-[#6E5D4B] font-normal">
                  <Link
                    to={`/collections/all?brand=${encodeURIComponent(selectedProduct.brand.trim())}`}
                    className="hover:text-[#1A1612] transition-colors"
                  >
                    {selectedProduct.brand}
                  </Link>
                  {selectedProduct.origin ? (
                    <span> · {selectedProduct.origin}</span>
                  ) : selectedProduct.brandDetails?.location ? (
                    <span> · {selectedProduct.brandDetails.location}</span>
                  ) : selectedProduct.category ? (
                    <span className="capitalize"> · {selectedProduct.category}</span>
                  ) : null}
                </div>
              )}

              {/* PRODUCT NAME (SERIF) & COMPARE */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1612] font-bold tracking-tight leading-tight">
                  {selectedProduct.name}
                </h1>

                <button
                  type="button"
                  onClick={() => selectedProduct && dispatch(toggleCompare(selectedProduct))}
                  title={isCompared ? "In Comparison (Click to remove)" : "Compare with Other Products"}
                  aria-label={isCompared ? "Remove from comparison" : "Compare product"}
                  className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-xl border transition-all flex items-center justify-center cursor-pointer flex-shrink-0 mt-1 ${isCompared
                    ? "border-[#14110E] bg-[#14110E] text-white"
                    : "border-[#E6DDD0] bg-white text-[#6E5D4B] hover:border-[#8E5E3C] hover:text-[#1A1612]"
                    }`}
                >
                  <ArrowLeftRight className={`h-3.5 w-3.5 ${isCompared ? "stroke-[2.5]" : ""}`} />
                </button>
              </div>

              {activeReferral && (
                <div className="mb-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Recommended by Vendor
                </div>
              )}

              {/* RATING & STOCK */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                {totalReviews > 0 ? (
                  <div className="flex items-center gap-1.5 text-sm text-[#5C4D3C]">
                    <span className="text-[#B58250] text-sm leading-none">★</span>
                    <span className="font-semibold text-[#1A1612]">{formattedAverage}</span>
                    <span className="text-[#8C7A68]">·</span>
                    <span>{totalReviews} {totalReviews === 1 ? "rating" : "ratings"}</span>
                  </div>
                ) : (
                  <span className="text-xs text-[#6E5D4B] font-normal">
                    No ratings yet
                  </span>
                )}

                {selectedProduct.countInStock !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium ${
                      selectedProduct.countInStock > 0
                        ? "bg-[#B58250]/15 text-[#7A5229]"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {selectedProduct.countInStock > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                )}
              </div>

              {/* PRICE (DIRECT CLEAN TYPOGRAPHY LIKE LOVABLE) */}
              {!selectedProduct.hasVariants ? (
                (() => {
                  let displayPrice =
                    selectedProduct.discountPrice ||
                    selectedProduct.price;

                  let displayMrp =
                    selectedProduct.price;

                  if (
                    selectedSize &&
                    typeof selectedSize === "string" &&
                    selectedSize.includes(":")
                  ) {
                    const parts = selectedSize.split(":");
                    if (parts.length === 3) {
                      if (!isNaN(Number(parts[1]))) displayMrp = Number(parts[1]);
                      if (!isNaN(Number(parts[2]))) displayPrice = Number(parts[2]);
                    } else if (parts.length === 2) {
                      if (!isNaN(Number(parts[1]))) displayPrice = Number(parts[1]);
                    }
                  }

                  const computedDiscountPct =
                    displayMrp && displayMrp > displayPrice
                      ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
                      : 0;

                  return (
                    <div className="mb-5">
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-bold text-[#1A1612] tracking-tight">
                          {formatCurrency(displayPrice)}
                        </span>

                        {displayMrp && displayMrp > displayPrice && (
                          <span className="text-sm sm:text-base text-[#8C7A68] line-through font-normal">
                            {formatCurrency(displayMrp)}
                          </span>
                        )}

                        {computedDiscountPct > 0 && (
                          <span className="text-sm sm:text-base font-medium text-[#4A7A3F]">
                            {computedDiscountPct}% off
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="mb-5">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-bold text-[#1A1612] tracking-tight">
                      {formatCurrency(
                        selectedVariant?.discountPrice ||
                        selectedVariant?.price ||
                        getVariantPriceRange(selectedProduct.variants)
                      )}
                    </span>
                    {selectedVariant?.discountPrice &&
                      selectedVariant?.price &&
                      selectedVariant.discountPrice < selectedVariant.price && (
                        <span className="text-sm sm:text-base text-[#8C7A68] line-through font-normal">
                          {formatCurrency(selectedVariant.price)}
                        </span>
                      )}
                    {selectedVariant?.discountPrice &&
                      selectedVariant?.price &&
                      selectedVariant.discountPrice < selectedVariant.price && (
                        <span className="text-sm sm:text-base font-medium text-[#4A7A3F]">
                          {Math.round(
                            ((selectedVariant.price - selectedVariant.discountPrice) /
                              selectedVariant.price) *
                            100
                          )}
                          % off
                        </span>
                      )}
                  </div>
                </div>
              )}

              {/* VARIANTS (TYPE) */}
              {selectedProduct.hasVariants &&
                selectedProduct.variants?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-[#6E5D4B] font-normal mb-2">
                      Type:{" "}
                      <span className="font-semibold text-[#1A1612]">
                        {selectedVariant?.label || "Select option"}
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map((variant, idx) => {
                        const isVariantSelected = selectedVariant?.label === variant.label;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedVariant(variant)}
                            className={`px-4 py-2 rounded-xl text-sm transition-all cursor-pointer border ${
                              isVariantSelected
                                ? "bg-[#14110E] text-white border-[#14110E] font-medium"
                                : "border-[#E6DDD0] bg-white text-[#1A1612] hover:border-[#8E5E3C] font-normal"
                            }`}
                          >
                            {variant.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* SIZES */}
              {selectedProduct.sizes?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-[#6E5D4B] font-normal mb-2">
                    Size:{" "}
                    <span className="font-semibold text-[#1A1612]">
                      {selectedSize ? selectedSize.split(":")[0] : ""}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sizes.map((sizeRaw, i) => {
                      const sizeName = sizeRaw.split(":")[0];
                      const isSelected = selectedSize === sizeRaw;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedSize(sizeRaw)}
                          className={`px-4 py-2 rounded-xl text-sm transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-[#14110E] text-white border-[#14110E] font-medium"
                              : "border-[#E6DDD0] bg-white text-[#1A1612] hover:border-[#8E5E3C] font-normal"
                          }`}
                        >
                          {sizeName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* COLORS */}
              {selectedProduct.colors?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-normal text-[#6E5D4B] mb-2">
                    Color:
                  </p>

                  <div className="flex flex-wrap gap-2.5">
                    {selectedProduct.colors.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => handleColorClick(color, i)}
                        title={selectedProduct.colorsName?.[i] || color}
                        className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                          selectedColor === color
                            ? "ring-2 ring-[#14110E] ring-offset-2 border-white"
                            : "border-[#E6DDD0] hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ==================================================
                  DELIVERY PINCODE CHECKER
              ================================================== */}
              <div className="my-5 p-4 rounded-2xl border border-[#E6DDD0] bg-white">
                <div className="flex items-center gap-2 mb-2.5">
                  <MapPin className="h-4 w-4 text-[#14110E]" />
                  <span className="text-sm font-semibold text-[#1A1612]">Delivery</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={deliveryPincode}
                    onChange={handlePincodeChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCheckPincode();
                      }
                    }}
                    placeholder="Enter Pincode"
                    className="flex-1 h-10 px-3.5 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2] text-sm text-[#1A1612] placeholder:text-[#9C8E7E] focus:outline-none focus:border-[#14110E] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleCheckPincode}
                    className="h-10 px-5 rounded-xl bg-[#14110E] hover:bg-black active:scale-[0.98] text-white text-sm font-medium transition-all cursor-pointer shrink-0"
                  >
                    Check
                  </button>
                </div>

                {pincodeError && (
                  <p className="text-xs text-rose-600 mt-2 font-medium">
                    {pincodeError}
                  </p>
                )}

                {deliveryEstimate && (
                  <div className="mt-3 pt-3 border-t border-[#F0EBE1] flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[#2E7D32] shrink-0" />
                    <p className="text-sm font-medium text-[#1A1612]">
                      Delivery by <span className="font-semibold text-[#14110E]">{deliveryEstimate.minDate} – {deliveryEstimate.maxDate}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* ==================================================
                  ACTION BUTTONS & QUANTITY CONTROLS
              ================================================== */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 my-5">
                {cartQuantity > 0 ? (
                  /* CART QUANTITY CONTROL */
                  <div className="flex-1 h-11 flex items-center justify-between sm:justify-center border-[1.5px] border-[#14110E] bg-[#F3EBE0] rounded-xl px-3">
                    <button
                      type="button"
                      onClick={handleDecrementCart}
                      disabled={isButtonDisabled}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-[#FAF6F0] text-[#1A1612] rounded-lg transition-colors border border-[#E6DDD0] disabled:opacity-50 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>

                    <div className="flex flex-col items-center justify-center px-4">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#6E5D4B]">In Cart</span>
                      <span className="font-bold text-[#1A1612] text-sm leading-none">
                        {isButtonDisabled ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#14110E]" /> : cartQuantity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleIncrementCart}
                      disabled={isButtonDisabled}
                      className="w-8 h-8 flex items-center justify-center bg-white hover:bg-[#FAF6F0] text-[#1A1612] rounded-lg transition-colors border border-[#E6DDD0] disabled:opacity-50 cursor-pointer"
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
                    className="flex-1 h-11 flex items-center justify-center gap-2 px-5 rounded-xl font-medium text-sm text-white bg-[#14110E] hover:bg-black active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-4 w-4 text-white" />
                    <span>{isButtonDisabled ? "Adding..." : "Add to Cart"}</span>
                  </button>
                )}

                {/* BUY NOW */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isButtonDisabled || isBuyNowLoading}
                  className="flex-1 h-11 flex items-center justify-center gap-2 px-5 rounded-xl font-medium text-sm text-white bg-[#8E5E3C] hover:bg-[#7D5233] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-4 w-4 fill-white text-white" />
                  <span>{isBuyNowLoading ? "Processing..." : "Buy Now"}</span>
                </button>

                {/* WISHLIST HEART BUTTON */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 p-0 ${
                    isWishlisted
                      ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      : "border-[#E6DDD0] bg-white text-[#1A1612] hover:border-[#8E5E3C]"
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-[#1A1612]"}`} />
                </button>
              </div>

              {/* TRUST BADGES */}
              <div className="grid grid-cols-3 py-3 px-3 mt-4 bg-[#FAF7F0] rounded-xl border border-[#E6DDD0] divide-x divide-[#E6DDD0] text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <Truck className="h-4 w-4 text-[#8E5E3C]" />
                  <span className="font-medium text-xs text-[#1A1612]">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 px-2">
                  <ShieldCheck className="h-4 w-4 text-[#8E5E3C]" />
                  <span className="font-medium text-xs text-[#1A1612]">100% Genuine</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <RotateCcw className="h-4 w-4 text-[#8E5E3C]" />
                  <span className="font-medium text-xs text-[#1A1612]">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            ABOUT THIS PRODUCT & PRODUCT DETAILS (2-COLUMN GRID)
        ====================================================== */}
        {(selectedProduct.description || selectedProduct.brand || selectedProduct.category || selectedProduct.wellnessGoal?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8 items-stretch">
            {/* LEFT CARD: About this product */}
            <div className="bg-[#FDFBF6] rounded-2xl border border-[#E6DDD0] p-5 sm:p-7 shadow-xs h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#EFEAE2]">
                <div className="w-9 h-9 rounded-xl bg-[#F3EBE0] border border-[#E6DDD0] text-[#443524] flex items-center justify-center flex-shrink-0">
                  <Sprout className="w-4.5 h-4.5" />
                </div>
                <h2 className="font-serif text-xl md:text-2xl font-bold text-[#242221] tracking-tight">
                  About this product
                </h2>
              </div>

              <div className="flex-1 flex flex-col justify-start">
                {keyFeatures.length > 0 ? (
                  <ul className="flex flex-col gap-3.5 mt-1">
                    {keyFeatures.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 min-w-[20px] min-h-[20px] rounded-full bg-[#443524] text-[#DAB78C] flex items-center justify-center flex-shrink-0 text-[10px] font-extrabold shadow-xs mt-0.5">
                          ✓
                        </div>
                        <span className="text-sm md:text-[15px] font-normal text-[#3d352c] leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : selectedProduct.description ? (
                  <div
                    className="about-product-rich-text text-sm text-[#3d352c] leading-relaxed mt-1"
                    dangerouslySetInnerHTML={{
                      __html: formatProductDescription(selectedProduct.description, selectedProduct.name),
                    }}
                  />
                ) : (
                  <p className="text-sm text-[#6E5D4B] italic">No description available for this product.</p>
                )}
              </div>
            </div>

            {/* RIGHT CARD: Product Details */}
            <div className="bg-[#FDFBF6] rounded-2xl border border-[#E6DDD0] p-5 sm:p-7 shadow-xs h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#EFEAE2]">
                <div className="w-9 h-9 rounded-xl bg-[#F3EBE0] border border-[#E6DDD0] text-[#443524] flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <h2 className="font-serif text-xl md:text-2xl font-bold text-[#242221] tracking-tight">
                  Product Details
                </h2>
              </div>

              <div className="border border-[#E6DDD0] rounded-xl overflow-hidden bg-white shadow-xs flex-1 flex flex-col">
                <table className="w-full h-full text-sm text-left border-collapse">
                  <tbody>
                    {selectedProduct.brand && (
                      <tr className="border-b border-[#E6DDD0] last:border-b-0">
                        <td className="w-36 sm:w-44 py-3 sm:py-3.5 px-4 font-medium text-[#6E5D4B] bg-[#FAF6F0] border-r border-[#E6DDD0]">
                          Brand
                        </td>
                        <td className="py-3 sm:py-3.5 px-4 text-[#242221] font-medium">
                          {selectedProduct.brand}
                        </td>
                      </tr>
                    )}

                    {selectedProduct.category && (
                      <tr className="border-b border-[#E6DDD0] last:border-b-0">
                        <td className="w-36 sm:w-44 py-3 sm:py-3.5 px-4 font-medium text-[#6E5D4B] bg-[#FAF6F0] border-r border-[#E6DDD0]">
                          Category
                        </td>
                        <td className="py-3 sm:py-3.5 px-4 text-[#242221] font-medium capitalize">
                          {selectedProduct.category}
                        </td>
                      </tr>
                    )}

                    {selectedProduct.wellnessGoal?.length > 0 && (
                      <tr className="border-b border-[#E6DDD0] last:border-b-0">
                        <td className="w-36 sm:w-44 py-3 sm:py-3.5 px-4 font-medium text-[#6E5D4B] bg-[#FAF6F0] border-r border-[#E6DDD0] align-middle">
                          Wellness Goals
                        </td>
                        <td className="py-3 sm:py-3.5 px-4 text-[#242221]">
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.wellnessGoal.map((goal, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F3EBE0] text-[#443524] border border-[#DFD3C3]"
                              >
                                {goal}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}

                    <tr className="border-b border-[#E6DDD0] last:border-b-0">
                      <td className="w-36 sm:w-44 py-3 sm:py-3.5 px-4 font-medium text-[#6E5D4B] bg-[#FAF6F0] border-r border-[#E6DDD0]">
                        Country of Origin
                      </td>
                      <td className="py-3 sm:py-3.5 px-4 text-[#242221] font-medium">
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
        <div className="bg-[#FDFBF6] rounded-2xl shadow-xs p-5 md:p-7 my-8 border border-[#E6DDD0]">
          {selectedProduct?._id && (
            <ProductReviews productId={selectedProduct._id} />
          )}
        </div>

        {/* ======================================================
            RELATED PRODUCTS
        ====================================================== */}

        {(similarLoading || displayedRelatedProducts.length > 0) && (
          <div className="bg-[#FDFBF6] rounded-2xl shadow-xs p-5 sm:p-7 my-8 border border-[#E6DDD0]">
            <div className="mb-5 border-b border-[#EFEAE2] pb-3">
              <h2 className="font-serif text-xl md:text-2xl font-bold text-[#242221] tracking-tight">
                Related Products
              </h2>
              <p className="text-xs sm:text-sm text-[#6E5D4B] mt-1">
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
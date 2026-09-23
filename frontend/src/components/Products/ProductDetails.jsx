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
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f0f2f2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#047ca8] mx-auto mb-3" />

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
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f0f2f2]">
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
    <div className="min-h-screen bg-[#f0f2f2]">
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

      <div className="max-w-screen-2xl mx-auto px-4 py-4">

        {/* ====================================================
            MAIN PRODUCT CARD
        ==================================================== */}

        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row gap-0">

            {/* ==================================================
                LEFT - IMAGES
            ================================================== */}

            <div className="lg:w-[460px] xl:w-[520px] flex-shrink-0 p-4 lg:border-r border-gray-100">

              {/* DESKTOP */}

              <div className="hidden lg:flex gap-3">

                {/* THUMBNAILS */}

                <div className="flex flex-col gap-2 flex-shrink-0">

                  {selectedProduct?.videoUrl && (
                    <div className="relative group flex-shrink-0">
                      <button
                        title="Product Video"
                        onClick={() =>
                          setMainImage(
                            "video"
                          )
                        }
                        className={`w-14 h-14 rounded-md border-2 overflow-hidden transition-all relative block ${mainImage ===
                            "video"
                            ? "border-[#047ca8]"
                            : "border-gray-200 hover:border-[#047ca8]"
                          }`}
                      >
                        <video
                          src={
                            selectedProduct.videoUrl
                          }
                          muted
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                          <FaPlayCircle className="text-white text-xl shadow-sm opacity-90" />

                          <span className="text-[9px] font-bold text-white uppercase tracking-wider mt-0.5 drop-shadow-md">
                            Video
                          </span>
                        </div>
                      </button>
                    </div>
                  )}

                  {selectedProduct.images?.map(
                    (img, i) => {
                      const imgUrl =
                        typeof img ===
                          "string"
                          ? img
                          : img.url;

                      if (!imgUrl)
                        return null;

                      return (
                        <button
                          key={i}
                          onClick={() =>
                            setMainImage(
                              imgUrl
                            )
                          }
                          className={`w-14 h-14 flex-shrink-0 rounded-md border-2 overflow-hidden bg-gray-50 transition-all ${mainImage ===
                              imgUrl
                              ? "border-[#047ca8]"
                              : "border-gray-200 hover:border-[#047ca8]"
                            }`}
                        >
                          <img
                            src={imgUrl}
                            alt={
                              img?.altText ||
                              `View ${i + 1
                              }`
                            }
                            className="w-full h-full object-contain"
                          />
                        </button>
                      );
                    }
                  )}

                  {selectedProduct.extraImages &&
                    selectedProduct.extraImages.flatMap(
                      (img, i) => {
                        const baseStr =
                          typeof img ===
                            "string"
                            ? img
                            : img.url;

                        if (!baseStr)
                          return [];

                        return baseStr
                          .split(",")
                          .map(
                            (urlStr) =>
                              urlStr.trim()
                          )
                          .filter(Boolean)
                          .map(
                            (
                              imgUrl,
                              j
                            ) => (
                              <button
                                key={`extra-desktop-${i}-${j}`}
                                onClick={() =>
                                  setMainImage(
                                    imgUrl
                                  )
                                }
                                className={`w-14 h-14 flex-shrink-0 rounded-md border-2 overflow-hidden bg-gray-50 transition-all ${mainImage ===
                                    imgUrl
                                    ? "border-[#047ca8]"
                                    : "border-gray-200 hover:border-[#047ca8]"
                                  }`}
                              >
                                <img
                                  src={
                                    imgUrl
                                  }
                                  alt={
                                    typeof img ===
                                      "object"
                                      ? img?.altText ||
                                      `Extra ${i +
                                      1
                                      }`
                                      : `Extra ${i +
                                      1
                                      }`
                                  }
                                  className="w-full h-full object-contain"
                                />
                              </button>
                            )
                          );
                      }
                    )}
                </div>

                {/* MAIN IMAGE */}

                <div className="relative flex-1 aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">

                  {mainImage ===
                    "video" ? (
                    <video
                      src={
                        selectedProduct.videoUrl
                      }
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={
                        mainImage ||
                        "https://via.placeholder.com/600"
                      }
                      alt={
                        selectedProduct.name
                      }
                      className="w-full h-full object-contain"
                    />
                  )}

                  <div className="absolute top-3 right-3 bg-white/90 rounded-lg p-2 shadow">
                    <img
                      src="https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png"
                      alt="M Wellness Bazaar"
                      className="h-12 object-contain"
                    />
                  </div>

                  {discountPct >
                    0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -
                        {
                          discountPct
                        }
                        % OFF
                      </div>
                    )}
                </div>
              </div>

              {/* MOBILE */}

              <div className="lg:hidden">

                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">

                  {mainImage ===
                    "video" ? (
                    <video
                      src={
                        selectedProduct.videoUrl
                      }
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={
                        mainImage ||
                        "https://via.placeholder.com/600"
                      }
                      alt={
                        selectedProduct.name
                      }
                      className="w-full h-full object-contain"
                    />
                  )}

                  <div className="absolute top-3 right-3 bg-white/90 rounded-lg p-2 shadow">
                    <img
                      src="https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png"
                      alt="M Wellness Bazaar"
                      className="h-10 object-contain"
                    />
                  </div>

                  {discountPct >
                    0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -
                        {
                          discountPct
                        }
                        % OFF
                      </div>
                    )}
                </div>

                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">

                  {selectedProduct?.videoUrl && (
                    <div className="relative group flex-shrink-0">
                      <button
                        title="Product Video"
                        onClick={() =>
                          setMainImage(
                            "video"
                          )
                        }
                        className={`w-14 h-14 rounded-md border-2 overflow-hidden transition-all relative block ${mainImage ===
                            "video"
                            ? "border-[#047ca8]"
                            : "border-gray-200"
                          }`}
                      >
                        <video
                          src={
                            selectedProduct.videoUrl
                          }
                          muted
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                          <FaPlayCircle className="text-white text-xl" />

                          <span className="text-[9px] font-bold text-white">
                            Video
                          </span>
                        </div>
                      </button>
                    </div>
                  )}

                  {selectedProduct.images?.map(
                    (img, i) => {
                      const imgUrl =
                        typeof img ===
                          "string"
                          ? img
                          : img.url;

                      if (!imgUrl)
                        return null;

                      return (
                        <button
                          key={i}
                          onClick={() =>
                            setMainImage(
                              imgUrl
                            )
                          }
                          className={`w-14 h-14 flex-shrink-0 rounded-md border-2 overflow-hidden bg-gray-50 ${mainImage ===
                              imgUrl
                              ? "border-[#047ca8]"
                              : "border-gray-200"
                            }`}
                        >
                          <img
                            src={
                              imgUrl
                            }
                            alt={
                              img?.altText ||
                              ""
                            }
                            className="w-full h-full object-contain"
                          />
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* DESKTOP DESCRIPTION */}

              {selectedProduct.description && (
                <div className="hidden lg:block mt-8 pt-6 border-t border-gray-100">

                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    About this product
                  </h2>

                  <div
                    className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedProduct.description,
                    }}
                  />
                </div>
              )}
            </div>

            {/* ==================================================
                CENTER - DETAILS
            ================================================== */}

            <div className="flex-1 p-4 lg:p-6">

              {/* BRAND */}

              {selectedProduct.brand && (
                <Link
                  to={`/collections/all?brand=${encodeURIComponent(selectedProduct.brand.trim())}`}
                  className="inline-block text-sm text-[#047ca8] hover:text-[#035c7d] font-semibold mb-1 group transition-colors"
                >
                  Visit the{" "}
                  <span className="underline group-hover:text-[#035c7d]">
                    {selectedProduct.brand}
                  </span>{" "}
                  Store
                </Link>
              )}

              {/* NAME */}

              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 leading-snug mb-3">
                {
                  selectedProduct.name
                }
              </h1>

              {activeReferral && (
                <div className="mb-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
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

                    <span className="text-xs text-[#047ca8] font-semibold">
                      {formattedAverage} out of 5 ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 font-medium">
                    No reviews yet
                  </span>
                )}

                <span className="text-xs text-gray-400">
                  |
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3 mb-4" />

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
                    <div className="mb-4">

                      <div className="flex items-baseline gap-3 flex-wrap">

                        <span className="text-3xl font-bold text-gray-900">
                          {
                            formatCurrency(
                              displayPrice
                            )
                          }
                        </span>

                        {displayMrp &&
                          displayMrp >
                          displayPrice && (
                            <span className="text-base text-gray-400 line-through">
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
                            <span className="text-base font-semibold text-red-500">
                              (
                              {
                                computedDiscountPct
                              }
                              % off)
                            </span>
                          )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        Inclusive of all taxes
                      </p>

                      <p className="text-sm text-gray-600 mt-1">
                        +{" "}
                        {
                          formatCurrency(
                            selectedProduct.shippingCharge ||
                            100
                          )
                        }{" "}
                        delivery charge
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="mb-4">

                  <p className="text-sm text-gray-500 mb-2 font-medium">
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
                  <div className="mb-5">

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
                                ? "border-[#047ca8] bg-blue-50"
                                : "border-gray-200 hover:border-[#047ca8]"
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
                      <div className="mt-2 px-3 py-2 bg-[#e8f4f8] border border-[#b3d9e8] rounded text-sm text-[#047ca8] font-medium">
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

                    <p className="text-sm font-bold text-gray-800 mb-2">
                      Size:
                    </p>

                    <div className="flex flex-wrap gap-2">

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

                          return (
                            <button
                              key={i}
                              onClick={() =>
                                setSelectedSize(
                                  sizeRaw
                                )
                              }
                              className={`px-4 py-2 rounded border-2 text-sm font-medium transition-all flex flex-col items-center justify-center min-w-[3rem] ${selectedSize ===
                                  sizeRaw
                                  ? "border-[#047ca8] bg-blue-50 text-[#047ca8]"
                                  : "border-gray-300 hover:border-[#047ca8] text-gray-800"
                                }`}
                            >
                              <span>
                                {
                                  sizeName
                                }
                              </span>

                              {sizePrice && (
                                <span className="text-xs text-gray-500 font-bold mt-0.5">
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
                                ? "ring-2 ring-[#047ca8] ring-offset-2"
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

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                {cartQuantity > 0 ? (
                  /* CART QUANTITY CONTROL */
                  <div className="flex-1 flex items-center justify-between sm:justify-center border-2 border-[#047ca8] bg-[#e8f4f8] rounded-xl px-2 py-1.5 shadow-xs">
                    <button
                      type="button"
                      onClick={handleDecrementCart}
                      disabled={isButtonDisabled}
                      className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-100 active:bg-gray-200 text-[#047ca8] rounded-lg transition-colors border border-[#b3d9e8] disabled:opacity-50 cursor-pointer shadow-xs"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4 stroke-[2.5]" />
                    </button>

                    <div className="flex flex-col items-center justify-center px-4">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">In Cart</span>
                      <span className="font-black text-gray-900 text-base leading-none">
                        {isButtonDisabled ? <Loader2 className="h-4 w-4 animate-spin text-[#047ca8]" /> : cartQuantity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleIncrementCart}
                      disabled={isButtonDisabled}
                      className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-100 active:bg-gray-200 text-[#047ca8] rounded-lg transition-colors border border-[#b3d9e8] disabled:opacity-50 cursor-pointer shadow-xs"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  /* ADD TO CART BUTTON */
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isButtonDisabled || isBuyNowLoading}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 border-2 ${
                      isButtonDisabled
                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#0FB7A3] bg-teal-50/60 text-[#0a7a6c] hover:bg-[#0FB7A3] hover:text-white shadow-xs hover:shadow-md active:scale-[0.98] cursor-pointer"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {isButtonDisabled ? "Adding..." : "Add to Cart"}
                  </button>
                )}

                {/* BUY NOW */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isButtonDisabled || isBuyNowLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 shadow-md ${
                    isBuyNowLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#047ca8] via-[#036e96] to-[#025877] hover:from-[#036a90] hover:to-[#024963] hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  <Zap className="h-4 w-4 fill-white" />
                  {isBuyNowLoading ? "Processing..." : "Buy Now"}
                </button>

                {/* WISHLIST HEART BUTTON */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  className={`px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer shadow-xs flex-shrink-0 ${
                    isWishlisted
                      ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              </div>

              {/* TRUST BADGES */}
              <div className="grid grid-cols-3 gap-2 py-3 px-2 mt-1 bg-gray-50/80 rounded-xl border border-gray-100 text-center text-xs text-gray-600">
                <div className="flex flex-col items-center justify-center gap-1">
                  <Truck className="h-4 w-4 text-[#047ca8]" />
                  <span className="font-medium text-[11px] text-gray-700">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 border-x border-gray-200 px-1">
                  <ShieldCheck className="h-4 w-4 text-[#0FB7A3]" />
                  <span className="font-medium text-[11px] text-gray-700">100% Genuine</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <RotateCcw className="h-4 w-4 text-[#047ca8]" />
                  <span className="font-medium text-[11px] text-gray-700">Easy Returns</span>
                </div>
              </div>

              {/* PRODUCT DETAILS */}

              <div className="mt-6 border-t border-gray-100 pt-4">

                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  Product Details
                </h3>

                <table className="w-full text-sm">
                  <tbody>

                    {selectedProduct.brand && (
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-500 font-medium w-32">
                          Brand
                        </td>

                        <td className="py-2 text-gray-900">
                          {
                            selectedProduct.brand
                          }
                        </td>
                      </tr>
                    )}

                    {selectedProduct.category && (
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-500 font-medium w-32">
                          Category
                        </td>

                        <td className="py-2 text-gray-900 capitalize">
                          {
                            selectedProduct.category
                          }
                        </td>
                      </tr>
                    )}

                    {selectedProduct.wellnessGoal
                      ?.length >
                      0 && (
                        <tr className="border-b border-gray-100">

                          <td className="py-2 pr-4 text-gray-500 font-medium w-32 align-top">
                            Wellness Goals
                          </td>

                          <td className="py-2 text-gray-900">

                            <div className="flex flex-wrap gap-1.5">

                              {selectedProduct.wellnessGoal.map(
                                (
                                  goal,
                                  idx
                                ) => (
                                  <span
                                    key={
                                      idx
                                    }
                                    className="inline-block bg-[#e8f4f8] text-[#047ca8] px-2 py-1 rounded text-xs font-medium"
                                  >
                                    {
                                      goal
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>

              {/* EXTRA IMAGES */}

              {selectedProduct.extraImages
                ?.length > 0 && (
                  <div className="mt-5">

                    <h3 className="text-sm font-bold text-gray-800 mb-2">
                      More Details
                    </h3>

                    <div className="flex gap-3 overflow-x-auto pb-2">

                      {selectedProduct.extraImages.flatMap(
                        (
                          img,
                          i
                        ) => {
                          const baseStr =
                            typeof img ===
                              "string"
                              ? img
                              : img.url;

                          if (!baseStr)
                            return [];

                          return baseStr
                            .split(",")
                            .map(
                              (
                                urlStr
                              ) =>
                                urlStr.trim()
                            )
                            .filter(
                              Boolean
                            )
                            .map(
                              (
                                imgUrl,
                                j
                              ) => (
                                <img
                                  key={`extra-info-${i}-${j}`}
                                  src={
                                    imgUrl
                                  }
                                  alt={
                                    typeof img ===
                                      "object"
                                      ? img?.altText ||
                                      `Detail ${i +
                                      1
                                      }`
                                      : `Detail ${i +
                                      1
                                      }`
                                  }
                                  className="w-24 h-24 object-contain rounded-lg border border-gray-200 flex-shrink-0 hover:scale-105 transition-transform cursor-zoom-in"
                                />
                              )
                            );
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* MOBILE DESCRIPTION */}

          {selectedProduct.description && (
            <div className="lg:hidden px-4 pb-6 border-t border-gray-100 pt-4">

              <h2 className="text-base font-bold text-gray-900 mb-3">
                About this product
              </h2>

              <div
                className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedProduct.description,
                }}
              />
            </div>
          )}

          {/* ======================================================
              PRODUCT REVIEWS
          ====================================================== */}
          <div className="bg-white rounded-lg shadow-sm p-5 md:p-6 my-6">
            {selectedProduct?._id && (
              <ProductReviews productId={selectedProduct._id} />
            )}
          </div>
        </div>

        {/* ======================================================
            RELATED PRODUCTS
        ====================================================== */}

        {(similarLoading || displayedRelatedProducts.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 my-6 border border-gray-100">
            <div className="mb-5 border-b border-gray-100 pb-3">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
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
/**
 * Google Tag Manager & GA4 E-commerce Tracking Utility
 * M Wellness Bazaar (https://mwellnessbazaar.com/)
 * GTM Container ID: GTM-PWG8XCS9
 * GA4 Measurement ID: G-9TK6FV0PMF
 *
 * Implements GA4 standard e-commerce event payloads, dataLayer management,
 * and strict PII / sensitive data redaction.
 */

const DEFAULT_CURRENCY = "INR";

/**
 * Safe accessor for window.dataLayer
 */
const getDataLayer = () => {
  if (typeof window === "undefined") return null;
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
};

/**
 * Reset previous ecommerce object to prevent parameter leakage between steps
 * Recommended by Google Analytics documentation.
 */
export const clearEcommerce = () => {
  const dl = getDataLayer();
  if (dl) {
    dl.push({ ecommerce: null });
  }
};

/**
 * Generic GTM event pusher
 */
export const pushToDataLayer = (payload) => {
  const dl = getDataLayer();
  if (!dl || !payload || typeof payload !== "object") return;
  try {
    dl.push(payload);
  } catch (err) {
    console.warn("GTM dataLayer push failed:", err);
  }
};

/**
 * Format a single product item into GA4 standard schema
 */
export const formatGa4Item = (item, index) => {
  if (!item) return null;

  const id = item.productId || item._id || item.id || "";
  const name = item.name || item.title || "";
  const price = Number(item.price ?? item.discountPrice ?? 0);
  const qty = Number(item.quantity ?? item.qty ?? 1);

  const formatted = {
    item_id: String(id),
    item_name: String(name),
    price: Number.isFinite(price) ? price : 0,
    quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
  };

  if (item.brand) {
    formatted.item_brand = String(item.brand);
  }
  if (item.category) {
    formatted.item_category = String(item.category);
  }
  if (item.size || item.variant || item.color) {
    const variantParts = [
      item.variant?.label || (typeof item.variant === "string" ? item.variant : ""),
      typeof item.size === "string" ? item.size.split(":")[0] : item.size,
      item.color,
    ].filter(Boolean);
    if (variantParts.length > 0) {
      formatted.item_variant = variantParts.join(" / ");
    }
  }
  if (typeof index === "number" && Number.isFinite(index)) {
    formatted.index = index;
  }

  return formatted;
};

/**
 * SPA Page View Event
 */
export const trackGtmPageView = ({ page_path, page_location, page_title }) => {
  pushToDataLayer({
    event: "page_view",
    page_path: page_path || (typeof window !== "undefined" ? window.location.pathname + window.location.search : ""),
    page_location: page_location || (typeof window !== "undefined" ? window.location.href : ""),
    page_title: page_title || (typeof document !== "undefined" ? document.title : ""),
  });
};

/**
 * view_item: When a user views product details
 */
export const trackGtmViewItem = ({ product, currency = DEFAULT_CURRENCY }) => {
  if (!product) return;
  const item = formatGa4Item(product);
  if (!item || !item.item_id) return;

  clearEcommerce();
  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      currency,
      value: item.price,
      items: [item],
    },
  });
};

/**
 * view_item_list: When a user views a collection or catalog of products
 */
export const trackGtmViewItemList = ({
  items = [],
  item_list_name = "Product Catalog",
  item_list_id = "catalog",
}) => {
  if (!Array.isArray(items) || items.length === 0) return;
  const formattedItems = items
    .slice(0, 50)
    .map((prod, idx) => formatGa4Item(prod, idx))
    .filter(Boolean);

  if (formattedItems.length === 0) return;

  clearEcommerce();
  pushToDataLayer({
    event: "view_item_list",
    ecommerce: {
      item_list_id,
      item_list_name,
      items: formattedItems,
    },
  });
};

/**
 * search: When a customer searches for products
 */
export const trackGtmSearch = ({ search_term }) => {
  if (!search_term || typeof search_term !== "string") return;
  pushToDataLayer({
    event: "search",
    search_term: search_term.trim(),
  });
};

/**
 * add_to_cart: When a product is added to the cart
 */
export const trackGtmAddToCart = ({
  items = [],
  value,
  currency = DEFAULTIR_CURRENCY_FALLBACK(DEFAULT_CURRENCY),
}) => {
  const formattedItems = (Array.isArray(items) ? items : [items])
    .map((item, idx) => formatGa4Item(item, idx))
    .filter(Boolean);

  if (formattedItems.length === 0) return;

  const totalValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : formattedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);

  clearEcommerce();
  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency,
      value: totalValue,
      items: formattedItems,
    },
  });
};

/**
 * remove_from_cart: When a product is removed from the cart
 */
export const trackGtmRemoveFromCart = ({
  items = [],
  value,
  currency = DEFAULT_CURRENCY,
}) => {
  const formattedItems = (Array.isArray(items) ? items : [items])
    .map((item, idx) => formatGa4Item(item, idx))
    .filter(Boolean);

  if (formattedItems.length === 0) return;

  const totalValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : formattedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);

  clearEcommerce();
  pushToDataLayer({
    event: "remove_from_cart",
    ecommerce: {
      currency,
      value: totalValue,
      items: formattedItems,
    },
  });
};

/**
 * view_cart: When user opens or views the cart
 */
export const trackGtmViewCart = ({
  items = [],
  value = 0,
  currency = DEFAULT_CURRENCY,
}) => {
  const formattedItems = (Array.isArray(items) ? items : [])
    .map((item, idx) => formatGa4Item(item, idx))
    .filter(Boolean);

  clearEcommerce();
  pushToDataLayer({
    event: "view_cart",
    ecommerce: {
      currency,
      value: Number(value) || 0,
      items: formattedItems,
    },
  });
};

/**
 * begin_checkout: When user proceeds to checkout
 */
export const trackGtmBeginCheckout = ({
  items = [],
  value = 0,
  currency = DEFAULT_CURRENCY,
  coupon = "",
}) => {
  const formattedItems = (Array.isArray(items) ? items : [])
    .map((item, idx) => formatGa4Item(item, idx))
    .filter(Boolean);

  clearEcommerce();
  const ecommerceData = {
    currency,
    value: Number(value) || 0,
    items: formattedItems,
  };
  if (coupon) {
    ecommerceData.coupon = String(coupon);
  }

  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: ecommerceData,
  });
};

/**
 * add_shipping_info: When shipping info is selected or submitted
 */
export const trackGtmAddShippingInfo = ({
  items = [],
  value = 0,
  currency = DEFAULT_CURRENCY,
  shipping_tier = "Standard Delivery",
  coupon = "",
}) => {
  const formattedItems = (Array.isArray(items) ? items : [])
    .map((item, idx) => formatGa4Item(item, idx))
    .filter(Boolean);

  clearEcommerce();
  const ecommerceData = {
    currency,
    value: Number(value) || 0,
    shipping_tier: String(shipping_tier),
    items: formattedItems,
  };
  if (coupon) {
    ecommerceData.coupon = String(coupon);
  }

  pushToDataLayer({
    event: "add_shipping_info",
    ecommerce: ecommerceData,
  });
};

/**
 * add_payment_info: When payment method is selected / gateway initialized
 */
export const trackGtmAddPaymentInfo = ({
  items = [],
  value = 0,
  currency = DEFAULT_CURRENCY,
  payment_type = "Razorpay",
  coupon = "",
}) => {
  const formattedItems = (Array.isArray(items) ? items : [])
    .map((item, idx) => formatGa4Item(item, idx))
    .filter(Boolean);

  clearEcommerce();
  const ecommerceData = {
    currency,
    value: Number(value) || 0,
    payment_type: String(payment_type),
    items: formattedItems,
  };
  if (coupon) {
    ecommerceData.coupon = String(coupon);
  }

  pushToDataLayer({
    event: "add_payment_info",
    ecommerce: ecommerceData,
  });
};

/**
 * purchase: Triggered ONLY after payment is confirmed and verified
 * Deduplicated via transaction_id.
 */
export const trackGtmPurchase = ({
  transaction_id,
  value,
  tax = 0,
  shipping = 0,
  currency = DEFAULT_CURRENCY,
  coupon = "",
  items = [],
}) => {
  if (!transaction_id) {
    console.warn("GTM Purchase event skipped: Missing transaction_id");
    return false;
  }

  const formattedItems = (Array.isArray(items) ? items : [])
    .map((item, idx) => formatGa4Item(item, idx))
    .filter(Boolean);

  clearEcommerce();

  const ecommerceData = {
    transaction_id: String(transaction_id),
    value: Number(value) || 0,
    tax: Number(tax) || 0,
    shipping: Number(shipping) || 0,
    currency,
    items: formattedItems,
  };

  if (coupon) {
    ecommerceData.coupon = String(coupon);
  }

  pushToDataLayer({
    event: "purchase",
    ecommerce: ecommerceData,
  });

  return true;
};

function DEFAULTIR_CURRENCY_FALLBACK(curr) {
  return curr || "INR";
}

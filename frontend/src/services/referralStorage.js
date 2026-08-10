const REFERRAL_STORAGE_KEY = "mwellness_referral_tracking";

export const readReferralParams = (search) => {
  const params = new URLSearchParams(search || "");
  const vendorId = params.get("vendorId");
  const assignedProductId = params.get("assignedProductId");
  const ref = params.get("ref");

  if (!vendorId) {
    return null;
  }

  return {
    vendorId,
    assignedProductId,
    shareCode: ref,
  };
};

export const saveReferralContext = (referral) => {
  if (!referral?.vendorId) {
    return;
  }

  const payload = JSON.stringify({
    productId: referral.productId ? String(referral.productId) : null,
    vendorId: String(referral.vendorId),
    assignedProductId: referral.assignedProductId ? String(referral.assignedProductId) : null,
    shareCode: referral.shareCode ? String(referral.shareCode) : null,
  });

  localStorage.setItem(REFERRAL_STORAGE_KEY, payload);
  sessionStorage.setItem(REFERRAL_STORAGE_KEY, payload);
};

export const getReferralContext = () => {
  const raw =
    sessionStorage.getItem(REFERRAL_STORAGE_KEY) ||
    localStorage.getItem(REFERRAL_STORAGE_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.vendorId) {
      clearReferralContext();
      return null;
    }
    return parsed;
  } catch (error) {
    clearReferralContext();
    return null;
  }
};

export const getReferralForProduct = (productId) => {
  const referral = getReferralContext();
  if (!referral) return null;
  return String(referral.productId) === String(productId) ? referral : null;
};

export const getReferralForCartItems = (products = []) => {
  if (!Array.isArray(products) || products.length === 0) return null;

  const inlineReferral = products.find((product) => product?.referral)?.referral;
  if (inlineReferral) {
    return inlineReferral;
  }

  const storedReferral = getReferralContext();
  if (!storedReferral) return null;

  // Universal Store-wide Affiliate tracking:
  // We return the stored referral regardless of which specific product was originally shared.
  return storedReferral;
};

export const attachReferralToCartProducts = (products = [], referral) => {
  if (!Array.isArray(products) || products.length === 0 || !referral?.vendorId) {
    return products || [];
  }

  return products.map((product) => ({
    ...product,
    referral: {
      productId: referral.productId ? String(referral.productId) : String(product.productId),
      vendorId: referral.vendorId,
      assignedProductId: referral.assignedProductId,
      shareCode: referral.shareCode || "STORE-LINK",
    },
  }));
};

export const clearReferralContext = () => {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
};

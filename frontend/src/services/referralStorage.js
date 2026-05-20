const REFERRAL_STORAGE_KEY = "mwellness_referral_tracking";

export const readReferralParams = (search) => {
  const params = new URLSearchParams(search || "");
  const vendorId = params.get("vendorId");
  const assignedProductId = params.get("assignedProductId");
  const ref = params.get("ref");

  if (!vendorId || !assignedProductId || !ref) {
    return null;
  }

  return {
    vendorId,
    assignedProductId,
    shareCode: ref,
  };
};

export const saveReferralContext = (referral) => {
  if (!referral?.productId || !referral?.vendorId || !referral?.assignedProductId || !referral?.shareCode) {
    return;
  }

  const payload = JSON.stringify({
    productId: String(referral.productId),
    vendorId: String(referral.vendorId),
    assignedProductId: String(referral.assignedProductId),
    shareCode: String(referral.shareCode),
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
    if (!parsed?.productId || !parsed?.vendorId || !parsed?.assignedProductId || !parsed?.shareCode) {
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

  const hasMatchingProduct = products.some(
    (product) => String(product?.productId) === String(storedReferral.productId)
  );

  return hasMatchingProduct ? storedReferral : null;
};

export const attachReferralToCartProducts = (products = [], referral) => {
  if (!Array.isArray(products) || products.length === 0 || !referral?.productId) {
    return products || [];
  }

  return products.map((product) =>
    String(product.productId) === String(referral.productId)
      ? {
          ...product,
          referral: {
            productId: String(referral.productId),
            vendorId: referral.vendorId,
            assignedProductId: referral.assignedProductId,
            shareCode: referral.shareCode,
          },
        }
      : product
  );
};

export const clearReferralContext = () => {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
};

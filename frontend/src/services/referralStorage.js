const REFERRAL_STORAGE_KEY = "mwellness_referral_context";

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
  if (!referral) return;

  const payload = JSON.stringify({
    vendorId: referral.vendorId,
    assignedProductId: referral.assignedProductId,
    shareCode: referral.shareCode,
    capturedAt: new Date().toISOString(),
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
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
    return null;
  }
};

export const clearReferralContext = () => {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
};

export const trackMetaEvent = (eventName, params = {}) => {
  if (
    typeof window !== "undefined" &&
    typeof window.fbq === "function"
  ) {
    window.fbq("track", eventName, params);
  }
};

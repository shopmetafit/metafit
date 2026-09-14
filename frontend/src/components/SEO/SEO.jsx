import React, { useEffect } from "react";

const DEFAULT_SITE_NAME = "M Wellness Bazaar";
const DEFAULT_TITLE = "M Wellness Bazaar — Premium Wellness, Healthcare & Ayurvedic Products";
const DEFAULT_DESCRIPTION = "Shop authentic wellness products, Ayurvedic devices, health monitoring tools, supplements, panchakarma equipment, and organic skincare at M Wellness Bazaar India.";
const DEFAULT_DOMAIN = "https://mwellnessbazaar.com";
const DEFAULT_OG_IMAGE = "https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png";

const setMetaTag = (attr, attrValue, content) => {
  if (!content) return;
  let element = document.querySelector(`meta[${attr}="${attrValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const setLinkTag = (rel, href) => {
  if (!href) return;
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

const setJsonLdScript = (jsonLd) => {
  const existing = document.querySelectorAll("script[data-dynamic-jsonld='true']");
  existing.forEach((el) => el.remove());

  if (!jsonLd) return;

  const script = document.createElement("script");
  script.setAttribute("type", "application/ld+json");
  script.setAttribute("data-dynamic-jsonld", "true");
  script.textContent = typeof jsonLd === "string" ? jsonLd : JSON.stringify(jsonLd);
  document.head.appendChild(script);
};

const SEO = ({
  title,
  description,
  canonical,
  robots = "index, follow",
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = "website",
  twitterCard = "summary_large_image",
  twitterTitle,
  twitterDescription,
  twitterImage,
  jsonLd,
}) => {
  const fullTitle = title ? `${title} | ${DEFAULT_SITE_NAME}` : DEFAULT_TITLE;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = canonical
    ? (canonical.startsWith("http") ? canonical : `${DEFAULT_DOMAIN}${canonical}`)
    : DEFAULT_DOMAIN;
  const image = ogImage || twitterImage || DEFAULT_OG_IMAGE;
  const currentOgTitle = ogTitle || fullTitle;
  const currentOgDesc = ogDescription || metaDescription;
  const currentOgUrl = ogUrl || canonicalUrl;

  useEffect(() => {
    // Title & Primary Meta
    document.title = fullTitle;
    setMetaTag("name", "description", metaDescription);
    setMetaTag("name", "robots", robots);
    setLinkTag("canonical", canonicalUrl);

    // Open Graph
    setMetaTag("property", "og:site_name", DEFAULT_SITE_NAME);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:title", currentOgTitle);
    setMetaTag("property", "og:description", currentOgDesc);
    setMetaTag("property", "og:url", currentOgUrl);
    setMetaTag("property", "og:image", image);

    // Twitter
    setMetaTag("name", "twitter:card", twitterCard);
    setMetaTag("name", "twitter:title", twitterTitle || currentOgTitle);
    setMetaTag("name", "twitter:description", twitterDescription || currentOgDesc);
    setMetaTag("name", "twitter:image", twitterImage || image);

    // Structured Data
    setJsonLdScript(jsonLd);
  }, [
    fullTitle,
    metaDescription,
    robots,
    canonicalUrl,
    ogType,
    currentOgTitle,
    currentOgDesc,
    currentOgUrl,
    image,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    jsonLd,
  ]);

  return null;
};

export default SEO;

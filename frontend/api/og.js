export default async function handler(req, res) {
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug.join("/") : (req.query.slug || "");
  const slug = String(rawSlug).replace(/^\/+|\/+$/g, "").trim();
  const backendUrl = process.env.VITE_BACKEND_URL || "https://metafit-omega.vercel.app";

  let product = null;
  if (slug) {
    try {
      const apiRes = await fetch(`${backendUrl}/api/products/${encodeURIComponent(slug)}`);
      if (apiRes.ok) {
        product = await apiRes.json();
      }
    } catch (err) {
      console.warn("Could not fetch product for OG preview:", err);
    }
  }

  const name = product?.name || "M Wellness Bazaar";
  const rawPrice = product?.discountPrice || product?.price || 0;
  const price = rawPrice > 0 ? `₹${rawPrice}` : "";
  const title = price ? `${name} - ${price} | M Wellness Bazaar` : `${name} | M Wellness Bazaar`;
  const description = product?.description
    ? product.description.replace(/<[^>]+>/g, "").slice(0, 160)
    : "Shop authentic wellness, Ayurvedic, and healthcare products at M Wellness Bazaar India.";

  // Robust Product Image Resolution (handles string arrays, object arrays, thumbnail)
  let imageUrl = null;
  if (product?.thumbnail && typeof product.thumbnail === "string") {
    imageUrl = product.thumbnail;
  }
  if (!imageUrl && Array.isArray(product?.images) && product.images.length > 0) {
    const primary = product.images.find((img) => img?.isPrimary);
    const first = primary || product.images[0];
    imageUrl = typeof first === "string" ? first : first?.url;
  }
  if (!imageUrl && Array.isArray(product?.extraImages) && product.extraImages.length > 0) {
    const firstExtra = product.extraImages[0];
    imageUrl = typeof firstExtra === "string" ? firstExtra : firstExtra?.url;
  }
  if (!imageUrl || typeof imageUrl !== "string") {
    imageUrl = "https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png";
  }

  // Ensure https
  if (imageUrl.startsWith("http://")) {
    imageUrl = imageUrl.replace("http://", "https://");
  }

  // Optimize for WhatsApp preview crawler: 600x600 JPG with white padding (< 50KB)
  let ogImageUrl = imageUrl;
  if (ogImageUrl.includes("cloudinary.com") && ogImageUrl.includes("/upload/")) {
    ogImageUrl = ogImageUrl.replace("/upload/", "/upload/w_600,h_600,c_pad,b_white,q_75,f_jpg/");
  }

  const productUrl = `https://mwellnessbazaar.com/product/${slug || ""}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${name} | M Wellness Bazaar</title>
  <meta property="og:site_name" content="M Wellness Bazaar">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:secure_url" content="${ogImageUrl}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  <meta property="og:url" content="${productUrl}">
  <link rel="image_src" href="${ogImageUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta http-equiv="refresh" content="0;url=${productUrl}">
</head>
<body>
  <script>window.location.replace("${productUrl}");</script>
  <p>Redirecting to <a href="${productUrl}">${name}</a>...</p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  res.status(200).send(html);
}

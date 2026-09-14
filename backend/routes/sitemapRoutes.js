const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Blog = require("../models/Blog");

const DOMAIN = "https://mwellnessbazaar.com";

const categorySlugs = [
  "ayurvedic-devices",
  "health-monitoring",
  "snacks-and-protein",
  "skin-and-body-care",
  "panchakarma-equipment",
  "accessories",
];

const staticRoutes = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/about", priority: "0.8", changefreq: "monthly" },
  { url: "/contact", priority: "0.8", changefreq: "monthly" },
  { url: "/blog", priority: "0.8", changefreq: "weekly" },
  { url: "/collections/all", priority: "0.9", changefreq: "daily" },
  { url: "/privacy-policy", priority: "0.5", changefreq: "monthly" },
  { url: "/refund-policy", priority: "0.5", changefreq: "monthly" },
  { url: "/shipping-policy", priority: "0.5", changefreq: "monthly" },
  { url: "/terms", priority: "0.5", changefreq: "monthly" },
  { url: "/pricing-policy", priority: "0.5", changefreq: "monthly" },
];

router.get("/", async (req, res) => {
  try {
    const products = await Product.find(
      { isPublished: { $ne: false } },
      "slug updatedAt createdAt _id"
    ).lean();

    const blogs = await Blog.find(
      { status: "published" },
      "slug updatedAt publishedAt"
    ).lean();

    const nowIso = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    staticRoutes.forEach((route) => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}${route.url}</loc>\n`;
      xml += `    <lastmod>${nowIso}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Categories
    categorySlugs.forEach((catSlug) => {
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/category/${catSlug}</loc>\n`;
      xml += `    <lastmod>${nowIso}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    // Products
    products.forEach((p) => {
      const slugOrId = p.slug || p._id;
      const lastMod = p.updatedAt
        ? new Date(p.updatedAt).toISOString()
        : nowIso;
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/product/${slugOrId}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });

    // Blogs
    blogs.forEach((b) => {
      if (!b.slug) return;
      const lastMod = b.updatedAt
        ? new Date(b.updatedAt).toISOString()
        : nowIso;
      xml += `  <url>\n`;
      xml += `    <loc>${DOMAIN}/blog/${b.slug}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.header("Cache-Control", "public, max-age=86400"); // 24hr cache
    res.send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

module.exports = router;

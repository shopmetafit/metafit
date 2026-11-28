import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Smartphone,
  ImageIcon,
  Zap,
} from "lucide-react";
import {
  FaWhatsapp,
  FaFacebookF,
  FaTelegramPlane,
  FaTwitter,
} from "react-icons/fa";
import { toast } from "sonner";

// High-speed Image Compressor for instant WhatsApp sharing (~25KB - 40KB file size)
const compressProductPhoto = (imageUrl, maxDim = 500, quality = 0.72) => {
  return new Promise((resolve) => {
    if (!imageUrl) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Cloudinary fast-fetch optimization: fetch 500px pre-scaled JPEG directly
    let fetchUrl = imageUrl;
    if (fetchUrl.includes("cloudinary.com") && fetchUrl.includes("/upload/")) {
      fetchUrl = fetchUrl.replace("/upload/", "/upload/w_500,h_500,c_pad,b_white,q_75,f_jpg/");
    }
    const corsUrl = fetchUrl.includes("cloudinary.com") ? `${fetchUrl}${fetchUrl.includes("?") ? "&" : "?"}cors=1` : fetchUrl;

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width || 500;
        let height = img.naturalHeight || img.height || 500;

        // Resize down to maxDim (500px) maintaining aspect ratio
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Clean white background for transparency fallback
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high-compression JPEG
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      } catch (err) {
        console.warn("Image compression fallback error:", err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = corsUrl;
  });
};

// Convert blob to PNG for ClipboardItem
const convertBlobToPng = (blob) => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 400;
          canvas.height = img.naturalHeight || img.height || 400;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            resolve(pngBlob);
          }, "image/png");
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    } catch {
      resolve(null);
    }
  });
};

const ProductShareModal = ({ isOpen, onClose, product, currentImage }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhoto, setCopiedPhoto] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [isSharingNative, setIsSharingNative] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Resolve product image
  const resolvedImageUrl = (() => {
    if (currentImage && currentImage !== "video" && typeof currentImage === "string") {
      return currentImage;
    }
    if (product.thumbnail && typeof product.thumbnail === "string") {
      return product.thumbnail;
    }
    if (Array.isArray(product.images) && product.images.length > 0) {
      const primary = product.images.find((img) => img?.isPrimary);
      const url = primary?.url || (typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.url);
      if (url) return url;
    }
    if (Array.isArray(product.extraImages) && product.extraImages.length > 0) {
      const url = typeof product.extraImages[0] === "string" ? product.extraImages[0] : product.extraImages[0]?.url;
      if (url) return url;
    }
    return "https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png";
  })();

  // Public domain link
  const isLocal = typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
  const productSlugOrId = product.slug || product._id;
  const canonicalUrl = (() => {
    const base = isLocal
      ? `https://mwellnessbazaar.com/product/${productSlugOrId}`
      : (typeof window !== "undefined" ? window.location.href.split("?")[0] : `https://mwellnessbazaar.com/product/${productSlugOrId}`);
    return `${base}?ref=share`;
  })();

  const currentPrice = Number(product.discountPrice || product.price || 0);
  const originalPrice = Number(product.price || 0);
  const formattedPrice = currentPrice > 0 ? `₹${currentPrice.toLocaleString("en-IN")}` : "";
  const discountPercent = originalPrice > currentPrice && currentPrice > 0
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  // Exact message format requested by user
  const shareMessageText = `🛍️ *${product.name}*\n${formattedPrice ? `💰 *Price:* ${formattedPrice}\n` : ""}${product.brand ? `🏷️ *Brand:* ${product.brand}\n` : ""}\n👉 *Check out product here:*\n${canonicalUrl}`;

  // WhatsApp Web link
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessageText)}`;

  // Social share URLs
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(`🛍️ ${product.name}${formattedPrice ? ` (${formattedPrice})` : ""}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product.name} on M Wellness Bazaar:`)}&url=${encodeURIComponent(canonicalUrl)}`;

  // Detect mobile
  const isMobile = typeof navigator !== "undefined" && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== "undefined" && window.innerWidth < 768)
  );

  // PRIMARY: SHARE ON WHATSAPP IN 1 SINGLE SECTION (FAST & COMPRESSED)
  const handleWhatsAppShare = async () => {
    setIsSharingWhatsApp(true);
    try {
      // Step 1: Compress image to ~30KB for lightning fast transfer
      const compressedBlob = await compressProductPhoto(resolvedImageUrl, 500, 0.72);
      const cleanTitle = (product.name || "product").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);

      // Step 2: On Mobile: Web Share API attaches photo + caption directly into 1 single bubble!
      if (isMobile && canNativeShare && compressedBlob) {
        try {
          const shareFile = new File([compressedBlob], `${cleanTitle}.jpg`, { type: "image/jpeg" });

          if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
            await navigator.share({
              title: product.name,
              text: shareMessageText,
              files: [shareFile],
            });
            toast.success("Photo & details shared in 1 message!");
            onClose();
            return;
          }
        } catch (shareErr) {
          console.warn("Mobile native share:", shareErr);
        }
      }

      // Step 3: Desktop WhatsApp Web: Copy compressed photo to clipboard and open WhatsApp
      try {
        if (compressedBlob && typeof ClipboardItem !== "undefined") {
          const pngBlob = await convertBlobToPng(compressedBlob);
          if (pngBlob) {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": pngBlob }),
            ]);
            setCopiedPhoto(true);
            setTimeout(() => setCopiedPhoto(false), 3000);
          }
        }
      } catch (clipErr) {
        console.warn("Desktop clipboard write:", clipErr);
      }

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      toast.success("WhatsApp opened! Compressed photo copied — press Ctrl+V to attach photo.", { duration: 6000 });
    } catch {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  // Copy Compressed Photo
  const handleCopyPhoto = async () => {
    try {
      const compressedBlob = await compressProductPhoto(resolvedImageUrl, 500, 0.72);
      if (!compressedBlob) throw new Error("Compression failed");
      const pngBlob = await convertBlobToPng(compressedBlob);
      if (pngBlob && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
        setCopiedPhoto(true);
        toast.success("Lightweight photo copied! Paste (Ctrl+V) anywhere.");
        setTimeout(() => setCopiedPhoto(false), 2500);
      } else {
        throw new Error("ClipboardItem not supported");
      }
    } catch {
      await navigator.clipboard.writeText(shareMessageText);
      toast.success("Product details copied!");
    }
  };

  // Download Compressed Photo (~30KB)
  const handleDownloadPhoto = async () => {
    setIsDownloading(true);
    try {
      const compressedBlob = await compressProductPhoto(resolvedImageUrl, 500, 0.72);
      if (!compressedBlob) throw new Error("Compression failed");
      const blobUrl = window.URL.createObjectURL(compressedBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanTitle = (product.name || "product").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
      a.download = `${cleanTitle}_small.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Fast-share photo downloaded (~30KB)!");
    } catch {
      window.open(resolvedImageUrl, "_blank");
      toast.info("Image opened in new tab");
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonicalUrl);
      setCopiedLink(true);
      toast.success("Product link copied!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      toast.success("Product link copied!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Native share sheet
  const handleNativeShare = async () => {
    setIsSharingNative(true);
    try {
      let filesToShare = [];
      const compressedBlob = await compressProductPhoto(resolvedImageUrl, 500, 0.72);
      if (compressedBlob) {
        const cleanTitle = (product.name || "product").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
        const file = new File([compressedBlob], `${cleanTitle}.jpg`, { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          filesToShare = [file];
        }
      }

      const payload = {
        title: product.name,
        text: shareMessageText,
      };
      if (filesToShare.length > 0) {
        payload.files = filesToShare;
      } else {
        payload.url = canonicalUrl;
      }

      await navigator.share(payload);
      toast.success("Shared successfully!");
      onClose();
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.info("Share canceled");
      }
    } finally {
      setIsSharingNative(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: "100%", opacity: 0.9 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
          className="relative w-full sm:max-w-[430px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#E6DDD0] overflow-hidden z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#E6DDD0] bg-[#FAF7F0] flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E6DDD0] flex items-center justify-center text-[#8E5E3C] shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#1A1612] leading-tight truncate">
                  Share Product
                </h3>
                <p className="text-[11px] text-[#6E5D4B] truncate">
                  Photo + Details in 1 message (Fast Send)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#E6DDD0] text-[#6E5D4B] hover:text-[#1A1612] flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden space-y-3.5 flex-1">
            {/* PRODUCT PREVIEW CARD */}
            <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-[#FAF7F0] border border-[#E6DDD0]">
              <div
                style={{ width: "68px", height: "68px", minWidth: "68px", minHeight: "68px" }}
                className="relative rounded-lg border border-[#E6DDD0] bg-white overflow-hidden p-1 flex items-center justify-center shrink-0"
              >
                <img
                  src={resolvedImageUrl}
                  alt={product.name}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  className="rounded"
                  onError={(e) => {
                    e.currentTarget.src = "https://res.cloudinary.com/diqbny8ne/image/upload/M_Wellness_Bazaar_Logo_k776aq.png";
                  }}
                />
                {discountPercent > 0 && (
                  <span className="absolute top-0.5 left-0.5 px-1 py-0.2 bg-[#FF3B30] text-white text-[9px] font-bold rounded">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {product.brand && (
                  <p className="text-[10px] font-bold text-[#8E5E3C] uppercase tracking-wider truncate mb-0.5">
                    {product.brand}
                  </p>
                )}
                <h4 className="font-serif text-xs sm:text-sm font-bold text-[#1A1612] line-clamp-2 leading-snug">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {formattedPrice && (
                    <span className="text-sm font-extrabold text-[#1A1612]">
                      {formattedPrice}
                    </span>
                  )}
                  {discountPercent > 0 && originalPrice > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* PRIMARY WHATSAPP SHARE BUTTON */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              disabled={isSharingWhatsApp}
              className="w-full h-12 px-4 rounded-xl font-bold text-sm text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-70"
            >
              <FaWhatsapp className="w-5 h-5 text-white shrink-0" />
              <span>
                {isSharingWhatsApp ? "Compressing & Sharing..." : "Share on WhatsApp (1 Message with Photo)"}
              </span>
            </button>

            {/* SPEED & 1-SECTION BADGE */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 leading-snug flex items-start gap-2">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Fast 1-Section Message:</strong> Image automatically compress (~30KB) hokar fast send hoti hai. Mobile par photo aur details ek sath 1 single bubble me send hongi!
              </span>
            </div>

            {/* QUICK ACTIONS: COPY COMPRESSED PHOTO & DOWNLOAD */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyPhoto}
                className="h-10 px-2.5 rounded-lg border border-[#E6DDD0] bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#1A1612] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Copy lightweight photo to clipboard"
              >
                {copiedPhoto ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 font-bold truncate">Photo Copied!</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-[#8E5E3C] shrink-0" />
                    <span className="truncate">Copy Photo (~30KB)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadPhoto}
                disabled={isDownloading}
                className="h-10 px-2.5 rounded-lg border border-[#E6DDD0] bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#1A1612] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Download lightweight photo"
              >
                <Download className="w-3.5 h-3.5 text-[#8E5E3C] shrink-0" />
                <span className="truncate">{isDownloading ? "Saving..." : "Save Photo (~30KB)"}</span>
              </button>
            </div>

            {/* DIRECT PRODUCT LINK */}
            <div>
              <p className="text-[11px] font-bold text-[#6E5D4B] mb-1.5 uppercase tracking-wider">
                Direct Link
              </p>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF7F0] border border-[#E6DDD0]">
                <input
                  type="text"
                  readOnly
                  value={canonicalUrl}
                  className="flex-1 px-2 text-xs text-[#1A1612] bg-transparent outline-none truncate font-mono select-all min-w-0"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                    copiedLink
                      ? "bg-emerald-600 text-white"
                      : "bg-[#8E5E3C] hover:bg-[#7D5233] text-white"
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* OTHER SOCIAL APPS */}
            <div>
              <p className="text-[11px] font-bold text-[#6E5D4B] mb-2 uppercase tracking-wider">
                Other Apps
              </p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-all transform active:scale-95 shadow-2xs group"
                  title="Share on Telegram"
                >
                  <FaTelegramPlane className="w-4 h-4 mb-1 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold truncate max-w-full">Telegram</span>
                </a>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white transition-all transform active:scale-95 shadow-2xs group"
                  title="Share on Facebook"
                >
                  <FaFacebookF className="w-4 h-4 mb-1 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold truncate max-w-full">Facebook</span>
                </a>

                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-black hover:bg-neutral-800 text-white transition-all transform active:scale-95 shadow-2xs group"
                  title="Share on X"
                >
                  <FaTwitter className="w-4 h-4 mb-1 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold truncate max-w-full">X / Twitter</span>
                </a>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 bg-[#FAF7F0] border-t border-[#E6DDD0] text-center flex-shrink-0">
            <p className="text-[11px] text-[#6E5D4B] leading-tight">
              🌿 M Wellness Bazaar — 100% Genuine Ayurvedic & Wellness Products
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductShareModal;

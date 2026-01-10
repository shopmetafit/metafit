import { useImageProcessor } from "../../hooks/useImageProcessor";
import { useState } from "react";

const ImageProcessingGuide = ({ onImageProcessed }) => {
  const { processProductImage, loading, error } = useImageProcessor();
  const [imageUrl, setImageUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const handleProcess = async () => {
    if (!imageUrl) {
      alert("Please enter an image URL");
      return;
    }

    const processedUrl = await processProductImage(imageUrl, logoUrl || undefined);
    if (processedUrl && onImageProcessed) {
      onImageProcessed(processedUrl);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Process Product Image</h2>
      <p className="text-gray-600 mb-6">
        This tool removes the background from your product image and adds the Metafit Wellness logo.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image URL
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/product.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL (Optional - uses default if not provided)
          </label>
          <input
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={loading || !imageUrl}
          className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-colors ${
            loading || !imageUrl
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700"
          }`}
        >
          {loading ? "Processing..." : "Process Image"}
        </button>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ol className="text-sm text-blue-800 space-y-2">
          <li>1. Remove background from product image using AI</li>
          <li>2. Add Metafit Wellness logo at bottom-right corner</li>
          <li>3. Return processed image ready for use</li>
        </ol>
      </div>
    </div>
  );
};

export default ImageProcessingGuide;

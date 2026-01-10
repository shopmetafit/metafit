import { useState } from "react";
import { toast } from "sonner";

export const useImageProcessor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processProductImage = async (imageUrl, logoUrl = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://0.0.0.0:9000/api/upload/process-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          logoUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process image");
      }

      const data = await response.json();
      toast.success("Image processed successfully!");
      return data.processedImageUrl;
    } catch (err) {
      const errorMessage = err.message || "Error processing image";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { processProductImage, loading, error };
};

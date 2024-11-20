import sharp from "sharp";
import getCacheSize from "../cache/getCacheSize";

/**
 * Generates a Base64-encoded blur data URL for an image.
 * @param {Buffer} imageBuffer - The image buffer (e.g., fetched from a URL or file).
 * @param {Object} [options] - Optional parameters for customizing the output.
 * @param {number} [options.width=20] - Width of the resized placeholder.
 * @param {number} [options.height=20] - Height of the resized placeholder.
 * @param {number} [options.blur=5] - Blur intensity.
 * @returns {Promise<string>} - A Base64-encoded data URL of the blurred image.
 */
async function generateBlurDataURL(imageBuffer: ArrayBuffer, options = { width: 20, height: 20, blur: 5 }) {
  const { width, height, blur } = options;

  try {
    // Get the dimensions of the image
    const image = sharp(imageBuffer);
    const { width: imgWidth, height: imgHeight } = await image.metadata();

    // Resize the image if it's larger than the specified dimensions
    if ((imgWidth && (imgWidth > width)) || (imgHeight && (imgHeight > height))) {
      image.resize(width, height, { fit: "inside" });
    }
    
    // Process the image with Sharp
    const placeholderBuffer = await image
      .blur(blur) // Apply blur effect
      .toFormat("webp", { quality: 50 }) // Convert to WebP for smaller size
      .toBuffer();

    // Convert to Base64 data URL
    return `data:image/jpeg;base64,${placeholderBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error generating blur data URL:", error);
    throw new Error("Failed to generate blur data URL.");
  }
}

const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const cache = new Map();

export default async function getBlurDataURL(imageUrl: string) {
  if (!imageUrl) return null;
  // Check if the image is already cached and start with empty headers
  const cachedData = cache.get(imageUrl);
  const headers: Record<string, string> = {};
  if (cachedData && !cachedData.etag) return cachedData.blurDataUrl;
  
  try {
    // If there's cached data and an ETag, add 'If-None-Match' header
    if (cachedData && cachedData.etag) headers['If-None-Match'] = cachedData.etag;
    const response = await fetch(imageUrl, { headers, next: { revalidate: 7200 } });

    // If the response status is 304 (Not Modified), return the cached blurDataUrl
    if (response.status === 304) return cachedData.blurDataUrl;

    const imageBuffer = await response.arrayBuffer();
    const blurDataUrl = await generateBlurDataURL(imageBuffer);
    const etag = response.headers.get('etag');

    if (etag) {
      // Update the cache with the new blurDataUrl and ETag
      if (getCacheSize(cache) >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(imageUrl, { blurDataUrl, etag });
    } else {
      if (getCacheSize(cache) >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(imageUrl, { blurDataUrl });
      setTimeout(() => cache.delete(imageUrl), 24 * 60 * 60 * 1000);  // 1 day
    }

    return blurDataUrl;
  } catch (error) {
    console.error("Error generating blur data URL:", error);
    throw new Error("Failed to generate blur data URL.");
  }
}

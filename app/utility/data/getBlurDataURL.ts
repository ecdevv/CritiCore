import sharp from "sharp";
import { redis } from "../redis";

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

export default async function getBlurDataURL(imageUrl: string) {
  if (!imageUrl) return null;

  // Check if the image is already cached and start with empty headers
  const cachedDataString = await redis.get(`z_blur:${imageUrl}`) || null;
  const cachedData = cachedDataString ? JSON.parse(cachedDataString) : null;
  if (cachedData && !cachedData.etag) return cachedData.blurDataUrl;
  const headers: Record<string, string> = {};
  
  try {
    // If there's cached data and an ETag, add 'If-None-Match' header
    if (cachedData && cachedData.etag) headers['If-None-Match'] = cachedData.etag;
    const response = await fetch(imageUrl, { headers, next: { revalidate: 7200 } });

    // If the response status is 304 (Not Modified), return the cached blurDataUrl
    if (response.status === 304 || response.headers.get('etag') === cachedData?.etag) return cachedData?.blurDataUrl;

    const imageBuffer = await response.arrayBuffer();
    const blurDataUrl = await generateBlurDataURL(imageBuffer);
    const etag = response.headers.get('etag');

    if (etag) {
      const newEntry = { blurDataUrl, etag };
      // Update the cache with the new blurDataUrl and ETag
      await redis.set(`z_blur:${imageUrl}`, JSON.stringify(newEntry));
    } else {
      const newEntry = { blurDataUrl };
      await redis.set(`z_blur:${imageUrl}`, JSON.stringify(newEntry), 'EX', 1 * 24 * 60 * 60);  // 1 day
    }

    return blurDataUrl;
  } catch (error) {
    console.error("Error generating blur data URL:", error);
    throw new Error("Failed to generate blur data URL.");
  }
}

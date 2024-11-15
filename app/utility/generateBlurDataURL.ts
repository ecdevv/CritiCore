import sharp from "sharp";

/**
 * Generates a Base64-encoded blur data URL for an image.
 * @param {Buffer} imageBuffer - The image buffer (e.g., fetched from a URL or file).
 * @param {Object} [options] - Optional parameters for customizing the output.
 * @param {number} [options.width=20] - Width of the resized placeholder.
 * @param {number} [options.height=20] - Height of the resized placeholder.
 * @param {number} [options.blur=5] - Blur intensity.
 * @returns {Promise<string>} - A Base64-encoded data URL of the blurred image.
 */
export default async function generateBlurDataURL(imageBuffer: ArrayBuffer, options = { width: 20, height: 20, blur: 5 }) {
  const { width, height, blur } = options;

  try {
    // Process the image with Sharp
    const placeholderBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: "inside" }) // Resize to small dimensions
      .blur(blur) // Apply blur effect
      .toFormat("jpeg", { quality: 50 }) // Convert to JPEG for smaller size
      .toBuffer();

    // Convert to Base64 data URL
    return `data:image/jpeg;base64,${placeholderBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error generating blur data URL:", error);
    throw new Error("Failed to generate blur data URL.");
  }
}
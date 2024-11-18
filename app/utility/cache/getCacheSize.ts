/**
 * Calculates the size of a cache object in megabytes (MB).
 * @param {Map<any, any>} cache - The cache object to calculate the size of.
 * @returns {number} - The size of the cache in megabytes (MB).
 */
export default function getCacheSize(cache: Map<string, unknown>): number {
  const mapObject = Object.fromEntries(cache);
  const jsonString = JSON.stringify(mapObject);
  const sizeInBytes = new TextEncoder().encode(jsonString).length;
  return sizeInBytes / (1024 * 1024);
}
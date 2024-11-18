import getCacheSize from "./getCacheSize";

export const setCache = (cacheKey: string, data: unknown, cache: Map<string, unknown>, expiry: number, maxCacheSize: number = 0 ) => {
  if (maxCacheSize > 0) {
    if (getCacheSize(cache) >= maxCacheSize) {
      const firstKey = cache.keys().next().value as string;
      cache.delete(firstKey);
    }
  }
  cache.set(cacheKey, data);
  setTimeout(() => cache.delete(cacheKey), expiry);
};

export const setCacheEmpty = (cacheKey: string, data: unknown = null, cache: Map<string, unknown>, expiry: number, maxCacheSize: number = 0 ) => {
  if (maxCacheSize > 0) {
    if (getCacheSize(cache) >= maxCacheSize) {
      const firstKey = cache.keys().next().value as string;
      cache.delete(firstKey);
    }
  }
  cache.set(cacheKey, data);
  setTimeout(() => cache.delete(cacheKey), expiry);
};
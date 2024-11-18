import levenshtein from 'damerau-levenshtein';
import { setCache } from "@/app/utility/cache";
import { normalizeString } from "@/app/utility/strings";

const appIndexCache = new Map();

// Caching app index temporarily to reduce number of fetches to our route if we are fetching searching in quick succession;
async function fetchAppIndex(baseUrl: string) {
  const cacheKey = 'appIndex';
  if (appIndexCache.has(cacheKey)) return appIndexCache.get(cacheKey);

  // Fetching search data for app ID(s) based on the game name from params in url
  const appIndexData = await fetch(`${baseUrl}/api/steam/appindex`).then(res => res.json());
  const appIndex = appIndexData.appIndex;
  setCache(cacheKey, appIndex, appIndexCache, 1 * 10 * 60 * 1000); // Cache for 10 minutes
  return appIndex;
}

const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const REVALIDATION_TIME = 2 * 60 * 60 * 1000; // Cache for 2 hours
const cache = new Map();

async function optimizedSearch(appIndex: { [key: string]: number }, searchQuery: string) {
  // Normalize the query once
  const normalizedQuery = normalizeString(searchQuery);

  // Pre-normalize all app names and create a distance array
  const appDistances = Object.entries(appIndex).map(([normalizedAppName, appid]) => {
    const distance = levenshtein(normalizedQuery, normalizedAppName).relative;
    return {
      appid,
      normalizedAppName,
      distance,
    };
  });

  // Filter apps based on levenshtein distance and include normalized query
  const filteredApps = appDistances.filter(({ normalizedAppName, distance }) => normalizedAppName.includes(normalizedQuery) && distance <= 0.75);

  // Sort by the levenshtein distance (ascending)
  filteredApps.sort((a, b) => a.distance - b.distance);

  // Create a unique index of apps based on normalized name
  const uniqueApps = new Map<string, { appid: number; distance: number }>();
  filteredApps.forEach(({ appid, normalizedAppName, distance }) => {
    if (!uniqueApps.has(normalizedAppName) || distance < uniqueApps.get(normalizedAppName)!.distance) {
      uniqueApps.set(normalizedAppName, { appid, distance });
    }
  });

  // Convert unique apps Map back to an array
  const finalResults = Array.from(uniqueApps.values()).map(({ appid, distance }) => ({ appid, name: appIndex[normalizeString(appid.toString())], distance }));
  return finalResults;
}

async function getSearchResults(baseUrl: string, searchQuery: string) {
  const cacheKey = `search-${searchQuery}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  if (!searchQuery || searchQuery.length < 4) return [];

  // Fetching appindex to search for app ID(s) using the query
  const appIndex = await fetchAppIndex(baseUrl);
  const searchResults = await optimizedSearch(appIndex, searchQuery);
  if (searchResults.length === 0) return [];
  setCache(cacheKey, searchResults, cache, REVALIDATION_TIME, MAX_CACHE_SIZE);

  return searchResults;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = new URL(request.url).origin;
  const searchParams = url.searchParams;
  const searchQuery = searchParams.get('q') || '';

  try {
    const searchResults = await getSearchResults(baseUrl, searchQuery);
    return Response.json({ status: 200, searchResults });
  } catch (error) {
    console.log('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}
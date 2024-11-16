import levenshtein from 'damerau-levenshtein';
import { getCacheSize } from "@/app/utility/data";
import { normalizeString, filterString } from "@/app/utility/strings";

const REVALIDATION_TIME = 2 * 60 * 60 * 1000; // Cache for 2 hours
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const cache = new Map();

async function getSearchResults(baseUrl: string, searchQuery: string) {
  if (cache.has(`search-${searchQuery}`)) return cache.get(`search-${searchQuery}`);
  if (!searchQuery || searchQuery.length < 4) return [];

  // Fetching applist to search for app ID(s) using the query
  const appListResponse = await fetch(`${baseUrl}/api/steam/applist`);
  if (!appListResponse.ok) throw new Error(`Failed to fetch app list data, status code: ${appListResponse.status}`);
  const appListData = await appListResponse.json();
  const appList = appListData.applist;

  // Basic filtering of the search results based on the query
  const normalizedQuery = normalizeString(searchQuery);
  const searchResults = appList.filter((app: { name: string }) => normalizeString(app.name).includes(normalizedQuery));

  // Sort and filter the search results based on damerau-levenshtein distance
  let searchResultsFiltered = searchResults
    .map((app: { appid: number; name: string }) => ({
      ...app,
      distance: levenshtein(normalizedQuery, normalizeString(app.name)).relative,
    }))
    .filter((app: { distance: number }) => app.distance <= 0.75)
    .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);

  // Use the custom filterString function to filter the search results again and filter out duplicates (such as Gold Edition version of a game)
  searchResultsFiltered = searchResultsFiltered.filter((app: { name: string }) => {
    return filterString(app.name);
  });
  const uniqueApps = new Map<string, { name: string; distance: number }>();
  searchResultsFiltered.forEach((app: { name: string; distance: number }) => {
    const appName = normalizeString(app.name);
    if (!uniqueApps.has(appName) || app.name.length < uniqueApps.get(appName)!.name.length) {
      uniqueApps.set(appName, app);
    } else if (app.name.length === uniqueApps.get(appName)!.name.length) {
      uniqueApps.set(`${appName} duplicate`, app);
    }
  });
  searchResultsFiltered = Array.from(uniqueApps.values());

  // Update cache entry and check if it exceeds the maximum size
  if (getCacheSize(cache) >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(`search-${searchQuery}`, searchResultsFiltered);
  setTimeout(() => cache.delete(`search-${searchQuery}`), REVALIDATION_TIME);
  if (searchResultsFiltered.length <= 0) setTimeout(() => cache.delete(`search-${searchQuery}`), 60 * 1000);

  return searchResultsFiltered;
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
    console.error('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}


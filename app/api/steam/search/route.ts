import { normalizeString, damerauLevenshteinDistance, filterString } from "@/app/utility/helper";

interface SearchResultsCacheEntry {
  searchResults: { appid: number; name: string; distance: number }[];
  expires: number;
}

const MAX_CACHE_SIZE = 100;
const searchResultsCache = new Map<string, SearchResultsCacheEntry>();

async function getSearchResults(baseUrl: string, searchQuery: string): Promise<SearchResultsCacheEntry> {
  const now = Date.now() / 1000;
  const cacheKey = normalizeString(searchQuery);
  const cachedEntry = searchResultsCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  // Cache empty entry for 5 minutes fetch the app list
  if (searchResultsCache.size >= MAX_CACHE_SIZE) {
    const oldestEntry = Array.from(searchResultsCache).sort((a, b) => a[1].expires - b[1].expires)[0];
    searchResultsCache.delete(oldestEntry[0]);
  }
  searchResultsCache.set(cacheKey, { searchResults: [], expires: now + 300 });

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
      distance: damerauLevenshteinDistance(normalizedQuery, normalizeString(app.name)),
    }))
    .filter((app: { distance: number }) => app.distance <= 0.6)
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

  // Update cache entry and return this entry
  const newEntry = { searchResults: searchResultsFiltered, expires: now + 600 };
  searchResultsCache.set(cacheKey, newEntry);
  return newEntry;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = new URL(request.url).origin;
  const searchParams = url.searchParams;
  const searchQuery = searchParams.get('q') || '';

  try {
    const { searchResults } = await getSearchResults(baseUrl, searchQuery);
    return Response.json({ status: 200, searchResults });
  } catch (error) {
    console.error('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}
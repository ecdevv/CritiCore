import { normalizeString, damerauLevenshteinDistance, filterString } from "@/app/utility/helper";

async function getSearchResults(baseUrl: string, searchQuery: string) {
  const appListResponse = await fetch(`${baseUrl}/api/steam/applist`);
  if (!appListResponse.ok) throw new Error(`Failed to fetch app list data, status code: ${appListResponse.status}`);
  const appListData = await appListResponse.json();
  const appList = appListData.applist;

  // Filter the app list based on the search query
  const normalizeQuery = normalizeString(searchQuery);
  const searchResults = appList.filter((app: { name: string }) => normalizeString(app.name).includes(normalizeQuery));

  // Sort and filter the search results based on damerau-levenshtein distance
  let searchResultsFiltered = searchResults
    .map((app: { appid: number; name: string }) => ({
      ...app,
      distance: damerauLevenshteinDistance(normalizeQuery, normalizeString(app.name)),
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
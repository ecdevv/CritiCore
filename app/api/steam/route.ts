import { normalizeString } from "@/app/utility/helper";

interface AppCacheEntry {
  matchingApps: { name: string; appid: number }[];
  expires: number;
}

interface AppDataCacheEntry {
  id: number;
  name: string;
  releaseDate: string;
  developer: string;
  publisher: string;
  ageRating: number;
  image: string;
  url: string;
  devUrl: string;
  criticScore: number;
  userScore: number;
  totalReviews: number;
  expires: number;
}

const appCache: Record<string, AppCacheEntry> = {};
const appDataCache: Record<string, AppDataCacheEntry> = {};

async function getAppIDByName(name: string): Promise<AppCacheEntry> {
  const cacheKey = normalizeString(name);
  const now = Date.now() / 1000;
  const cachedEntry = appCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Fetch applist for app ID based on the game name from params in url
    const response = await fetch(`${process.env.STEAM_API_APPLIST}`);
    if (!response.ok) throw new Error(`STEAM: Failed to fetch applist data, status code: ${response.status}`);
    const data = await response.json();
    if (!data) throw new Error('STEAM: Invalid applist data, status code: 404');

    // Find duplicate app names and get their data
    const matchingApps = data.applist.apps.filter((app: { name: string; appid: number }) => 
      normalizeString(app.name) === cacheKey);
    if (!matchingApps.length) throw new Error('STEAM: No matching app(s) found, status code: 404');

    const newEntry = {
      matchingApps,
      expires: now + 600  // 10 minutes
    };

    appCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    console.error(error);
    const newEntry = { matchingApps: [], expires: now + 600 };
    appCache[cacheKey] = newEntry;
    throw new Error('STEAM: Could not retrieve applist data');
  }
}

async function getAppData(appid: number): Promise<AppDataCacheEntry> {
  const cacheKey = `app-${appid}`;
  const now = Date.now() / 1000;
  const cachedEntry = appDataCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Fetch game data based on the app ID
    const [detailsResponse, reviewsResponse] = await Promise.all([
      fetch(`${process.env.STEAM_API_APPDETAILS}?${new URLSearchParams({ appids: appid.toString() })}`, { cache: 'force-cache' }),
      fetch(`${process.env.STEAM_API_APPREVIEWS}/${appid}?${new URLSearchParams({ json: '1', language: 'all' })}`, { cache: 'force-cache' }),
    ]);
    if (!detailsResponse.ok || !reviewsResponse.ok) {
      throw new Error('STEAM: Failed to fetch app data, status code: ' + (detailsResponse.ok ? detailsResponse.status : reviewsResponse.status));
    }
    const [detailsData, reviewsData] = await Promise.all([
      detailsResponse.json(),
      reviewsResponse.json(),
    ]);
    if (!detailsData) throw new Error('STEAM: Invalid details data, status code: 404');
    if (!reviewsData || reviewsData.success !== 1) throw new Error('STEAM: Invalid reviews data, status code: 404'); // Check for validity using its success property since its response/data is always returning ok

    // Extract data from the responses
    const id = appid
    const name = detailsData[appid]?.data?.name
    const date = detailsData[appid]?.data?.release_date?.date
    const releaseDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const developer = detailsData[appid]?.data?.developers[0]
    const publisher = detailsData[appid]?.data?.publishers[0]
    const ageRating = detailsData[appid]?.data?.required_age
    const image = detailsData[appid]?.data?.header_image
    const url = `${process.env.NEXT_PUBLIC_STEAM_STORE_URL}/${appid}`
    const devUrl = detailsData[appid]?.data?.website

    // Calculate critic and user scores
    const { query_summary: { total_reviews: totalReviews, total_positive: totalPositive } } = reviewsData;
    const criticScore = -1;
    const userScore = totalReviews ? Math.floor((totalPositive / totalReviews) * 100) : -1;

    const newEntry = {
      id,
      name,
      releaseDate,
      developer,
      publisher,
      ageRating,
      image,
      url,
      devUrl,
      criticScore,
      userScore,
      totalReviews,
      expires: now + 600  // 10 minutes
    };

    appDataCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    console.error(`STEAM: Error retrieving app data for app ID: ${appid}, Error:`, error);
    throw new Error('STEAM: Could not retrieve app data');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get('gameName') || '';

  try {
    // Fetch matching apps from applist based on the game name and get the full app data based on the app ID. If there are no matching apps in the cache, throw an error.
    const { matchingApps } = await getAppIDByName(gameName);
    if (!matchingApps.length) throw new Error('STEAM: CACHED - No matching app(s) found, status code: 404');
    const appDataPromises = matchingApps.map(async (app) => await getAppData(app.appid));
    const appData = await Promise.all(appDataPromises);
    // Find the app with the most reviews
    const appWithMostReviews = appData.reduce(
      (mostReviewsApp, currentApp) => 
        currentApp.totalReviews > mostReviewsApp.totalReviews ? currentApp : mostReviewsApp,
      appData[0]
    );

    return Response.json({ status: 200, ...appWithMostReviews });
  } catch (error) {
    console.error('STEAM: Unexpected error fetching app data:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}


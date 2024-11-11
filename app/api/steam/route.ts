import { normalizeString } from "@/app/utility/helper";
import { formatDate } from "@/app/utility/formatDate";

interface AppCacheEntry {
  matchingApps: { name: string; appid: number }[] | [];
  expires: number;
}

interface AppDataCacheEntry {
  id: number | undefined;
  name: string | undefined;
  releaseDate: string | undefined;
  developer: string | undefined;
  publisher: string | undefined;
  ageRating: number | undefined;
  headerImage: string | undefined;
  capsuleImage: string | undefined;
  url: string | undefined;
  devUrl: string | undefined;
  criticScore: number | undefined;
  userScore: number | undefined;
  reviewDesc: string | undefined;
  totalPositive: number | undefined;
  totalNegative: number | undefined;
  totalReviews: number | undefined;
  expires: number;
}
interface SteamMoreDataCacheEntry {
  currentPlayers: number | undefined;
  expires: number;
}

const appCache: Record<string, AppCacheEntry> = {};
const appDataCache: Record<string, AppDataCacheEntry> = {};
const steamMoreDataCache: Record<string, SteamMoreDataCacheEntry> = {};

async function getAppIDByName(name: string): Promise<AppCacheEntry> {
  const cacheKey = normalizeString(name);
  const now = Date.now() / 1000;
  const cachedEntry = appCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) {
    console.log(`Returning cached app id for game name: ${name}`);
    return cachedEntry;
  }

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

  if (cachedEntry && cachedEntry.expires > now) {
    console.log(`Returning cached app data for game id: ${appid}`);
    return cachedEntry;
  }

  try {
    // Fetch game data based on the app ID
    const [detailsResponse, reviewsResponse] = await Promise.all([
      fetch(`${process.env.STEAM_API_APPDETAILS}?${new URLSearchParams({ appids: appid.toString() })}`, { cache: 'force-cache' }),
      fetch(`${process.env.STEAM_API_APPREVIEWS}/${appid}?${new URLSearchParams({ json: '1', language: 'all', purchase_type: 'all' })}`, { cache: 'force-cache' }),
    ]);
    if (!detailsResponse.ok || !reviewsResponse.ok) {
      throw new Error('STEAM: Failed to fetch app data, status code: ' + (detailsResponse.ok ? detailsResponse.status : reviewsResponse.status));
    }
    const [detailsData, reviewsData] = await Promise.all([
      detailsResponse.json(),
      reviewsResponse.json(),
    ]);
    if (!detailsData) throw new Error('STEAM: Invalid details data, status code: 404');
    if (!reviewsData || reviewsData.success !== 1) throw new Error('STEAM: Invalid reviews data, status code: 404');  // Check for validity using its success property since its response/data is always returning ok

    // Extract data from the responses
    const id = appid || undefined
    const name = detailsData[appid]?.data?.name || undefined
    const date = detailsData[appid]?.data?.release_date?.date || undefined
    const releaseDate = date ? formatDate(date) : undefined
    const developer = detailsData[appid]?.data?.developers[0] || undefined
    const publisher = detailsData[appid]?.data?.publishers[0] || undefined
    const ageRating = detailsData[appid]?.data?.required_age || undefined
    const headerImage = detailsData[appid]?.data?.header_image || undefined
    const capsuleImage = process.env.STEAM_CDN_CAPSULE + '/' + appid + '/' + 'library_600x900_2x.jpg' || undefined
    const url = `${process.env.NEXT_PUBLIC_STEAM_STORE_URL}/${appid}` || undefined
    const devUrl = detailsData[appid]?.data?.website || undefined

    // Calculate critic and user scores
    const { query_summary: { review_score_desc: reviewDesc, total_positive: totalPositive, total_negative: totalNegative, total_reviews: totalReviews  } } = reviewsData;
    const criticScore = -1;
    const userScore = Math.floor((totalPositive / totalReviews) * 100);
    
    const newEntry = {
      id,
      name,
      releaseDate,
      developer,
      publisher,
      ageRating,
      headerImage,
      capsuleImage,
      url,
      devUrl,
      criticScore,
      userScore,
      reviewDesc,
      totalPositive,
      totalNegative,
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

async function getSteamMoreData(displayType: string, appid: number): Promise<SteamMoreDataCacheEntry> {
  if (displayType !== 'steam' || !appid) return { currentPlayers: undefined, expires: 0 };

  const cacheKey = `app-${appid}`;
  const now = Date.now() / 1000;
  const cachedEntry = steamMoreDataCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) {
    console.log(`Returning cached EXTRA app data for game id: ${appid}`);
    return cachedEntry;
  }

  try {
    const allResponseData = await Promise.all([
      fetch(`${process.env.STEAM_API_NUM_PLAYERS}/?${new URLSearchParams({ appid: appid.toString(), format: 'json' })}`, { cache: 'force-cache' }),
    ]);
    const [numPlayersResponse] = allResponseData
    if (!allResponseData || !numPlayersResponse.ok) {
      throw new Error('STEAM: Failed to fetch EXTRA app data, status code: ' + numPlayersResponse.status);
    }
    const [numPlayersData] = await Promise.all([
      numPlayersResponse.json(),
    ]);

    // Extract data from the responses
    const currentPlayers = numPlayersData.response.player_count || undefined;

    const newEntry = {
      currentPlayers,
      expires: now + 600
    };

    steamMoreDataCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    console.error(`STEAM: Error retrieving EXTRA app data for app ID: ${appid}, Error:`, error);
    throw new Error('STEAM: Could not retrieve EXTRA app data');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get('name') || '';
  const displayType = searchParams.get('display') || '';

  try {
    // Fetch matching apps from applist based on the game name and get the full app data based on the app ID. If there are no matching apps in the cache, throw an error.
    const { matchingApps } = await getAppIDByName(gameName);
    if (!matchingApps.length) throw new Error('STEAM: CACHED - No matching app(s) found, status code: 404');
    const appDataPromises = matchingApps.map(async (app) => await getAppData(app.appid));
    const appData = await Promise.all(appDataPromises);
    // Find the app with the most reviews
    const appWithMostReviews = appData.reduce(
      (mostReviewsApp, currentApp) =>
        (currentApp.totalReviews || 0) > (mostReviewsApp.totalReviews || 0) ? currentApp : mostReviewsApp,
      appData[0]
    );

    // Fetch extra data
    const { currentPlayers } = await getSteamMoreData(displayType, appWithMostReviews.id as number);

    return Response.json({ status: 200, ...appWithMostReviews, currentPlayers });
  } catch (error) {
    console.error('STEAM: Unexpected error fetching app data:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}


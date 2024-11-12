import { normalizeString } from "@/app/utility/helper";
import { formatDate } from "@/app/utility/formatDate";

type SteamAppList = { appid: number; name: string; }[];

interface AppListCacheEntry {
  appList: { appid: number; name: string; }[] | [];
  expires: number;
}

interface AppIDCacheEntry {
  matchingApps: { appid: number; name: string; }[] | [];
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

const appListCache: Record<string, AppListCacheEntry> = {};
const appIDCache: Record<string, AppIDCacheEntry> = {};
const appDataCache: Record<string, AppDataCacheEntry> = {};
const steamMoreDataCache: Record<string, SteamMoreDataCacheEntry> = {};

async function getAppList(): Promise<SteamAppList> {
  const cacheKey = 'steam-applist';
  const now = Date.now() / 1000;
  const cachedEntry = appListCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) {
    console.log('STEAM: Returning cached applist');
    return cachedEntry.appList;
  }

  try {
    // Fetch applist data
    const response = await fetch(`${process.env.STEAM_API_APPLIST}`);
    if (!response.ok) throw new Error(`Failed to fetch applist data, status code: ${response.status}`);
    const data = await response.json();
    if (!data) throw new Error('Invalid applist data, status code: 404');

    // Extract data from the response
    const appList = data.applist.apps;

    appListCache[cacheKey] = { appList, expires: now + 86400 };
    return appList;
  } catch (error) {
    appListCache[cacheKey] = { appList: [], expires: 0 };
    console.log('STEAM: Error retrieving applist');
    throw error;
  }
}

async function getAppIDByName(name: string): Promise<AppIDCacheEntry> {
  const cacheKey = normalizeString(name);
  const now = Date.now() / 1000;
  const cachedEntry = appIDCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) {
    console.log(`STEAM: Returning cached app id for game name: ${name}`);
    return cachedEntry;
  }

  try {
    // Fetch search data for app ID(s) based on the game name from params in url
    const appList = await getAppList();
    const matchingApps = appList.filter((app: { appid: number, name: string; }) => normalizeString(app.name) === cacheKey);
    if (!matchingApps.length) throw new Error('No matching app(s) found, status code: 404');

    const newEntry = {
      matchingApps,
      expires: now + 600, // 10 minutes
    };

    appIDCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    const newEntry = { matchingApps: [], expires: now + 600 };
    appIDCache[cacheKey] = newEntry;
    console.log(`STEAM: Error retrieving app id for game name: ${name}`);
    throw error;
  }
}

async function getAppData(appid: number): Promise<AppDataCacheEntry> {
  const cacheKey = `app-${appid}`;
  const now = Date.now() / 1000;
  const cachedEntry = appDataCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) {
    console.log(`STEAM: Returning cached app data for game id: ${appid}`);
    return cachedEntry;
  }

  try {
    // Fetch game data based on the app ID
    const [detailsResponse, reviewsResponse] = await Promise.all([
      fetch(`${process.env.STEAM_API_APPDETAILS}?${new URLSearchParams({ appids: appid.toString() })}`),
      fetch(`${process.env.STEAM_API_APPREVIEWS}/${appid}?${new URLSearchParams({ json: '1', language: 'all', purchase_type: 'all' })}`),
    ]);
    if (!detailsResponse.ok || !reviewsResponse.ok) {
      throw new Error(`Failed to fetch app data, status code: ${(detailsResponse.ok ? detailsResponse.status : reviewsResponse.status)}`);
    }
    const [detailsData, reviewsData] = await Promise.all([
      detailsResponse.json(),
      reviewsResponse.json(),
    ]);
    if (!detailsData) throw new Error('Invalid details data, status code: 404');
    if (!reviewsData || reviewsData.success !== 1) throw new Error('Invalid reviews data, status code: 404');  // Check for validity using its success property since its response/data is always returning ok
    
    // Extract data from the responses
    const id = appid || undefined
    const name = detailsData[appid]?.data?.name || undefined
    const date = detailsData[appid]?.data?.release_date?.date || undefined
    const releaseDate = date ? formatDate(date) : undefined
    const developer = detailsData[appid]?.data?.developers[0] || undefined
    const publisher = detailsData[appid]?.data?.publishers[0] || undefined
    const ageRating = detailsData[appid]?.data?.required_age || undefined
    const headerImage = detailsData[appid]?.data?.header_image || undefined
    const url = `${process.env.NEXT_PUBLIC_STEAM_STORE_URL}/${appid}` || undefined
    const devUrl = detailsData[appid]?.data?.website || undefined

    // Calculate critic and user scores
    const { query_summary: { review_score_desc: reviewDesc, total_positive: totalPositive, total_negative: totalNegative, total_reviews: totalReviews  } } = reviewsData;
    const criticScore = -1;
    const userScore = Math.floor((totalPositive / totalReviews) * 100) || undefined;

    // Fetch capsule image to ensure it exists, otherwise return undefined capsuleImage
    const capsuleImageUrl = process.env.STEAM_CDN_CAPSULE + '/' + appid + '/' + 'library_600x900_2x.jpg';
    const capsuleImageResponse = await fetch(capsuleImageUrl, { method: 'HEAD' });
    const capsuleImage = capsuleImageResponse.ok ? capsuleImageUrl : undefined;
    
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
    console.log(`STEAM: Error retrieving app data for app ID: ${appid}`);
    throw error;
  }
}

async function getSteamMoreData(displayType: string, appid: number): Promise<SteamMoreDataCacheEntry> {
  if (displayType !== 'steam' || !appid) return { currentPlayers: undefined, expires: 0 };

  const cacheKey = `app-${appid}`;
  const now = Date.now() / 1000;
  const cachedEntry = steamMoreDataCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) {
    console.log(`STEAM: Returning cached EXTRA app data for game id: ${appid}`);
    return cachedEntry;
  }

  try {
    // Fetch game data based on the app ID
    const allResponses = await Promise.all([
      fetch(`${process.env.STEAM_API_NUM_PLAYERS}?${new URLSearchParams({ appid: appid.toString(), format: 'json' })}`),
    ]);
    const [numPlayersResponse] = allResponses
    if (!allResponses || !numPlayersResponse.ok) {
      throw new Error(`Failed to fetch EXTRA app data, status code: ${numPlayersResponse.status}`);
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
    console.log(`STEAM: Error retrieving EXTRA app data for app ID: ${appid}`);
    throw error;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gameName = url.pathname.split('/').pop() as string || '';
  const displayType = url.searchParams.get('display') || '';

  try {
    if (!gameName) throw new Error('Invalid game name provided, status code: 400');
    
    // Check if the game name is a number and fetch based on the app ID
    if (!isNaN(Number(gameName))) {
      const appData = await getAppData(Number(gameName));
      return Response.json({ status: 200, ...appData });
    }
    
    // Fetch matching apps from applist based on the game name and get the full app data based on the app ID. If there are no matching apps in the cache, throw an error.
    const { matchingApps } = await getAppIDByName(gameName);
    if (!matchingApps.length) throw new Error('CACHED - No matching app(s) found, status code: 404');
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
    console.error('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}


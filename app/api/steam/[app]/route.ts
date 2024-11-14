import { normalizeString } from "@/app/utility/helper";
import { formatDate } from "@/app/utility/formatDate";

interface AppIDCacheEntry {
  matchingApps: number[] | [];
  expires: number;
}

interface AppDataCacheEntry {
  id: number | undefined;
  name: string | undefined;
  releaseDate: string | undefined;
  developer: string | undefined;
  publisher: string | undefined;
  ageRating: number | undefined;
  criticScore: number | undefined;
  userScore: number | undefined;
  reviewDesc: string | undefined;
  totalPositive: number | undefined;
  totalNegative: number | undefined;
  totalReviews: number | undefined;
  url: string | undefined;
  devUrl: string | undefined;
  headerImage: string | undefined;
  capsuleImage: string | undefined;
  currentPlayers: number | undefined;
  expires: number;
}

const appIDCache: Record<string, AppIDCacheEntry> = {};
const appDataCache: Record<string, AppDataCacheEntry> = {};

async function getAppIDByName(baseUrl: string, name: string): Promise<AppIDCacheEntry> {
  const cacheKey = normalizeString(name);
  const now = Date.now() / 1000;
  const cachedEntry = appIDCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Fetch search data for app ID(s) based on the game name from params in url
    const appListResponse = await fetch(`${baseUrl}/api/steam/applist`);
    if (!appListResponse.ok) throw new Error(`Failed to fetch app list data, status code: ${appListResponse.status}`);
    const appListData = await appListResponse.json();
    const appList = appListData.applist;
    const matchingApps = appList.filter((app: { appid: number; name: string }) => normalizeString(app.name) === cacheKey).map((app: { appid: number; name: string })=> app.appid);
    if (!matchingApps.length) throw new Error('No matching app(s) found, status code: 404');

    const newEntry = {
      matchingApps,
      expires: now + 300, // 5 minutes
    };
    
    appIDCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    const newEntry = { matchingApps: [], expires: now + 300 };
    appIDCache[cacheKey] = newEntry;
    console.log(`STEAM: Error retrieving app id for game name: ${cacheKey}`);
    throw error;
  }
}

async function getAppData(appid: number): Promise<AppDataCacheEntry> {
  const cacheKey = `app-${appid}`;
  const now = Date.now() / 1000;
  const cachedEntry = appDataCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Fetch game data based on the app ID
    const allResponses = await Promise.all([
      fetch(`${process.env.STEAM_API_APPDETAILS}?${new URLSearchParams({ appids: appid.toString() })}`),
      fetch(`${process.env.STEAM_API_APPREVIEWS}/${appid}?${new URLSearchParams({ json: '1', language: 'all', purchase_type: 'all' })}`),
      fetch(`${process.env.STEAM_API_NUM_PLAYERS}?${new URLSearchParams({ appid: appid.toString(), format: 'json' })}`)
    ]);
    const [detailsResponse, reviewsResponse, playersResponse] = allResponses;
    if (!allResponses) {
      throw new Error('Failed to fetch app data, no responses available');
    }
    const failedResponse = allResponses.find(response => !response.ok);
    if (failedResponse) {
      throw new Error(`Failed to fetch app data, status code: ${failedResponse.status}`);
    }
    const [detailsData, reviewsData, playersData] = await Promise.all([
      detailsResponse.json(),
      reviewsResponse.json(),
      playersResponse.json()
    ]);
    if (!detailsData || !detailsData[appid] || detailsData[appid].success !== true) throw new Error('Invalid details data, status code: 404');
    if (detailsData[appid].data.type !== 'game') throw new Error('Details data is not a game, status code: 404');
    if (!reviewsData || reviewsData.success !== 1) throw new Error('Invalid reviews data, status code: 404');  // Check for validity using its success property since its response/data is always returning ok

    // Extract data from the responses
    const id = detailsData[appid]?.data?.steam_appid || undefined
    const name = detailsData[appid]?.data?.name || undefined
    const date = detailsData[appid]?.data?.release_date?.date || undefined
    const releaseDate = date ? formatDate(date) : undefined
    const developer = detailsData[appid]?.data?.developers[0] || undefined
    const publisher = detailsData[appid]?.data?.publishers[0] || undefined
    const ageRating = detailsData[appid]?.data?.required_age || undefined
    const headerImage = detailsData[appid]?.data?.header_image || undefined
    const url = `${process.env.NEXT_PUBLIC_STEAM_STORE_URL}/${appid}` || undefined
    const devUrl = detailsData[appid]?.data?.website || undefined
    const currentPlayers = playersData.response.player_count || undefined;

    // Calculate critic and user scores
    const { query_summary: { review_score_desc: reviewDesc, total_positive: totalPositive, total_negative: totalNegative, total_reviews: totalReviews  } } = reviewsData;
    const criticScore = -1;
    const userScore = Math.floor((totalPositive / totalReviews) * 100) || undefined;

    // Fetch capsule image to ensure it exists, otherwise return undefined capsuleImage
    const capsuleImageUrl = process.env.STEAM_CDN_CAPSULE + '/' + id + '/' + 'library_600x900_2x.jpg';
    const capsuleImageResponse = await fetch(capsuleImageUrl, { method: 'HEAD' });
    const capsuleImage = capsuleImageResponse.ok ? capsuleImageUrl : undefined;
    
    const newEntry = {
      id,
      name,
      releaseDate,
      developer,
      publisher,
      ageRating,
      criticScore,
      userScore,
      reviewDesc,
      totalPositive,
      totalNegative,
      totalReviews,
      headerImage,
      capsuleImage,
      url,
      devUrl,
      currentPlayers,
      expires: now + 300  // 5 minutes
    };

    // Cache the appIDCache for the normalized name to skip appIDByName calls since normalized names are === page's game name
    const normalizedAppName = normalizeString(name);
    if (normalizedAppName) {
      const newAppIDCacheEntry = { matchingApps: [id], expires: now + 300 };
      appIDCache[normalizedAppName] = newAppIDCacheEntry;
    }

    appDataCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    console.log(`STEAM: Error retrieving app data for app ID: ${appid}`);
    throw error;
  }
}

async function getMultipleAppData(appids: number[]): Promise<AppDataCacheEntry[]> {
  // Filters is required for multiple app ids to work but it does not return the full data
  // Therefore we are only using it for its response/data validity
  const response = await fetch(`${process.env.STEAM_API_APPDETAILS}?${new URLSearchParams({ appids: appids.join(','), filters: 'price_overview' })}`);
  if (!response.ok) throw new Error(`Failed to fetch multiple app(s) data, status code: ${response.status}`);
  const data = await response.json();
  if (!data) throw new Error('Invalid multiple app(s) data, status code: 404');

  // Filter out invalid app IDs and retrieve app data for valid app IDs. If the app ID is not a game, getAppData will throw an error and validAppIDs will not include the app ID
  const validAppIDs = Object.keys(data).filter((appid: string) => data[appid].success && data[appid].data);
  const appDatas = await Promise.all(
    validAppIDs.map(async (appid) => {
      try {
        const appData = await getAppData(Number(appid));
        if (!appData || !appData.id) return null;
        return appData;
      } catch {
        // If the app ID is invalid, cache empty data to prevent future calls and exclude from results by returning null
        const cacheKey = `app-${appid}`;
        const now = Date.now() / 1000;
        const newEntry = { 
          id: undefined, name: undefined, releaseDate: undefined, developer: undefined, publisher: undefined, ageRating: undefined,
          criticScore: undefined, userScore: undefined, reviewDesc: undefined, totalPositive: undefined, totalNegative: undefined, totalReviews: undefined, 
          url: undefined, devUrl: undefined, headerImage: undefined, capsuleImage: undefined, currentPlayers: undefined, expires: now + 86400 };  // 1 day
        appDataCache[cacheKey] = newEntry;
        return null;
      }
    })
  ).then(results => results.filter(data => data !== null));

  // Remove duplicates based on the ID
  const uniqueAppDatas = Array.from(new Map(appDatas.map(app => [app.id, app])).values());

  return uniqueAppDatas;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = new URL(request.url).origin;
  const identifier = url.pathname.split('/').pop() as string || '';
  
  try {
    const identifiers = identifier.split(',').map(id => id.trim());
    if (!identifiers.length) throw new Error('Invalid game name or app ID(s) provided, status code: 400');

    // Check if the game name is a single string id and fetch based on the app ID
    if (!isNaN(Number(identifiers[0])) && identifiers.length === 1) {
      const appData = await getAppData(Number(identifiers[0]));
      return Response.json({ status: 200, appData });
    }

    // Check if the game name is a multiple string ids and fetch based on the app IDs
    if (!isNaN(Number(identifiers[0])) && identifiers.length > 1) {
      const appDatas = await getMultipleAppData(identifiers.map(Number));
      return Response.json({ status: 200, appDatas });
    }
    
    // Fetch matching apps from applist based on the game name and get the full app data based on the app ID. If there are no matching apps in the cache, throw an error.
    const { matchingApps } = await getAppIDByName(baseUrl, identifier);
    if (!matchingApps.length) throw new Error('CACHED - No matching app(s) found, status code: 404');
    const appDataPromises = matchingApps.map((appid) => getAppData(appid));
    const appData = await Promise.all(appDataPromises);

    // Find the app with the most reviews
    const appWithMostReviews = appData.length === 1 ? appData[0] : appData.reduce(
      (mostReviewsApp, currentApp) =>
        (currentApp.totalReviews || 0) > (mostReviewsApp.totalReviews || 0) ? currentApp : mostReviewsApp,
      appData[0]
    );

    return Response.json({ status: 200, ...appWithMostReviews });
  } catch (error) {
    console.error('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}

import { normalizeString } from "@/app/utility/helper";
import formatDate from "@/app/utility/formatDate";
import generateBlurDataURL from "@/app/utility/generateBlurDataURL";

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
  totalPositive: number | undefined;
  totalNegative: number | undefined;
  totalReviews: number | undefined;
  reviewDesc: string | undefined;
  url: string | undefined;
  devUrl: string | undefined;
  headerImage: { og: string | undefined; blur: string | undefined } | undefined;
  capsuleImage: { og: string | undefined; blur: string | undefined } | undefined;
  currentPlayers: number | undefined;
  expires: number;
}

const MAX_APPID_CACHE_SIZE = 1000;
const MAX_APPDATA_CACHE_SIZE = 200;
const appIDCache = new Map<string, AppIDCacheEntry>();
const appDataCache = new Map<string, AppDataCacheEntry>();

const emptyDataCacheEntry: AppDataCacheEntry = {
  id: undefined, name: undefined, releaseDate: undefined, developer: undefined, publisher: undefined, ageRating: undefined,
  criticScore: undefined, userScore: undefined, totalPositive: undefined, totalNegative: undefined, totalReviews: undefined, reviewDesc: undefined,
  url: undefined, devUrl: undefined, headerImage: undefined, capsuleImage: undefined, currentPlayers: undefined, expires: 0
};

async function getAppIDByName(baseUrl: string, name: string): Promise<AppIDCacheEntry> {
  const cacheKey = normalizeString(name);
  const now = Date.now() / 1000;
  const cachedEntry = appIDCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Cache empty entry for 5 minutes before fetching (checks if the cache is full)
    if (appIDCache.size >= MAX_APPID_CACHE_SIZE) {
      const oldestEntry = Array.from(appIDCache).sort((a, b) => a[1].expires - b[1].expires)[0];
      appIDCache.delete(oldestEntry[0]);
    }
    appIDCache.set(cacheKey, { matchingApps: [], expires: now + 300 });

    // Fetching search data for app ID(s) based on the game name from params in url
    const appListResponse = await fetch(`${baseUrl}/api/steam/applist`);
    if (!appListResponse.ok) throw new Error(`Failed to fetch app list data, status code: ${appListResponse.status}`);
    const appListData = await appListResponse.json();
    const appList = appListData.applist;
    const matchingApps = appList.filter((app: { appid: number; name: string }) => normalizeString(app.name) === cacheKey).map((app: { appid: number; name: string })=> app.appid);
    if (!matchingApps.length) throw new Error('No matching app(s) found, status code: 404');

    // Update cache entry and return this entry
    const newEntry = {
      matchingApps,
      expires: now + 600, // 10 minutes
    };

    appIDCache.set(cacheKey, newEntry);
    return newEntry;
  } catch (error) {
    console.log(`STEAM: Error retrieving app id for game name: ${cacheKey}`);
    throw error;
  }
}

async function getAppData(appid: number): Promise<AppDataCacheEntry> {
  const cacheKey = `app-${appid}`;
  const now = Date.now() / 1000;
  const cachedEntry = appDataCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Cache empty entry for 5 minutes before fetching (checks if the cache is full)
    if (appDataCache.size >= MAX_APPDATA_CACHE_SIZE) {
      const oldestEntry = Array.from(appDataCache).sort((a, b) => a[1].expires - b[1].expires)[0];
      appDataCache.delete(oldestEntry[0]);
    }
    appDataCache.set(cacheKey, { ...emptyDataCacheEntry, expires: now + 300 });

    // Fetching game data based on the app ID
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
    const id = detailsData[appid]?.data?.steam_appid;
    const name = detailsData[appid]?.data?.name;
    const date = detailsData[appid]?.data?.release_date?.date;
    const releaseDate = date ? formatDate(date) : undefined;
    const developer = detailsData[appid]?.data?.developers[0];
    const publisher = detailsData[appid]?.data?.publishers[0];
    const ageRating = detailsData[appid]?.data?.required_age;
    const url = `${process.env.NEXT_PUBLIC_STEAM_STORE_URL}/${appid}`;
    const devUrl = detailsData[appid]?.data?.website;
    const currentPlayers = playersData.response.player_count;

    // Calculate critic and user scores
    const { query_summary: { total_positive: totalPositive, total_negative: totalNegative, total_reviews: totalReviews, review_score_desc: reviewDesc } } = reviewsData;
    const criticScore = -1;
    const userScore = Math.floor((totalPositive / totalReviews) * 100);

    // Fetch header image to ensure it exists, otherwise return undefined headerImage
    const headerImgTestUrl = detailsData[appid]?.data?.header_image;
    const headerImgResponse = await fetch(headerImgTestUrl);
    const headerImgBuffer = headerImgResponse.ok ? await headerImgResponse.arrayBuffer() : undefined;
    const headerImgBlur = headerImgBuffer ? await generateBlurDataURL(headerImgBuffer) : undefined;
    const headerImgUrl = headerImgResponse.ok ? headerImgTestUrl : undefined;
    const headerImage = headerImgUrl ? { og: headerImgUrl, blur: headerImgBlur } : undefined;

    // Fetch capsule image to ensure it exists, otherwise return undefined capsuleImage
    const capsuleImgTestUrl = process.env.STEAM_CDN_CAPSULE + '/' + id + '/' + 'library_600x900_2x.jpg';
    const capsuleImgResponse = await fetch(capsuleImgTestUrl);
    const capsuleImgBuffer = capsuleImgResponse.ok ? await capsuleImgResponse.arrayBuffer() : undefined;
    const capsuleImgBlur = capsuleImgBuffer ? await generateBlurDataURL(capsuleImgBuffer) : undefined;
    const capsuleImgUrl = capsuleImgResponse.ok ? capsuleImgTestUrl : undefined;
    const capsuleImage = capsuleImgUrl ? { og: capsuleImgUrl, blur: capsuleImgBlur } : undefined;

    // Update cache entry and return this entry
    const newEntry = {
      id,
      name,
      releaseDate,
      developer,
      publisher,
      ageRating,
      criticScore,
      userScore,
      totalPositive,
      totalNegative,
      totalReviews,
      reviewDesc,
      url,
      devUrl,
      headerImage,
      capsuleImage,
      currentPlayers,
      expires: now + 300  // 5 minutes
    };

    // Cache the appIDCache for the normalized name to skip appIDByName calls since normalized names are === page's game name
    const normalizedAppName = normalizeString(name);
    if (normalizedAppName) {
      appIDCache.set(normalizedAppName, { matchingApps: [id], expires: now + 600 });
    }

    appDataCache.set(`app-${id}`, newEntry);
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

  // Filter out invalid app IDs and retrieve app data for valid app IDs.
  // If the app ID is not a game or errors occur, getAppData will throw an error and validAppIDs will not include the app ID by returning null.
  const validAppIDs = Object.keys(data).filter((appid: string) => data[appid].success && data[appid].data);
  const appDatas = await Promise.all(
    validAppIDs.map(async (appid) => {
      try {
        const appData = await getAppData(Number(appid));
        if (!appData || !appData.id) return null;
        return appData;
      } catch {
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
    
    // Fetch based on the normalized name by getting ids from appIDByName then fetching app data with ids
    const { matchingApps } = await getAppIDByName(baseUrl, identifier);
    if (!matchingApps.length) throw new Error('CACHED - No matching app(s) found, status code: 404');
    const appData = (
      await Promise.all(matchingApps.map(appid => getAppData(appid).catch(() => null)))
    ).filter(data => data !== null);
    if (!appData.length) throw new Error(`No app data found for matching app(s): [${matchingApps.join(',')}], status code: 404`);

    // If there is only one app data, return it, otherwise return the app with the most reviews
    if (appData.length === 1) {
      return Response.json({ status: 200, ...appData[0] });
    }
    const appWithMostReviews = appData.reduce((mostReviewsApp, currentApp) =>
      (currentApp.totalReviews || 0) > (mostReviewsApp.totalReviews || 0) ? currentApp : mostReviewsApp
    );
    
    return Response.json({ status: 200, ...appWithMostReviews });
  } catch (error) {
    console.error('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}

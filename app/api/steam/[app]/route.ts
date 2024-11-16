import { getCacheSize } from "@/app/utility/data";
import { formatDate } from "@/app/utility/dates";
import { normalizeString } from "@/app/utility/strings";

const MAX_ID_CACHE_SIZE = 50 * 1024 * 1024;       // 50MB
const ID_REVALIDATION_TIME = 1 * 10 * 60 * 1000;  // 10 minutes
const appIDCache = new Map();

async function getAppIDByName(baseUrl: string, name: string) {
  const cacheKey = normalizeString(name);
  if (appIDCache.has(cacheKey)) return appIDCache.get(cacheKey);

  try {
    // Cache empty entry for 5 minutes before fetching (checks if the cache is full)
    if (getCacheSize(appIDCache) >= MAX_ID_CACHE_SIZE) {
      const firstKey = appIDCache.keys().next().value as string;
      appIDCache.delete(firstKey);
    }
    appIDCache.set(cacheKey, []);
    setTimeout(() => appIDCache.delete(cacheKey), 300 * 1000);  // 5 minutes

    // Fetching search data for app ID(s) based on the game name from params in url
    const appListResponse = await fetch(`${baseUrl}/api/steam/applist`);
    if (!appListResponse.ok) throw new Error(`Failed to fetch app list data, status code: ${appListResponse.status}`);
    const appListData = await appListResponse.json();
    const appList = appListData.applist;
    const matchingApps = appList.filter((app: { appid: number; name: string }) => normalizeString(app.name) === cacheKey).map((app: { appid: number; name: string })=> app.appid);
    if (!matchingApps.length) throw new Error('No matching app(s) found, status code: 404');

    // Update cache entry and return this entry
    appIDCache.set(cacheKey, matchingApps);
    setTimeout(() => appIDCache.delete(cacheKey), ID_REVALIDATION_TIME);
    return matchingApps;
  } catch (error) {
    console.log(`STEAM: Error retrieving app id for game name: ${cacheKey}`);
    throw error;
  }
}

const MAX_DATA_CACHE_SIZE = 150 * 1024 * 1024;      // 150MB
const DATA_REVALIDATION_TIME = 1 * 5 * 60 * 1000;   // 5 minutes
const appDataCache = new Map();

async function getAppData(appid: number) {
  const cacheKey = `app-${appid}`;
  if (appDataCache.has(cacheKey)) return appDataCache.get(cacheKey);

  try {
    // Cache empty entry for 5 minutes before fetching (checks if the cache is full)
    if (getCacheSize(appDataCache) >= MAX_DATA_CACHE_SIZE) {
      const firstKey = appDataCache.keys().next().value as string;
      appDataCache.delete(firstKey);
    }
    appDataCache.set(cacheKey, {});
    setTimeout(() => appDataCache.delete(cacheKey), DATA_REVALIDATION_TIME);

    // Fetching game data based on the app ID
    const allResponses = await Promise.all([
      fetch(`${process.env.STEAM_API_APPDETAILS}?${new URLSearchParams({ appids: appid.toString() })}`, { next: { revalidate: DATA_REVALIDATION_TIME } }),
      fetch(`${process.env.STEAM_API_APPREVIEWS}/${appid}?${new URLSearchParams({ json: '1', language: 'all', purchase_type: 'all' })}`, { next: { revalidate: DATA_REVALIDATION_TIME } }),
      fetch(`${process.env.STEAM_API_NUM_PLAYERS}?${new URLSearchParams({ appid: appid.toString(), format: 'json' })}`),
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
    const headerImage = detailsData[appid]?.data?.header_image;
    const currentPlayers = playersData.response.player_count;

    // Calculate critic and user scores
    const { query_summary: { total_positive: totalPositive, total_negative: totalNegative, total_reviews: totalReviews, review_score_desc: reviewDesc } } = reviewsData;
    const criticScore = -1;
    const userScore = Math.floor((totalPositive / totalReviews) * 100);

    // Fetch capsule image to ensure it exists, otherwise return undefined capsuleImage
    const capsuleImageUrl = process.env.STEAM_CDN_CAPSULE + '/' + id + '/' + 'library_600x900_2x.jpg';
    const capsuleImageResponse = await fetch(capsuleImageUrl, { method: 'HEAD' });
    const capsuleImage = capsuleImageResponse.ok ? capsuleImageUrl : undefined;

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
    };

    // Cache the appIDCache for the normalized name to skip appIDByName calls since normalized names are === page's game name
    const normalizedAppName = normalizeString(name);
    if (normalizedAppName) {
      appIDCache.set(normalizedAppName, [id] as number[]);
      setTimeout(() => appIDCache.delete(normalizedAppName), ID_REVALIDATION_TIME);
    }

    appDataCache.set(`app-${id}`, newEntry);
    setTimeout(() => appDataCache.delete(`app-${id}`), DATA_REVALIDATION_TIME);
    return newEntry;
  } catch (error) {
    console.log(`STEAM: Error retrieving app data for app ID: ${appid}`);
    throw error;
  }
}

async function getMultipleAppData(appids: number[]) {
  // Fetch app data for each app ID
  const appDatas = await Promise.all(
    appids.map(async (appid) => {
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
    const matchingApps = await getAppIDByName(baseUrl, identifier);
    if (!matchingApps.length) throw new Error('CACHED - No matching app(s) found, status code: 404');
    const appData = (
      await Promise.all(matchingApps.map((appid: number) => getAppData(appid).catch(() => null)))
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

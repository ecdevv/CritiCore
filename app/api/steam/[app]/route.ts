import { getAppIndex } from "@/app/utility/api";
import { setCache, setCacheEmpty } from "@/app/utility/cache";
import { formatDate } from "@/app/utility/dates";
import { normalizeString } from "@/app/utility/strings";

const MAX_ID_CACHE_SIZE = 50 * 1024 * 1024;       // 50MB
const ID_REVALIDATION_TIME = 1 * 10 * 60 * 1000;  // 10 minutes
const appIDCache = new Map();

async function searchAppIndex(appIndex: { [key: string]: number }, cacheKey: string) {
  if (appIDCache.has(cacheKey)) return appIDCache.get(cacheKey);

  try {
    // Cache empty entry for 5 minutes before fetching (checks if the cache is full)
    setCacheEmpty(cacheKey, null, appIDCache, 300 * 1000, MAX_ID_CACHE_SIZE);

    // Find the appid based on the game name from the appIndex.
    const appid = appIndex[cacheKey] || null;
    setCache(cacheKey, appid, appIDCache, ID_REVALIDATION_TIME, MAX_ID_CACHE_SIZE);
    return appid;
  } catch {
    return null;
  }
};

async function getAppIDByName(name: string) {
  const cacheKey = normalizeString(name);
  if (appIDCache.has(cacheKey)) return appIDCache.get(cacheKey);

  console.log(`STEAM: Fetching app id for game name: ${cacheKey}`);
  const appIndex = await getAppIndex();
  const appid = await searchAppIndex(appIndex, cacheKey);
  if (!appid) return null;
  return appid;
}

const MAX_DATA_CACHE_SIZE = 150 * 1024 * 1024;      // 150MB
const DATA_REVALIDATION_TIME = 1 * 5 * 60 * 1000;   // 5 minutes
const appDataCache = new Map();

async function getAppData(appid: number) {
  const cacheKey = `app-${appid}`;
  if (appDataCache.has(cacheKey)) return appDataCache.get(cacheKey);

  console.log("STEAM: Fetching app data for app id: " + appid);
  
  // Cache empty entry for 5 minutes before fetching (checks if the cache is full)
  setCacheEmpty(cacheKey, {}, appDataCache, DATA_REVALIDATION_TIME, MAX_DATA_CACHE_SIZE);

  // Fetching game data based on the app ID
  const allResponses = await Promise.all([
    fetch(`${process.env.STEAM_API_APPDETAILS}?${new URLSearchParams({ appids: appid.toString(), filters: 'basic,developers,publishers,release_date' })}`),
    fetch(`${process.env.STEAM_API_APPREVIEWS}/${appid}?${new URLSearchParams({ json: '1', language: 'all', purchase_type: 'all' })}`),
    fetch(`${process.env.STEAM_API_NUM_PLAYERS}?${new URLSearchParams({ appid: appid.toString(), format: 'json' })}`),
  ]);
  if (!allResponses.every(response => response.ok)) {
    const failedResponse = allResponses.find(response => !response.ok);
    console.log(`STEAM: Failed to fetch app data, status code: ${failedResponse?.status}`);
    return null;
  }
  const [detailsResponse, reviewsResponse, playersResponse] = allResponses;
  const [detailsData, reviewsData, playersData] = await Promise.all([
    detailsResponse.json(),
    reviewsResponse.json(),
    playersResponse.json()
  ]);
  if (!detailsData || !detailsData[appid] || detailsData[appid].success !== true) {
    console.log('STEAM: Invalid details data, status code: 404');
    return null;
  }
  if (detailsData[appid].data.type !== 'game') {
    console.log('STEAM: Details data is not a game, status code: 404');
    return null;
  }
  if (!reviewsData || reviewsData.success !== 1) {
    console.log('STEAM: Invalid reviews data, status code: 404');  // Check for validity using its success property since its response/data is always returning ok
    return null;
  }

  // Extract data from the responses
  const id = detailsData[appid]?.data?.steam_appid;
  const name = detailsData[appid]?.data?.name;
  const date = detailsData[appid]?.data?.release_date?.date;
  const releaseDate = date ? formatDate(date) : undefined;
  const developer = detailsData[appid]?.data?.developers[0];
  const publisher = detailsData[appid]?.data?.publishers[0];
  const ageRating = detailsData[appid]?.data?.required_age;
  const drm = detailsData[appid]?.data?.drm_notice;
  const url = `${process.env.STEAM_STORE_URL}/${appid}`;
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

  // Update entry and return this entry
  const newEntry = {
    id,
    name,
    releaseDate,
    developer,
    publisher,
    ageRating,
    drm,
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

  const normalizedAppName = normalizeString(name);
  setCache(normalizedAppName, id, appIDCache, ID_REVALIDATION_TIME, MAX_ID_CACHE_SIZE);
  setCache(`app-${id}`, newEntry, appDataCache, DATA_REVALIDATION_TIME, MAX_DATA_CACHE_SIZE);
  return newEntry;
}

async function getAppDatasByName(names: string[]) {
  const appIndex = await getAppIndex();  // Get the cached app Index
  const appDatas = await Promise.all(
    names.map(async (name) => {
      try {
        // Check cache first for the app id and return the data for it if found
        const appid = await searchAppIndex(appIndex, normalizeString(name));
        if (!appid) return null;
        const appData = await getAppData(appid);
        if (!appData || !appData.id) return null;
        return appData;
      } catch {
        return null;
      }
    })
  ).then(results => results.filter(data => data !== null));
  
  return appDatas;
}

async function getAppDatas(appids: number[]) {
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
  const identifier = url.pathname.split('/').pop() as string || '';
  
  try {
    const identifiers = identifier.split(',').map(id => id.trim());
    if (!identifiers.length) throw new Error('Invalid game name or app ID(s) provided, status code: 400');

    // Check if the game name is a single string id and fetch based on the app ID
    if (!isNaN(Number(identifiers[0])) && identifiers.length === 1) {
      const appData = await getAppData(Number(identifiers[0]));
      if (!appData || !appData.id) {
        console.log(`STEAM: No app data found for game name: ${identifier}, status code: 404`);
        return Response.json({ status: 404, error: `No app data found for game name: ${identifier}, status code: 404` });
      }
      return Response.json({ status: 200, appData });
    }

    // Check if the game name is a multiple string ids and fetch based on the app IDs
    if (!isNaN(Number(identifiers[0])) && identifiers.length > 1) {
      const appDatas = await getAppDatas(identifiers.map(Number));
      if (!appDatas.length) {
        console.log(`STEAM: No app datas found for game ids: ${identifiers}, status code: 404`);
        return Response.json({ status: 404, error: `No app datas found for game ids: ${identifiers}, status code: 404` });
      }
      return Response.json({ status: 200, appDatas });
    }

    // Check if the game name is a multiple strings and fetch based on the normalized name
    if (identifiers.length > 1) {
      const appDatas = await getAppDatasByName(identifiers);
      if (!appDatas.length) {
        console.log(`STEAM: No app datas found for games: ${identifiers}, status code: 404`);
        return Response.json({ status: 404, error: `No app datas found for games: ${identifiers}, status code: 404` });
      }
      return Response.json({ status: 200, appDatas });
    }
    
    // Fetch based on the normalized name by getting ids from appIDByName then fetching app data with ids
    const appid = await getAppIDByName(identifier);
    if (!appid) {
      console.log(`STEAM: No app id found for game name: ${identifier}, status code: 404`);
      return Response.json({ status: 404, error: `No app id found for game name: ${identifier}, status code: 404` });
    }
    const appData = await getAppData(appid);
    if (!appData || !appData.id) {
      console.log(`STEAM: No app data found for game name: ${identifier}, status code: 404`); 
      return Response.json({ status: 404, error: `No app data found for game name: ${identifier}, status code: 404` });
    }
    
    return Response.json({ status: 200, ...appData });
  } catch (error) {
    console.log('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}
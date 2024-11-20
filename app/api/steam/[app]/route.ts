import * as cheerio from 'cheerio';
import { redis }from "@/app/utility/redis";
import { getSteamIndex } from "@/app/utility/api";
import { formatDate } from "@/app/utility/dates";
import { normalizeString } from "@/app/utility/strings";

const ID_EXPIRY = 7 * 24 * 60 * 60;   // 7 days
const DATA_EXPIRY = 2 * 60 * 60;      // 2 hours
const DYNAMIC_EXPIRY = 1 * 5 * 60;    // 5 minutes

async function getSteamDatasByName(names: string[]) {
  const appIndex = await getSteamIndex();  // Get the cached app Index
  const appDatas = await Promise.all(
    names.map(async (name) => {
      try {
        // Check cache first for the app id and return the data for it if found
        const appid = await searchAppIndex(appIndex, normalizeString(name));
        if (!appid) return null;
        const appData = await getSteamData(Number(appid));
        if (!appData || !appData.id) return null;
        return { ...appData };
      } catch {
        return null;
      }
    })
  ).then(results => results.filter(data => data !== null));
  
  return appDatas;
}

async function getAppIDByName(name: string) {
  const normalizedName = normalizeString(name);
  const cacheKey = `steam:${normalizedName}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData === "") return null;
  if (cachedData) return cachedData;

  console.log(`STEAM: Fetching app id for game name: ${normalizedName}`);
  const appIndex = await getSteamIndex();
  const appid = await searchAppIndex(appIndex, normalizedName);
  if (!appid) return null;
  return appid;
}

async function searchAppIndex(appIndex: { [key: string]: number }, normalizedName: string) {
  const cacheKey = `steam:${normalizedName}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData === "") return null;
  if (cachedData) return cachedData;

  try {
    // Find the appid based on the game name from the appIndex.
    const appid = appIndex[normalizedName] || null;
    if (!appid) {
      await redis.set(cacheKey, "", 'EX', DATA_EXPIRY);
      return null;
    }
    await redis.set(cacheKey, appid, 'EX', ID_EXPIRY);
    return appid;
  } catch {
    return null;
  }
};

async function getSteamDatas(appids: number[]) {
  // Fetch app data for each app ID
  const appDatas = await Promise.all(
    appids.map(async (appid) => {
      try {
        const appData = await getSteamData(Number(appid));
        if (!appData || !appData.id) return null;
        return { ...appData };
      } catch {
        return null;
      }
    })
  ).then(results => results.filter(data => data !== null));

  // Remove duplicates based on the ID
  const uniqueAppDatas = Array.from(new Map(appDatas.map(app => [app.id, app])).values());

  return uniqueAppDatas;
}

async function getSteamData(appid: number) {
  const cacheKey = `steam:${appid}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData === "") return null;
  if (cachedData) return JSON.parse(cachedData);

  console.log("STEAM: Fetching app data for app id: " + appid);

  // Fetching game data based on the app ID
  const allResponses = await Promise.all([
    fetch(`${process.env.STEAM_API_APPDETAILS}?${new URLSearchParams({ appids: appid.toString(), filters: 'basic,developers,publishers,release_date' })}`),
    fetch(`${process.env.STEAM_API_APPREVIEWS}/${appid}?${new URLSearchParams({ json: '1', language: 'all', purchase_type: 'all' })}`),
  ]);
  if (!allResponses.every(response => response.ok)) {
    console.log(`STEAM: Failed respopnse, attempting to fetch game data via fallback...`);
    const storeData = await getDataByStore(appid);
    if (storeData) return storeData;
    const failedResponse = allResponses.find(response => !response.ok);
    console.log(`STEAM: Failed to fetch app data, status code: ${failedResponse?.status}`);
    await redis.set(cacheKey, "", 'EX', 60);  // 1 minute for failed responses
    return null;
  }
  const [detailsResponse, reviewsResponse] = allResponses;
  const [detailsData, reviewsData] = await Promise.all([
    detailsResponse.json(),
    reviewsResponse.json()
  ]);
  if (!detailsData || !detailsData[appid] || detailsData[appid].success !== true) {
    console.log(`STEAM: No details data, attempting to fetch game data via fallback...`);
    const storeData = await getDataByStore(appid);   // Game may exist without critic data, but it won't be included in the appIndex so we search the store page instead;
    if (storeData) return storeData;
    console.log('STEAM: Invalid details data, status code: 404');
    await redis.set(cacheKey, "", 'EX', 60);        // 1 minute for failed responses (details data is always returning ok and we should be looking up good ids now through search page)
    return null;
  }
  if (detailsData[appid].data.type !== 'game') {
    console.log('STEAM: Details data is not a game, status code: 404');
    await redis.set(cacheKey, "", 'EX', DATA_EXPIRY);
    return null;
  }
  if (!reviewsData || reviewsData.success !== 1) {
    console.log('STEAM: Invalid reviews data, status code: 404');  // Check for validity using its success property since its response/data is always returning ok
    await redis.set(cacheKey, "", 'EX', DATA_EXPIRY);
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
  const url = `${process.env.STEAM_STORE_APP}/${appid}`;
  const devUrl = detailsData[appid]?.data?.website;
  const headerImage = detailsData[appid]?.data?.header_image;

  // Calculate critic and user scores
  const { query_summary: { total_positive: totalPositive, total_negative: totalNegative, total_reviews: totalReviews, review_score_desc: reviewDesc } } = reviewsData;
  const criticScore = -1;
  const userScore = Math.floor((totalPositive / totalReviews) * 100);

  // Fetch capsule image to ensure it exists, otherwise return undefined capsuleImage
  const capsuleImageUrl = process.env.STEAM_CDN_CAPSULE + '/' + id + '/' + 'library_600x900_2x.jpg';
  const capsuleImageResponse = await fetch(capsuleImageUrl, { method: 'HEAD' });
  const capsuleImage = capsuleImageResponse.ok ? capsuleImageUrl : undefined;

  // Update entry and return this entry
  const newEntry = { id, name, releaseDate, developer, publisher, ageRating, drm, 
    criticScore, userScore, totalPositive, totalNegative, totalReviews, reviewDesc, 
    url, devUrl, headerImage, capsuleImage
  };

  const normalizedAppName = normalizeString(name);
  await redis.set(`steam:${normalizedAppName}`, id, 'EX', ID_EXPIRY);
  await redis.set(`steam:${id}`, JSON.stringify(newEntry), 'EX', DATA_EXPIRY);
  return newEntry;
}

async function getSteamDynamicData(appid: number) {
  const cacheKey = `steam:${appid}:dynamic`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData) return JSON.parse(cachedData);

  const response = await fetch(`${process.env.STEAM_API_NUM_PLAYERS}?${new URLSearchParams({ appid: appid.toString(), format: 'json' })}`)
  if (!response.ok) return null;
  const data = await response.json();
  if (!data || data.response.result !== 1) return null;
  const currentPlayers = data.response.player_count;
  const newEntry = { currentPlayers };
  await redis.set(cacheKey, JSON.stringify(newEntry), 'EX', DYNAMIC_EXPIRY);
  return newEntry;
}

async function getDataByStore(appid: number) {
  const url = `${process.env.STEAM_STORE_APP}/${appid}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const html = await response.text();
  const $ = cheerio.load(html);

  const name = $('#appHubAppName').text().trim() || "";
  const date = $('.release_date .date').text().trim() || "";
  let developer = null;
  let publisher = null;

  $('.dev_row').each((_, element) => {
    const subtitle = $(element).find('.subtitle.column').text().trim();
    const summary = $(element).find('.summary.column a').text().trim();

    if (subtitle === 'Developer:') {
      developer = summary;
    } else if (subtitle === 'Publisher:') {
      publisher = summary;
    }
  });

  const newEntry = { id: appid, name, releaseDate: formatDate(date), developer, publisher };
  redis.set(`steam:${appid}`, JSON.stringify(newEntry), 'EX', DATA_EXPIRY);
  return newEntry;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const identifier = url.pathname.split('/').pop() as string || '';

  try {
    const identifiers = identifier.split(',').map(id => id.trim());
    if (!identifiers.length) throw new Error('Invalid game name or app ID(s) provided, status code: 400');

    const isSingleNumberId = !isNaN(Number(identifiers[0])) && identifiers.length === 1;
    const isMultipleNumberIds = !isNaN(Number(identifiers[0])) && identifiers.length > 1;
    const isMultipleNames = identifiers.length > 1;

    // If the identifier is a number, directly fetch the app data
    if (isSingleNumberId) {
      const [appData, dynamicData] = await Promise.all([
        getSteamData(Number(identifiers[0])),
        getSteamDynamicData(Number(identifiers[0]))
      ]);
      const newEntry = { ...appData, ...dynamicData };
      if (appData && appData.id) return Response.json({ status: 200, appData: newEntry });
      console.log(`STEAM: No app data found for game name: ${identifier}, status code: 404`);
      return Response.json({ status: 404, error: `No app data found for game name: ${identifier}, status code: 404` });
    }

    // If the identifiers are numbers, directly fetch the app datas
    if (isMultipleNumberIds) {
      const appDatas = await getSteamDatas(identifiers.map(Number));
      if (appDatas.length) return Response.json({ status: 200, appDatas });
      console.log(`STEAM: No app datas found for game ids: ${identifiers}, status code: 404`);
      return Response.json({ status: 404, error: `No app datas found for game ids: ${identifiers}, status code: 404` });
    }

    // If the identifiers are names, get ids by name, then fetch the app data
    if (isMultipleNames) {
      const appDatas = await getSteamDatasByName(identifiers);
      if (appDatas.length) return Response.json({ status: 200, appDatas });
      console.log(`STEAM: No app datas found for games: ${identifiers}, status code: 404`);
      return Response.json({ status: 404, error: `No app datas found for games: ${identifiers}, status code: 404` });
    }

    // If the identifier is a name, get the app id by name, then fetch the app data
    const appid = await getAppIDByName(identifier);
    if (!appid) {
      console.log(`STEAM: No app id found for game name: ${identifier}, status code: 404`);
      return Response.json({ status: 404, error: `No app id found for game name: ${identifier}, status code: 404` });
    }
    const [appData, dynamicData] = await Promise.all([
      getSteamData(Number(appid)),
      getSteamDynamicData(Number(appid))
    ])
    if (!appData || !appData.id) {
      console.log(`STEAM: No app data found for game name: ${identifier}, status code: 404`);
      return Response.json({ status: 404, error: `No app data found for game name: ${identifier}, status code: 404` });
    }
    if (appData && appData.id ) return Response.json({ status: 200, ...appData, ...dynamicData });

    console.log(`STEAM: App id found for game name: ${identifier}, but no app data found, status code: 404`);
    return Response.json({ status: 200, id: appid });
  } catch (error) {
    console.log('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}
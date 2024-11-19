import { setCache, setCacheEmpty } from '@/app/utility/cache';
import { normalizeString } from '@/app/utility/strings';

const MAX_ID_CACHE_SIZE = 50 * 1024 * 1024;       // 50MB
const ID_REVALIDATION_TIME = 24 * 60 * 60 * 1000;  // 24 hours
const appIDCache = new Map();

const mockData = { id: undefined, name: undefined, releaseDate: undefined, developer: undefined, publisher: undefined,
  hasLootBoxes: true, percentRec: 91, criticScore: 88, userScore: -1, totalCriticReviews: 84, totalUserReviews: -1, totalTopCriticReviews: -1,
  tier: { name: 'Mighty', url: 'https://' + process.env.OPENCRITIC_IMG_HOST + '/mighty-man/' + 'mighty' + '-man.png'}, url: 'https://opencritic.com/', capsuleImage: undefined
};

async function getAppIDByName(name: string) {
  const cacheKey = normalizeString(name);
  if (appIDCache.has(cacheKey)) return appIDCache.get(cacheKey);

  console.log("OC: Fetching app id for game name: " + cacheKey);
  // Cache empty entry for 24 hours before fetching (checks if the cache is full)
  setCacheEmpty(cacheKey, null, appIDCache, ID_REVALIDATION_TIME, MAX_ID_CACHE_SIZE);

  // Fetching search data for app ID(s) based on the game name from params in url
  const url = `${process.env.OPENCRITIC_API_SEARCH}?${new URLSearchParams({ criteria: cacheKey })}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': process.env.OPENCRITIC_API_KEY || '',
      'x-rapidapi-host': process.env.OPENCRITIC_API_HOST || ''
    }
  };
  const response = await fetch(url, { ...options, cache: 'force-cache' });
  if (!response.ok) {
    console.log(`OC: Failed to fetch search data, status code: ${response.status}`);
    return null;
  }
  const data = await response.json();
  if (!data) {
    console.log('OC: Invalid search data, status code: 404');
    return null;
  }

  // Find the app with the shortest distance value that is below 0.03 for the most accurate return
  const apps = data as Array<{ id: number; name: string; dist: number }>;
  const appid = apps.find(app => normalizeString(app.name) === cacheKey)?.id || undefined;
  if (!appid) {
    console.log('OC: Invalid App ID, status code: 404');
    return null;
  }

  // Update cache entry and return this entry
  setCache(cacheKey, appid, appIDCache, ID_REVALIDATION_TIME, MAX_ID_CACHE_SIZE);
  return appid;
}

const MAX_DATA_CACHE_SIZE = 150 * 1024 * 1024;       // 150MB
const DATA_REVALIDATION_TIME = 24 * 10 * 60 * 1000;  // 24 hours
const appDataCache = new Map();

async function getAppData(appid: number) {
  const cacheKey = `app-${appid}`;
  if (appDataCache.has(cacheKey)) return appDataCache.get(cacheKey);

  console.log("OC: Fetching game data for app id: " + appid);
  // Cache empty entry for 24 hours before fetching (checks if the cache is full)
  setCache(cacheKey, {}, appDataCache, DATA_REVALIDATION_TIME, MAX_DATA_CACHE_SIZE);

  // Fetching game data for app ID(s)
  const url = `${process.env.OPENCRITIC_API_GAME}/${appid}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': process.env.OPENCRITIC_API_KEY || '',
      'x-rapidapi-host': process.env.OPENCRITIC_API_HOST || ''
    }
  };
  const response = await fetch(url, { ...options, cache: 'force-cache' });
  if (!response.ok) {
    console.log(`OC: Failed to fetch game data, status code: ${response.status}`);
    return null;
  }
  const data = await response.json();
  if (!data) {
    console.log('OC: Invalid game data, status code: 404');
    return null;
  }

  // Extract data from the response
  const id = data.id;
  const name = data.name;
  const date = new Date(data.firstReleaseDate);
  const releaseDate = `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
  const developer = data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'developer')?.name || data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'publisher')?.name;
  const publisher = data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'publisher')?.name || data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'developer')?.name;
  const hasLootBoxes = data.hasLootBoxes;
  const percentRec = Math.round(data.percentRecommended);
  const criticScore = Math.round(data.topCriticScore);
  const userScore = -1;
  const totalCriticReviews = data.numReviews;
  const totalUserReviews = -1;
  const totalTopCriticReviews = data.numTopCriticReviews;
  const tier = { name: data.tier, url: 'https://' + process.env.OPENCRITIC_IMG_HOST + '/mighty-man/' + data.tier.toLowerCase() + '-man.png' };
  const ocUrl = data.url;

  // Fetch capsule image to ensure it exists, otherwise return undefined capsuleImage
  const boxImageExists = !!data.images?.box?.og;
  const capsuleImageUrl = boxImageExists ? 'https://' + process.env.OPENCRITIC_IMG_HOST + '/' + data.images.box.og : undefined; // Box image
  const capsuleImageResponse = capsuleImageUrl ? await fetch(capsuleImageUrl, { method: 'HEAD' }) : undefined;
  const capsuleImage = capsuleImageResponse?.ok ? capsuleImageUrl : undefined;
  
  // Update cache entry and return this entry
  const newEntry = {
    id,
    name,
    releaseDate,
    developer,
    publisher,
    hasLootBoxes,
    percentRec,
    criticScore,
    userScore,
    totalCriticReviews,
    totalUserReviews,
    totalTopCriticReviews,
    tier,
    url: ocUrl,
    capsuleImage,
  };

  

  // Cache the appIDCache for the normalized name to skip appIDByName calls since normalized names are === page's game name
  const normalizedAppName = normalizeString(name);
  setCache(normalizedAppName, id, appIDCache, ID_REVALIDATION_TIME, MAX_ID_CACHE_SIZE);
  setCache(`app-${id}`, newEntry, appDataCache, DATA_REVALIDATION_TIME, MAX_DATA_CACHE_SIZE);

  console.log(`OC: Fetched game data for game: ${normalizedAppName}`);
  return newEntry;
}

// API Calls are limited to 25 searches per day and 200 requests per day
export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const identifier = pathname.split('/').pop() as string || '';

  try {
    // If the identifier is a number, skip the search for app ID
    // const appid = isNaN(Number(identifier)) ? (await getAppIDByName(identifier)) : Number(identifier);
    // if (!appid) {
    //   console.log(`OC: No app ID found for game name: ${identifier}, status code: 404`);
    //   return Response.json({ status: 404, error: `No app ID found for game name: ${identifier}, status code: 404'` });
    // }
    // const data = await getAppData(appid as number);
    const data = mockData;

    return Response.json({ status: 200, ...data });
  } catch (error) {
    console.error('OC:', error);
    return Response.json({ error: 'OPENCRITIC: Internal Server Error' }, { status: 500 });
  }
}

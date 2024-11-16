import { normalizeString } from '@/app/utility/helper';
import generateBlurDataURL from '@/app/utility/generateBlurDataURL';

interface AppCacheEntry {
  appid: number | undefined;
  expires: number;
}

interface AppDataCacheEntry {
  id: number | undefined;
  name: string | undefined;
  releaseDate: string | undefined;
  developer: string | undefined;
  publisher: string | undefined;
  hasLootBoxes: boolean | undefined;
  percentRec: number | undefined;
  criticScore: number | undefined;
  userScore: number | undefined;
  totalCriticReviews: number | undefined;
  totalUserReviews: number | undefined;
  totalTopCriticReviews: number | undefined;
  tier: { name: string | undefined; url: string | undefined } | undefined;
  url: string | undefined;
  capsuleImage: { og: string | undefined; blur: string | undefined } | undefined;
  expires: number;
}

const MAX_APPID_CACHE_SIZE = 1000;
const MAX_APPDATA_CACHE_SIZE = 200;
const appIDCache = new Map<string, AppCacheEntry>();
const appDataCache = new Map<string, AppDataCacheEntry>();

const emptyDataCacheEntry: AppDataCacheEntry = {
  id: undefined, name: undefined, releaseDate: undefined, developer: undefined, publisher: undefined, hasLootBoxes: undefined,
  percentRec: undefined, criticScore: undefined, userScore: undefined, totalCriticReviews: undefined, totalUserReviews: undefined,
  totalTopCriticReviews: undefined, tier: undefined, url: undefined, capsuleImage: undefined, expires: 0
}

async function getAppIDByName(name: string): Promise<AppCacheEntry> {
  const cacheKey = normalizeString(name);
  const now = Date.now() / 1000;
  const cachedEntry = appIDCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Cache empty entry for 24 hours before fetching search data
    if (appIDCache.size >= MAX_APPID_CACHE_SIZE) {
      const oldestEntry = Array.from(appIDCache).sort((a, b) => a[1].expires - b[1].expires)[0];
      appIDCache.delete(oldestEntry[0]);
    }
    appIDCache.set(cacheKey, { appid: undefined, expires: now + 86400 });

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
    if (!response.ok) throw new Error(`Failed to fetch search data, status code: ${response.status}`);
    const data = await response.json();
    if (!data) throw new Error('Invalid search data, status code: 404');

    // Find the app with the shortest distance value that is below 0.03 for the most accurate return
    const apps = data as Array<{ id: number; name: string; dist: number }>;
    const appid = apps.find(app => normalizeString(app.name) === cacheKey)?.id || undefined;
    if (!appid) throw new Error('Invalid App ID, status code: 404');

    // Update cache entry and return this entry
    const newEntry = { 
      appid, 
      expires: now + 86400  // Cache for one day
    };

    appIDCache.set(cacheKey, newEntry);
    return newEntry;
  } catch (error) {
    console.log(`OPENCRITIC: Error retrieving app id for game name: ${cacheKey}`);
    throw error;
  }
}

async function getAppData(appid: number): Promise<AppDataCacheEntry> {
  const cacheKey = `app-${appid}`;
  const now = Date.now() / 1000;
  const cachedEntry = appDataCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Cache empty entry for 24 hours before fetching game data
    if (appDataCache.size >= MAX_APPDATA_CACHE_SIZE) {
      const oldestEntry = Array.from(appDataCache).sort((a, b) => a[1].expires - b[1].expires)[0];
      appDataCache.delete(oldestEntry[0]);
    }
    appDataCache.set(cacheKey, { ...emptyDataCacheEntry, expires: now + 86400 });

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
    if (!response.ok) throw new Error(`Failed to fetch game data, status code: ${response.status}`);
    const data = await response.json();
    if (!data) throw new Error('Invalid game data, status code: 404');

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
    const capsuleImgTestUrl = boxImageExists ? 'https://' + process.env.OPENCRITIC_IMG_HOST + '/' + data.images.box.og : undefined; // Box image
    const capsuleImgResponse = capsuleImgTestUrl ? await fetch(capsuleImgTestUrl) : undefined;
    const capsuleImgBuffer = capsuleImgResponse?.ok ? await capsuleImgResponse.arrayBuffer() : undefined;
    const capsuleImgBlur = capsuleImgBuffer ? await generateBlurDataURL(capsuleImgBuffer) : undefined;
    const capsuleImgUrl = capsuleImgResponse?.ok ? capsuleImgTestUrl : undefined;
    const capsuleImage = capsuleImgUrl ? { og: capsuleImgUrl, blur: capsuleImgBlur } : undefined;
    
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
      expires: now + 86400 // Cache for one day
    };

    // Cache the appIDCache for the normalized name to skip appIDByName calls since normalized names are === page's game name
    const normalizedAppName = normalizeString(name);
    if (normalizedAppName) {
      appIDCache.set(normalizedAppName, { appid: id, expires: now + 86400 });
    }

    appDataCache.set(`app-${id}`, newEntry);
    return newEntry;
  } catch (error) {
    console.log(`OPENCRITIC: Error retrieving app data for app ID: ${appid}`);
    throw error;
  }
}

// API Calls are limited to 25 searches per day and 200 requests per day
export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const identifier = pathname.split('/').pop() as string || '';

  try {
    // If the identifier is a number, skip the search for app ID
    const appid = isNaN(Number(identifier)) ? (await getAppIDByName(identifier)).appid : Number(identifier);
    if (appid === -1) throw new Error('CACHED - Invalid App ID, status code: 404');
    const data = await getAppData(appid as number);

    return Response.json({ status: 200, ...data });
  } catch (error) {
    console.error('OPENCRITIC:', error);
    return Response.json({ error: 'OPENCRITIC: Internal Server Error' }, { status: 500 });
  }
}

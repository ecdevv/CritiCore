import { normalizeString } from '@/app/utility/helper';

interface AppCacheEntry {
  appId: number;
  expires: number;
}

interface AppDataCacheEntry {
  id: number;
  name: string;
  releaseDate: string;
  developer: string;
  publisher: string;
  image: string;
  criticScore: number;
  userScore: number;
  totalCriticReviews: number;
  totalUserReviews: number;
  url: string;
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
    // Fetch search data for app ID based on the game name from params in url
    const encodedName = encodeURIComponent(name);
    const url = `${process.env.OPENCRITIC_API_SEARCH}?${new URLSearchParams({ criteria: encodedName })}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.OPENCRITIC_API_KEY || '',
        'x-rapidapi-host': process.env.OPENCRITIC_API_HOST || ''
      }
    };
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`OPENCRITIC: Failed to fetch search data, status code: ${response.status}`);
    }
    const data = await response.json();
    if (!data) throw new Error('OPENCRITIC: Invalid search data, status code: 404');

    // Find the app with the shortest distance value that is below 0.1 for the most accurate return
    const apps = data as Array<{ id: number; name: string; dist: number }>;
    const { id: appId } = apps.reduce(
      (min, current) => (current.dist < min.dist && current.dist < 0.1 ? current : min),
      { id: -1, dist: Infinity }
    );
    if (appId === -1) throw new Error('OPENCRITIC: Invalid App ID, status code: 404');

    const newEntry = { 
      appId, 
      expires: now + 86400  // Cache for one day
    };

    appCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    console.error(error);
    const newEntry = { appId: -1, expires: now + 86400 };
    appCache[cacheKey] = newEntry;
    throw new Error('OPENCRITIC: Could not retrieve search data');
  }
}

async function getAppData(appId: number): Promise<AppDataCacheEntry> {
  const cacheKey = `app-${appId}`;
  const now = Date.now() / 1000;
  const cachedEntry = appDataCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Fetch game data based on the app ID
    const url = `${process.env.OPENCRITIC_API_GAME}/${appId}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.OPENCRITIC_API_KEY || '',
        'x-rapidapi-host': process.env.OPENCRITIC_API_HOST || ''
      }
    };
    const response = await fetch(url, { ...options, cache: 'force-cache' });
    if (!response.ok) throw new Error(`OPENCRITIC: Failed to fetch game data, status code: ${response.status}`);
    const data = await response.json();
    if (!data) throw new Error('OPENCRITIC: Invalid game data, status code: 404');

    // Extract data from the response
    const name = data.name;
    const date = new Date(data.firstReleaseDate);
    const releaseDate = `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
    const developer = data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'developer')?.name || data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'publisher')?.name;
    const publisher = data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'publisher')?.name || data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'developer')?.name;
    const image = process.env.OPENCRITIC_API_HOST + '/' + data.images.square.og; // TODO: Check if this is correct
    const criticScore = Math.round(data.topCriticScore);
    const userScore = -1; // TODO: Check if this is correct
    const totalCriticReviews = data.numReviews;
    const totalUserReviews = -1; // TODO: Check if this is correct
    const ocUrl = data.url;
    
    const newEntry = {
      id: appId,
      name,
      releaseDate,
      developer,
      publisher,
      image,
      criticScore,
      userScore,
      totalCriticReviews,
      totalUserReviews,
      url: ocUrl,
      expires: now + 86400 // Cache for one day
    };

    appDataCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    console.error(`OPENCRITIC: Error retrieving app data for app ID: ${appId}, Error:`, error);
    throw new Error('OPENCRITIC: Could not retrieve app data');
  }
}

// API Calls are limited to 25 searches per day and 200 requests per day
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get('gameName') || '';

  try {
    // Fetch the app ID from the game name and then fetch the app data. If the app ID is invalid and is in the cache, throw an error.
    const { appId } = (await getAppIDByName(gameName));
    if (appId === -1) throw new Error('OPENCRITIC: CACHED - Invalid App ID, status code: 404');
    const data = await getAppData(appId);

    return Response.json({ status: 200, ...data });
  } catch (error) {
    console.error('OPENCRITIC: Unexpected error fetching app data:', error);
    return Response.json({ error: 'OPENCRITIC: Internal Server Error' }, { status: 500 });
  }
}
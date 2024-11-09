import { normalizeString } from '@/app/utility/helper';

interface AppCacheEntry {
  appId: number;
  expires: number;
}

const appCache: Record<string, AppCacheEntry> = {};

async function getAppIDByName(name: string): Promise<AppCacheEntry> {
  const cacheKey = normalizeString(name);
  const now = Date.now() / 1000;
  const cachedEntry = appCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) {
    return cachedEntry;
  }

  try {
    // Fetch app ID based on the game name from params in url
    const encodedName = encodeURIComponent(name);
    const url = `https://opencritic-api.p.rapidapi.com/game/search?criteria=${encodedName}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.OPENCRITIC_API_KEY || '',
        'x-rapidapi-host': 'opencritic-api.p.rapidapi.com'
      }
    };
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data, status code: ${response.status}`);
    }

    const data = await response.json();

    // Find the app with the shortest distance value for the most accurate return
    const apps = data as Array<{ id: number; name: string; dist: number }>;
    const { id: appId } = apps.reduce(
      (min, current) => (current.dist < min.dist ? current : min),
      { id: -1, dist: Infinity }
    );

    const newEntry = {
      appId,
      expires: appId !== -1 ? now + 600 : now,
    };

    appCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    console.error('Error fetching app ID:', error);
    throw new Error('Could not retrieve app ID');
  }
}

// API Calls are limited to 25 searches per day and 200 requests per day
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get('gameName') || '';

  try {
    const appId = (await getAppIDByName(gameName)).appId;

    if (appId === -1) {
      return Response.json({ error: 'Game not found' }, { status: 404 });
    }

    // Fetch game data based on the app ID
    const url = `https://opencritic-api.p.rapidapi.com/game/${appId}`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.OPENCRITIC_API_KEY || '',
        'x-rapidapi-host': 'opencritic-api.p.rapidapi.com'
      }
    };
    const response = await fetch(url, { ...options, cache: 'force-cache' });

    if (!response.ok) {
      throw new Error(`Failed to fetch game data, status code: ${response.status}`);
    }

    const data = await response.json();

    // The data that we're sending back
    const name = data.name;
    const date = new Date(data.firstReleaseDate);
    const releaseDate = `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;
    const developer = data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'developer')?.name || data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'publisher')?.name || '';
    const publisher = data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'publisher')?.name || data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'developer')?.name || '';
    const image = 'https://opencritic-api.p.rapidapi.com/' + data.images.square.og; // TODO: Check if this is correct
    const criticScore = data.topCriticScore;
    const userScore = data.userScore; // TODO: Check if this is correct
    const totalCriticReviews = data.numReviews;
    const totalUserReviews = data.numUserReviews; // TODO: Check if this is correct
    const ocUrl = data.url;
    
    return Response.json({ status: 200, name, releaseDate, developer, publisher, image, criticScore, userScore, totalCriticReviews, totalUserReviews, ocUrl });
  } catch (error) {
    console.error('Error fetching game data:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

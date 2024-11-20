import * as cheerio from 'cheerio';
import { redis } from '@/app/utility/redis';
import { normalizeString } from '@/app/utility/strings';

const ID_EXPIRY = 7 * 24 * 60 * 60;  // 7 days
const DATA_EXPIRY = 2 * 60 * 60;     // 2 hours

// const mockData = { id: undefined, name: undefined, releaseDate: undefined, developer: undefined, publisher: undefined,
//   hasLootBoxes: true, percentRec: 91, criticScore: 88, userScore: -1, totalCriticReviews: 84, totalUserReviews: -1, totalTopCriticReviews: -1,
//   tier: { name: 'Mighty', url: 'https://' + process.env.OPENCRITIC_IMG_HOST + '/mighty-man/' + 'mighty' + '-man.png'}, url: 'https://opencritic.com/', capsuleImage: undefined
// };

async function getAppIDByName(name: string) {
  const normalizedName = normalizeString(name);
  const cacheKey = `oc:${normalizeString(name)}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData === "") return null;
  if (cachedData) return cachedData;

  console.log("OC: Fetching app id for game name: " + normalizedName);

  // Fetching search data for app ID(s) based on the game name from params in url
  const url = `${process.env.OPENCRITIC_API_SEARCH}?${new URLSearchParams({ criteria: normalizedName })}`;
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
    await redis.set(cacheKey, "", 'EX', 60);  // 1 minute for failed responses
    return null;
  }
  const data = await response.json();
  if (!data) {
    console.log('OC: Invalid search data, status code: 404');
    await redis.set(cacheKey, "", 'EX', DATA_EXPIRY);
    return null;
  }

  // Find the app with the shortest distance value that is below 0.03 for the most accurate return
  const apps = data as Array<{ id: number; name: string; dist: number }>;
  const appid = apps.find(app => normalizeString(app.name) === normalizedName)?.id || undefined;
  if (!appid) {
    await redis.set(cacheKey, "", 'EX', DATA_EXPIRY);
    return null;
  }

  // Update cache entry and return this entry
  await redis.set(cacheKey, appid, 'EX', ID_EXPIRY);
  return appid;
}

async function getOCData(appid: number) {
  const cacheKey = `oc:${appid}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData === "") return null;
  if (cachedData) return JSON.parse(cachedData);

  console.log("OC: Fetching game data for app id: " + appid);

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
    console.log(`OC: Attempting to fetch game data via fallback...`);
    const pageData = await getDataByPage(appid); // If we run out of requests, we search the page instead
    if (pageData) return pageData;
    console.log(`OC: Failed to fetch game data, status code: ${response.status}`);
    await redis.set(cacheKey, "", 'EX', 60);  // 1 minute for failed responses
    return null;
  }
  const data = await response.json();
  if (!data) {
    console.log('OC: Invalid game data, status code: 404');
    await redis.set(cacheKey, "", 'EX', DATA_EXPIRY);
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
  const medianScore = data.medianScore;
  const percentile = data.percentile;
  const totalCriticReviews = data.numReviews;
  const totalTopCriticReviews = data.numTopCriticReviews;
  const userScore = -1;
  const totalUserReviews = -1;
  const tier = { name: data.tier, url: 'https://' + process.env.OPENCRITIC_IMG_HOST + '/mighty-man/' + data.tier.toLowerCase() + '-man.png' };
  const ocUrl = data.url;

  // Fetch capsule image to ensure it exists, otherwise return undefined capsuleImage
  const boxImageExists = !!data.images?.box?.og;
  const capsuleImageUrl = boxImageExists ? 'https://' + process.env.OPENCRITIC_IMG_HOST + '/' + data.images.box.og : undefined; // Box image
  const capsuleImageResponse = capsuleImageUrl ? await fetch(capsuleImageUrl, { method: 'HEAD' }) : undefined;
  const capsuleImage = capsuleImageResponse?.ok ? capsuleImageUrl : undefined;
  
  // Update cache entry and return this entry
  const newEntry = { id, name, releaseDate, developer, publisher, hasLootBoxes, percentRec, criticScore, medianScore, percentile, totalCriticReviews, totalTopCriticReviews, userScore, totalUserReviews, tier, url: ocUrl, capsuleImage };
  
  // Cache the appIDCache for the normalized name to skip appIDByName calls since normalized names are === page's game name
  const normalizedAppName = normalizeString(name);
  await redis.set(`oc:${normalizedAppName}`, id, 'EX', ID_EXPIRY);
  await redis.set(`oc:${id}`, JSON.stringify(newEntry), 'EX', DATA_EXPIRY);
  return newEntry;
}

async function getDataByPage(appid: number) {
  const url = `${process.env.OPENCRITIC_PAGE_GAME}/${appid}/${appid}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const html = await response.text();
  const $ = cheerio.load(html);

  const jsonScript = $('#serverApp-state[type="application/json"]').html();
  const parsedData = JSON.parse(jsonScript?.replace(/&q;/g, '"') || '{}');
  if (!parsedData) return null;
  const data = parsedData[`game/${appid}`];
  if (!data) return null;
  
  // Extract data from the response
  const gameData = {
    id: data.id,
    name: data.name,
    date: new Date(data.firstReleaseDate),
    developer: data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'developer')?.name || data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'publisher')?.name,
    publisher: data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'publisher')?.name || data.Companies.find((c: { type: string }) => c.type.toLowerCase() === 'developer')?.name,
    hasLootBoxes: data.hasLootBoxes,
    percentRec: Math.round(data.percentRecommended),
    criticScore: Math.round(data.topCriticScore),
    medianScore: data.medianScore,
    percentile: data.percentile,
    totalCriticReviews: data.numReviews,
    totalTopCriticReviews: data.numTopCriticReviews,
    userScore: -1,
    totalUserReviews: -1,
    tier: { name: data.tier, url: 'https://' + process.env.OPENCRITIC_IMG_HOST + '/mighty-man/' + data.tier.toLowerCase() + '-man.png' },
    ocUrl: data.url,

  };
  const releaseDate = `${gameData.date.toLocaleString('default', { month: 'long' })} ${gameData.date.getDate()}, ${gameData.date.getFullYear()}`

  // Fetch capsule image to ensure it exists, otherwise return undefined capsuleImage
  const boxImageExists = !!data.images?.box?.og;
  const capsuleImageUrl = boxImageExists ? data.images.box.og : undefined; // Box image
  const capsuleImageResponse = capsuleImageUrl ? await fetch(capsuleImageUrl, { method: 'HEAD' }) : undefined;
  const capsuleImage = capsuleImageResponse?.ok ? capsuleImageUrl : undefined;

  const newEntry = { ...gameData, releaseDate, capsuleImage };
  redis.set(`oc:${appid}`, JSON.stringify(newEntry), 'EX', DATA_EXPIRY);
  return newEntry;
}

// API Calls are limited to 25 searches per day and 200 requests per day
export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const identifier = pathname.split('/').pop() as string || '';

  try {
    // If the identifier is a number, skip the search for app ID
    const appid = isNaN(Number(identifier)) ? (await getAppIDByName(identifier)) : Number(identifier);
    if (!appid) {
      console.log(`OC: No app ID found for game name: ${identifier}, status code: 404`);
      return Response.json({ status: 404, error: `No app ID found for game name: ${identifier}, status code: 404'` });
    }
    const data = await getOCData(appid as number);
    // const data = mockData;

    return Response.json({ status: 200, ...data });
  } catch (error) {
    console.error('OC:', error);
    return Response.json({ error: 'OPENCRITIC: Internal Server Error' }, { status: 500 });
  }
}
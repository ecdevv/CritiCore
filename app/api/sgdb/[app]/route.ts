import SGDB, { SGDBGame } from "steamgriddb";
import { setCache, setCacheEmpty } from "@/app/utility/cache";
import { normalizeString } from "@/app/utility/strings";

interface ExtendedSGDBGame extends SGDBGame {
  release_date: string;
}

const MAX_CACHE_SIZE = 25 * 1024 * 1024;      // 25MB
const REVALIDATION_TIME = 1 * 5 * 60 * 1000;  // Cache for 5 minutes
const cache = new Map();

async function getSGDBImage(name: string) {
  const cacheKey = `sgdb-${name}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    // Cache empty entry for 5 minutes before fetching SGDB grids
    setCacheEmpty(cacheKey, undefined, cache, REVALIDATION_TIME, MAX_CACHE_SIZE);

    // Fetching SGDB grids for app ID based on name (the results have to have a release date to count as a game);
    // Find the first (best) static grid/capsule image
    const client = new SGDB(`${process.env.SGDB_API_KEY}`);
    const searchData = await client.searchGame(name) as ExtendedSGDBGame[];
    const appid = searchData.find((data) => data.release_date !== undefined)?.id as number;
    if(!appid) {
      console.log(`SGDB: No appid found for game: ${name}`);
      return;
    }
    const grids = await client.getGrids({ type: 'game', id: appid, types: ['static'], styles: ['alternate'], dimensions: ['600x900'], nsfw: 'false' });
    if(!grids[0]) {
      console.log(`SGDB: No grids returned for app: ${name}`);
      return;
    }
    const capsuleImage = grids[0].url.toString();

    // Update cache entry and return this entry;
    setCache(cacheKey, capsuleImage, cache, REVALIDATION_TIME, MAX_CACHE_SIZE);
    return capsuleImage;
  } catch (error) {
    console.log(`SGDB: Error retrieving SGDB grids data for app: ${name}`);
    throw error;
  }
}

async function getMultipleSGDBImages(names: string[]) {
  // Fetch the images from SGDB, if not found, return a default path
  const images = await Promise.all(names.map(async name => {
    try {
      const image = await getSGDBImage(name);
      return image;
    } catch {
      return { capsuleImage: '/' };
    }
  }));
  return images;
}

export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const identifier = pathname.split('/').pop() as string || '';

  try {
    const identifiers = identifier.split(',').map(name => normalizeString(name.trim()));
    if (!identifiers.length) throw new Error('Invalid game name(s) provided, status code: 400');

    if (identifiers.length > 1) {
      const images = await getMultipleSGDBImages(identifiers);
      return Response.json({ status: 200, images });
    }

    // Fetch the image from SGDB
    const name = normalizeString(identifier);
    const capsuleImage = await getSGDBImage(name);
    if (!capsuleImage) {
      console.log(`SGDB: No image returned for game: ${name}`);
      return Response.json({ status: 400, capsuleImage: undefined });
    }

    return Response.json({ status: 200, capsuleImage });
  } catch (error) {
    console.error('SGDB:', error);
    return Response.json({ error: 'SGDB: Internal Server Error' }, { status: 500 });
  }
}


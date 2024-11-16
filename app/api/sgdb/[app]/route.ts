import SGDB, { SGDBGame } from "steamgriddb";
import { normalizeString } from "@/app/utility/helper";
import generateBlurDataURL from "@/app/utility/generateBlurDataURL";

interface ExtendedSGDBGame extends SGDBGame {
  release_date: string;
}

interface SGDBCacheEntry {
  capsuleImage: { og: string | undefined; blur: string | undefined } | undefined;
  expires: number;
}

const MAX_SGDB_CACHE_SIZE = 1000;
const sgdbCache = new Map<string, SGDBCacheEntry>();

async function getSGDBImage(name: string): Promise<SGDBCacheEntry> {
  const cacheKey = `sgdb-${name}`;
  const now = Date.now() / 1000;
  const cachedEntry = sgdbCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Cache empty entry for 5 minutes before fetching SGDB grids
    if (sgdbCache.size >= MAX_SGDB_CACHE_SIZE) {
      const oldestEntry = Array.from(sgdbCache).sort((a, b) => a[1].expires - b[1].expires)[0];
      sgdbCache.delete(oldestEntry[0]);
    }
    sgdbCache.set(cacheKey, { capsuleImage: undefined, expires: now + 300 });

    // Fetching SGDB grids for app ID based on name (the results have to have a release date to count as a game);
    // Find the first (best) static grid/capsule image
    const client = new SGDB(`${process.env.SGDB_API_KEY}`);
    const searchData = await client.searchGame(name) as ExtendedSGDBGame[];
    const appid = searchData.find((data) => data.release_date !== undefined)?.id as number;
    if(!appid) throw new Error('No appid found for game');
    const grids = await client.getGrids({ type: 'game', id: appid, types: ['static'], styles: ['alternate'], dimensions: ['600x900'], nsfw: 'false' });
    if(!grids[0]) throw new Error('No grids returned for appid');

    // Fetch to test if the image is available and if so, generate a blur data url
    const capsuleImgTestUrl = grids[0].url.toString();
    const capsuleImgResponse = await fetch(capsuleImgTestUrl);
    const capsuleImgBuffer = capsuleImgResponse.ok ? await capsuleImgResponse.arrayBuffer() : undefined;
    const capsuleImgBlur = capsuleImgBuffer ? await generateBlurDataURL(capsuleImgBuffer) : undefined;
    const capsuleImgUrl = capsuleImgResponse.ok ? capsuleImgTestUrl : undefined;
    const capsuleImage = capsuleImgUrl ? { og: capsuleImgUrl, blur: capsuleImgBlur } : undefined;

    // Update cache entry and return this entry
    const newEntry = { capsuleImage, expires: now + 600 };
    sgdbCache.set(cacheKey, newEntry);
    return newEntry;
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
    const { capsuleImage } = await getSGDBImage(name);
    if (!capsuleImage) throw new Error('CACHED - No image returned from SGDB');

    return Response.json({ status: 200, capsuleImage });
  } catch (error) {
    console.error('SGDB:', error);
    return Response.json({ error: 'SGDB: Internal Server Error' }, { status: 500 });
  }
}


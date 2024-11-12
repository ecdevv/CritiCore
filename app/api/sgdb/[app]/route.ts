import SGDB, { SGDBGame } from "steamgriddb";
import { normalizeString } from "@/app/utility/helper";

interface ExtendedSGDBGame extends SGDBGame {
  release_date: string;
}

interface SDGBCacheEntry {
  capsuleImage: string;
  expires: number;
}

const sdgbCache: Record<string, SDGBCacheEntry> = {};

async function getSGDBImage(name: string): Promise<SDGBCacheEntry> {
  const cacheKey = `sgdb-${name}`;
  const now = Date.now() / 1000;
  const cachedEntry = sdgbCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) {
    console.log(`SGDB: Returning cached SGDB data for game: ${name}`);
    return cachedEntry;
  }

  try {
    // Fetch SGDB grids for app ID based on name (the results have to have a release date to count as a game);
    // Find the first (best) static grid/capsule image
    const client = new SGDB(`${process.env.SGDB_API_KEY}`);
    const searchData = await client.searchGame(name) as ExtendedSGDBGame[];
    const appid = searchData.find((data) => data.release_date !== undefined)?.id as number;
    if(!appid) throw new Error('No appid found for game');
    const grids = await client.getGrids({ type: 'game', id: appid, types: ['static'], styles: ['alternate'], dimensions: ['600x900'], nsfw: 'false' });
    if(!grids[0]) throw new Error('No grids returned for appid');
    const capsuleImage = grids[0].url.toString();

    const newEntry = { capsuleImage, expires: now + 600 };
    sdgbCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    const newEntry = { capsuleImage: '', expires: now + 600 };
    sdgbCache[cacheKey] = newEntry;
    console.log(`SGDB: Error retrieving SGDB grids data for app: ${name}`);
    throw error;
  }
}

export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const gameName = pathname.split('/').pop() as string || '';
  const name = normalizeString(gameName);

  try {
    // Fetch the image from SGDB
    const { capsuleImage } = await getSGDBImage(name);
    if (!capsuleImage) throw new Error('CACHED - No image returned from SGDB');

    return Response.json({ status: 200, capsuleImage });
  } catch (error) {
    console.error('SGDB:', error);
    return Response.json({ error: 'SGDB: Internal Server Error' }, { status: 500 });
  }
}


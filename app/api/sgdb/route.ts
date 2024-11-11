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

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Fetch SGDB grids for app ID based on name (the results have to have a release date to count as a game);
    // Find the first (best) static grid/capsule image
    const client = new SGDB(`${process.env.SGDB_API_KEY}`);
    const searchData = await client.searchGame(name) as ExtendedSGDBGame[];
    const appid = searchData.find((data) => data.release_date !== undefined)?.id as number;
    const grids = await client.getGrids({ type: 'game', id: appid, types: ['static'], styles: ['alternate'], dimensions: ['600x900'], nsfw: 'false' });
    const capsuleImage = grids[0].url.toString();

    const newEntry = { capsuleImage, expires: now + 600 };
    sdgbCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    const newEntry = { capsuleImage: '', expires: now + 600 };
    sdgbCache[cacheKey] = newEntry;
    console.error(`SGDB: Error retrieving SGDB grids data for app: ${name}:`, error);
    throw new Error('SGDB: Could not retrieve grids data');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get('gameName') || '';
  const name = normalizeString(gameName);

  try {
    // Fetch the image from SGDB
    const { capsuleImage } = await getSGDBImage(name);
    if (!capsuleImage) throw new Error('SGDB: CACHED - No image returned from SGDB');

    return Response.json({ status: 200, capsuleImage });
  } catch (error) {
    console.error('SGDB: Unexpected error fetching SGDB image:', error);
    return Response.json({ error: 'SGDB: Internal Server Error' }, { status: 500 });
  }
}


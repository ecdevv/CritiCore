import SGDB, { SGDBGame } from "steamgriddb";
import { normalizeString } from "@/utility/strings";

interface ExtendedSGDBGame extends SGDBGame {
  release_date: number;
}

async function getSGDBImage(name: string) {
  // Fetching SGDB grids for app ID based on name (the results have to have a release date to count as a game);
  // Find the first (best) static grid/capsule image
  const client = new SGDB(`${process.env.SGDB_API_KEY}`);
  const searchData = await client.searchGame(name) as ExtendedSGDBGame[];
  const appid = searchData.find((data) => data.release_date !== undefined)?.id as number;
  if(!appid) {
    console.log(`SGDB: No appid found for game: ${name}`);
    return null;
  }
  const grids = await client.getGrids({ type: 'game', id: appid, types: ['static'], styles: ['alternate'], dimensions: ['600x900'], nsfw: 'false' });
  if(!grids[0]) {
    console.log(`SGDB: No grids returned for app: ${name}`);
    return null;
  }
  const capsuleImage = grids[0].url.toString();

  return capsuleImage;
}

export async function GET(request: Request) {
  const { pathname } = new URL(request.url);
  const identifier = pathname.split('/').pop() as string || '';

  try {
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

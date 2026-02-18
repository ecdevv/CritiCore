import { redis } from "@/utility/redis";
import { normalizeString } from "@/utility/strings";

const REDIS_HASH_KEY = 'steam:_appIndex';
const EXPIRY_TIME = 24 * 60 * 60; // Cache for 24 hours

export default async function getSteamIndex() {
  const cachedAppIndex = await getAppIndexFromCache();
  if (cachedAppIndex && Object.keys(cachedAppIndex).length > 0) return cachedAppIndex;

  try {
    console.log("Fetching app index...");
    // Setup variables for the data
    const key = process.env.STEAM_API_KEY || '';
    let applist = [];
    let lastAppId = 0;
    let haveMoreResults = true;

    // Fetch data from Steam API; data is paginated by 15000 to ensure data is under 2MB for force-cache so we loop until haveMoreResults is false
    while (haveMoreResults) {
      const searchParams = new URLSearchParams({ key, include_games: 'true', include_dlc: 'false', include_software: 'false', include_videos: 'false', include_hardware: 'false', max_results: '15000' });
      if (lastAppId) searchParams.append('last_appid', lastAppId.toString());
      const response = await fetch(`${process.env.STEAM_API_APPLIST_V1}/?${searchParams}`, { next: { revalidate: EXPIRY_TIME } });
      if (!response.ok) throw new Error(`Failed to fetch applist data, status code: ${response.status}`);
      const data = await response.json();
      if (!data) throw new Error('Invalid applist data, status code: 404');

      // Extract data from the response
      applist.push(data.response.apps.flat());
      haveMoreResults = data.response.have_more_results;
      lastAppId = data.response.last_appid;
    }
    
    // Flatten the array
    applist = applist.flat();

    // Create an index of app names to app IDs
    const appIndex = applist.reduce((index, app) => {
      index[normalizeString(app.name)] = app.appid;
      return index;
    }, {});

    // Cache the app index and return it
    await storeAppIndexInCache(appIndex);
    return appIndex;
  } catch (error) {
    console.log('STEAM: Error retrieving applist');
    throw error;
  }
}

async function getAppIndexFromCache(): Promise<Record<string, number>> {
  const allChunks: Record<string, number> = {};
  let chunkIndex = 1;

  while (true) {
    const field = `part${chunkIndex}`;
    let result: string | null = null;

    // Get the field from the Redis hash
    try {
      result = await redis.hget(REDIS_HASH_KEY, field);
    } catch (err) {
      console.error("Redis unavailable, skipping cache:", err);
    }

    if (!result) break;

    Object.assign(allChunks, JSON.parse(result));
    chunkIndex++;
  }

  return allChunks;
}

// Function to split the appIndex into smaller chunks
function splitAppIndex(appIndex: Record<string, number>, chunkSize: number): Record<string, number>[] {
  const chunked: Record<string, number>[] = [];
  const appNames = Object.keys(appIndex);

  for (let i = 0; i < appNames.length; i += chunkSize) {
    const chunk = appNames.slice(i, i + chunkSize).reduce((acc: Record<string, number>, appName: string) => {
      acc[appName] = appIndex[appName];
      return acc;
    }, {});
    chunked.push(chunk);
  }

  return chunked;
}

// Function to store the appIndex in Redis hash in chunks
async function storeAppIndexInCache(appIndex: Record<string, number>) {
  const chunkSize = 15000;
  const chunks = splitAppIndex(appIndex, chunkSize);
  
  // Store each chunk in the Redis hash as a field
  for (let i = 0; i < chunks.length; i++) {
    const chunkField = `part${i + 1}`;  // Field name for each chunk

    try {
      await redis.hset(REDIS_HASH_KEY, chunkField, JSON.stringify(chunks[i]));
      await redis.expire(REDIS_HASH_KEY, EXPIRY_TIME);
    } catch (err) {
      console.error("Redis unavailable, skipping cache:", err);
    }
  }
}
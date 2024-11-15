interface StoreDataCacheEntry {
  topReleases: { month: string; appids: number[] }[] | [];
  mostPlayed: { rank: number; appid: string; lastWeekRank: number; peakInGame: string;}[] | [];
  expires: number;
}

const storeDataCache: Record<string, StoreDataCacheEntry> = {};

async function getStoreData(): Promise<StoreDataCacheEntry> {
  const cacheKey = `store-data`;
  const now = Date.now() / 1000;
  const cachedEntry = storeDataCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry;

  try {
    // Cache empty entry for 10 minutes before fetching game data based on the app ID
    storeDataCache[cacheKey] = { topReleases: [], mostPlayed: [], expires: now + 300 };
    const allResponses = await Promise.all([
      fetch(`${process.env.STEAM_API_TOP_RELEASES}`),
      fetch(`${process.env.STEAM_API_MOST_PLAYED}`),
    ]);
    const [topReleasesResponse, mostPlayedResponse] = allResponses
    if (!allResponses || !allResponses.every(response => response.ok)) {
      const errorResponses = allResponses.filter(response => !response.ok);
      throw new Error(`Failed to fetch store data, status code: ${errorResponses[0].status}`);
    }
    const [topReleasesData, mostPlayedData] = await Promise.all([
      topReleasesResponse.json(),
      mostPlayedResponse.json(),
    ]);
    
    // Extract data from the responses
    const topReleases = topReleasesData.response.pages.map((page: { name: string; item_ids: { appid: number }[] }) => ({
      month: page.name,
      appids: page.item_ids.map(item => item.appid),
    }));
    const mostPlayed: { rank: number; appid: string; lastWeekRank: number; peakInGame: string;}[] = mostPlayedData.response.ranks;

    // Update cache entry and return this entry
    const newEntry = {
      topReleases,
      mostPlayed,
      expires: now + 600
    };

    storeDataCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    console.log(`STEAM: Error retrieving store data`);
    throw error;
  }
}

export async function GET(_request: Request) {  
  try {
    const { topReleases, mostPlayed } = await getStoreData();
    return Response.json({ status: 200, topReleases, mostPlayed });
  } catch (error) {
    console.error('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}
const REVALIDATION_TIME = 1 * 30 * 60 * 1000; // Cache for 30 minutes
const cache = new Map();

async function getStoreData() {
  if (cache.has('charts')) return cache.get('charts');

  try {
    // Fetch data from Steam API
    const allResponses = await Promise.all([
      fetch(`${process.env.STEAM_API_TOP_RELEASES}`, { next: { revalidate: REVALIDATION_TIME } }),
      fetch(`${process.env.STEAM_API_MOST_PLAYED}`, { next: { revalidate: REVALIDATION_TIME } }),
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
    };
    cache.set('charts', newEntry);
    setTimeout(() => cache.delete('applist'), REVALIDATION_TIME);

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
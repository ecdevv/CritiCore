async function getSteamCharts() {
  // Fetch data from Steam API
  const allResponses = await Promise.all([
    fetch(`${process.env.STEAM_API_TOP_RELEASES}`),
    fetch(`${process.env.STEAM_API_MOST_PLAYED}`),
  ]);
  if (!allResponses.every(response => response.ok)) {
    const failedResponse = allResponses.find(response => !response.ok);
    throw new Error(`Failed to fetch app data, status code: ${failedResponse?.status}`);
  }
  const [topReleasesResponse, mostPlayedResponse] = allResponses
  const [topReleasesData, mostPlayedData] = await Promise.all([
    topReleasesResponse.json(),
    mostPlayedResponse.json(),
  ]);
  
  // Extract data from the responses
  const topReleases = topReleasesData.response.pages.map((page: { name: string; item_ids: { appid: number }[] }) => ({
    category: page.name,
    appids: page.item_ids.map(item => item.appid),
  }));
  const mostPlayed = mostPlayedData.response.ranks.map((rank: { rank: number; appid: string; lastWeekRank: number; peakInGame: string; }) => ({ 
    ...rank, 
    category: 'Most Played'
  }));

  // Update cache entry and return this entry
  const newEntry = {
    topReleases,
    mostPlayed,
  };

  return newEntry;
}

export async function GET(_request: Request) {  
  try {
    const { topReleases, mostPlayed } = await getSteamCharts();
    return Response.json({ status: 200, topReleases, mostPlayed });
  } catch (error) {
    console.error('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}
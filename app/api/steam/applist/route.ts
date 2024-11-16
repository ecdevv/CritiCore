const REVALIDATION_TIME = 2 * 60 * 60 * 1000; // Cache for 2 hours
const cache = new Map();

async function getAppList() {
  if (cache.has('applist')) return cache.get('applist');

  try { 
    // Setup variables for the data
    const key = process.env.STEAM_API_KEY || '';
    let applist = [];
    let lastAppId = 0;
    let haveMoreResults = true;

    // Fetch data from Steam API; data is paginated by 15000 to ensure data is under 2MB for force-cache so we loop until haveMoreResults is false
    while (haveMoreResults) {
      const searchParams = new URLSearchParams({ key, include_games: 'true', include_dlc: 'false', include_software: 'false', include_videos: 'false', include_hardware: 'false', max_results: '15000' });
      if (lastAppId) searchParams.append('last_appid', lastAppId.toString());
      const response = await fetch(`${process.env.STEAM_API_APPLIST_V1}/?${searchParams}`, { next: { revalidate: REVALIDATION_TIME } });
      if (!response.ok) throw new Error(`Failed to fetch applist data, status code: ${response.status}`);
      const data = await response.json();
      if (!data) throw new Error('Invalid applist data, status code: 404');

      // Extract data from the response
      applist.push(data.response.apps.flat());
      haveMoreResults = data.response.have_more_results;
      lastAppId = data.response.last_appid;
    }
    
    // Update cache entry and return this entry
    applist = applist.flat();
    cache.set('applist', applist);
    setTimeout(() => cache.delete('applist'), REVALIDATION_TIME);

    return applist;
  } catch (error) {
    console.log('STEAM: Error retrieving applist');
    throw error;
  }
}

export async function GET(_request: Request) {
  try {
    const applist = await getAppList();
    return Response.json({ status: 200, applist });
  } catch (error) {
    console.log('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}
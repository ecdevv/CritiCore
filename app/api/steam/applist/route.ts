type SteamAppList = { appid: number; name: string; }[];

interface AppListCacheEntry {
  applist: SteamAppList;
  expires: number;
}

const appListCache: Record<string, AppListCacheEntry> = {};

async function getAppList(): Promise<SteamAppList> {
  const cacheKey = 'steam-applist';
  const now = Date.now() / 1000;
  const cachedEntry = appListCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) return cachedEntry.applist;

  try {
    // Fetch applist data
    const response = await fetch(`${process.env.STEAM_API_APPLIST}`);
    if (!response.ok) throw new Error(`Failed to fetch applist data, status code: ${response.status}`);
    const data = await response.json();
    if (!data) throw new Error('Invalid applist data, status code: 404');

    // Extract data from the response
    const applist = data.applist.apps;

    appListCache[cacheKey] = { applist, expires: now + 3600 };
    return applist;
  } catch (error) {
    appListCache[cacheKey] = { applist: [], expires: 0 };
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
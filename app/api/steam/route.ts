import { normalizeString } from "@/app/utility/helper";

const appCache: { [key: string]: { success: 200, appName: string | undefined, appId: number | undefined, expires: number } } = { };
async function getAppIDByName(name: string): Promise<{ success: 200, appName: string | undefined, appId: number | undefined }> {
  const start = Date.now();
  const cacheKey = normalizeString(name);
  const now = Date.now() / 1000;
  if (appCache[cacheKey] && appCache[cacheKey].expires > now) {
    console.log('App reviews API call took', Date.now() - start, 'ms');
    return appCache[cacheKey];
  }

  let response = await fetch(`https://api.steampowered.com/ISteamApps/GetAppList/v2/`);
  let data = await response.json();
  let appsList = data.applist.apps;
  let app = appsList.find((app: { name: string }) => normalizeString(app.name) === normalizeString(name)) || 'App Not Found';
  let appName = app.name || '';
  let appId = app.appid || '';

  appCache[cacheKey] = { success: 200, appName, appId, expires: now + 600 };
  console.log('App reviews API call took', Date.now() - start, 'ms');
  return appCache[cacheKey];
}

export async function GET( request: Request ) {
  const { searchParams } = new URL(request.url);
  let appIdResponse = await getAppIDByName(searchParams.get('gameName') as string);
  let appName = appIdResponse.appName as string;
  let appId = appIdResponse.appId as number;
  let response = await fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&language=all`, {
    cache: 'force-cache',
  });
  let data = await response.json();

  if (data.success === 1) {
    const reviewScore = data.query_summary.total_positive / data.query_summary.total_reviews;
    return Response.json({ success: 200, appName, reviewScore });
  } else {
    return Response.json({ success: 200, appName, reviewScore: -1 });
  }
}




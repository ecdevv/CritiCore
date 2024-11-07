import { normalizeString } from "@/app/utility/helper";

async function getAppIDByName(name: string): Promise<{ success: 200, appId: number | undefined, appName: string | undefined }> {
  let response = await fetch(`https://api.steampowered.com/ISteamApps/GetAppList/v2/`);
  let data = await response.json();

  let appsList = data.applist.apps;
  
  let app = appsList.find((app: { name: string }) => normalizeString(app.name) === normalizeString(name)) || 'App Not Found';
  let appName = app.name || '';
  let appId = app.appid || '';

  return { success: 200, appId, appName };
}

export async function GET( request: Request ) {
  const { searchParams } = new URL(request.url);
  let appIdResponse = await getAppIDByName(searchParams.get('gameName') as string);
  let appId = appIdResponse.appId as number;
  let appName = appIdResponse.appName as string;
  let response = await fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&language=all`);
  let data = await response.json();

  if (data.success === 1) {
    const reviewScore = data.query_summary.total_positive / data.query_summary.total_reviews;
    return Response.json({ success: 200, reviewScore, appName });
  } else {
    return Response.json({ success: 200, reviewScore: 0, appName });
  }
}




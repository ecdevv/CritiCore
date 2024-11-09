import { normalizeString } from "@/app/utility/helper";

interface AppCacheEntry {
  status: Response['status'];
  matchingApps: { name: string; appid: number }[];
  expires: number;
}

const appCache: Record<string, AppCacheEntry> = {};

async function getAppIDByName(name: string): Promise<AppCacheEntry> {
  const cacheKey = normalizeString(name);
  const now = Date.now() / 1000;
  const cachedEntry = appCache[cacheKey];

  if (cachedEntry && cachedEntry.expires > now) {
    return cachedEntry;
  }

  try {
    // Fetch app ID based on the game name from params in url
    const response = await fetch('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
    const data = await response.json();
    const matchingApps = data.applist.apps.filter((app: { name: string; appid: number }) => 
      normalizeString(app.name) === cacheKey) || { name: '', appid: -1 };

    const newEntry = {
      status: response.status,
      matchingApps,
      expires: response.ok ? now + 600 : now,
    };

    appCache[cacheKey] = newEntry;
    return newEntry;
  } catch (error) {
    console.error('Error fetching app ID:', error);
    throw new Error('Could not retrieve app ID');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get('gameName') || '';
  const { matchingApps } = await getAppIDByName(gameName);

  // Check if the app(s) was found
  if (!matchingApps.length) {
    return Response.json({ status: 404, appName: '', reviewScore: -1 });
  }

  // Handle multiple apps with the same name or just one, await Steam API responses, and combines all the data
  const appInfos = await Promise.all(matchingApps.map(async (app) => {
    try {
      const [detailsResponse, reviewsResponse] = await Promise.all([
        fetch(`https://store.steampowered.com/api/appdetails?appids=${app.appid}`, { cache: 'force-cache' }),
        fetch(`https://store.steampowered.com/appreviews/${app.appid}?json=1&language=all`, { cache: 'force-cache' }),
      ]);

      if (!detailsResponse.ok || !reviewsResponse.ok) {
        throw new Error('Failed to fetch app data');
      }

      const [detailsData, reviewsData] = await Promise.all([
        detailsResponse.json(),
        reviewsResponse.json(),
      ]);

      // Check if the data is valid for reviews using its success property since its response is always returning ok
      if (reviewsData.success !== 1) {
        throw new Error('Failed to fetch valid review data');
      }

      return { app, ...detailsData, ...reviewsData };
    } catch (error) {
      console.error(`Error fetching app ${app.appid} data:`, error);
      throw new Error('Could not retrieve app data');
    }
  }));

  // Find the app with the most reviews
  const appWithMostReviews = appInfos.reduce(
    (mostReviewsApp, currentApp) => 
      currentApp.query_summary.total_reviews > mostReviewsApp.query_summary.total_reviews ? currentApp : mostReviewsApp,
    appInfos[0]
  );

  // Get the data from the app with the most reviews
  const name = appWithMostReviews.app.name
  const id = appWithMostReviews.app.appid
  const releaseDate = appWithMostReviews[appWithMostReviews.app.appid]?.data?.release_date?.date || undefined
  const developer = appWithMostReviews[appWithMostReviews.app.appid]?.data?.developers[0] || undefined
  const publisher = appWithMostReviews[appWithMostReviews.app.appid]?.data?.publishers[0] || undefined
  const ageRating = appWithMostReviews[appWithMostReviews.app.appid]?.data?.required_age || undefined
  const image = appWithMostReviews[appWithMostReviews.app.appid]?.data?.header_image || undefined
  const url = `${process.env.NEXT_PUBLIC_STEAM_STORE_URL}${id}`

  // Calculate the review score; if no reviews, return -1 for invalid data
  const { query_summary: { total_reviews: totalReviews, total_positive: totalPositive } } = appWithMostReviews;
  const score = totalReviews ? Math.floor((totalPositive / totalReviews) * 100) : -1;

  return Response.json({ status: 200, name, id, releaseDate, developer, publisher, ageRating, image, score, totalReviews, url });
}

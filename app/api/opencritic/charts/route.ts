

const REVALIDATION_TIME = 1 * 30 * 60 * 1000; // Cache for 30 minutes
const cache = new Map();

type FeaturedData = {
  images: { [key: string]: {[key: string]: string} };
  id: number;
  firstReleaseDate: string;
  Platforms: string[];
  topCriticScore: number;
  tier: string;
  tags: string[];
}

async function getFeaturedData() {
  const cacheKey = `charts`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    // Fetching HoF data for app ID based on app ID from params in url
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.OPENCRITIC_API_KEY || '',
        'x-rapidapi-host': process.env.OPENCRITIC_API_HOST || ''
      }
    }
    const allResponses = await Promise.all([
      fetch(`${process.env.OPENCRITIC_API_POPULAR}`, { ...options, cache: 'force-cache' }),
      fetch(`${process.env.OPENCRITIC_API_HOF}`, { ...options, cache: 'force-cache' }),
    ]);
    if (!allResponses.every(response => response.ok)) {
      const failedResponse = allResponses.find(response => !response.ok);
      throw new Error(`Failed to fetch app data, status code: ${failedResponse?.status}`);
    }
    const [popularResponse, hofResponse] = allResponses;
    const [popularData, hofData] = await Promise.all([
      popularResponse.json(),
      hofResponse.json(),
    ]);

    // Extract data from the responses and fixing dates
    const popular = popularData.map((item: FeaturedData) => ({
      ...item,
      category: 'Trending New Releases',
      releaseDate: new Date(item.firstReleaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      capsuleImage: !!item.images?.box?.og ? 'https://' + process.env.OPENCRITIC_IMG_HOST + '/' + item.images?.box?.og : undefined
    })).slice(0, 10);

    const hof = hofData.map((item: FeaturedData) => ({
      ...item,
      category: 'Hall of Fame (' + new Date(hofData[0].firstReleaseDate).getFullYear() + ')',
      releaseDate: new Date(item.firstReleaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      capsuleImage: !!item.images?.box?.og ? 'https://' + process.env.OPENCRITIC_IMG_HOST + '/' + item.images?.box?.og : undefined
    })).slice(0, 10);

    // Update cache entry and return this entry
    const newEntry = {
      popular,
      hof,
    };
    cache.set('charts', newEntry);
    setTimeout(() => cache.delete('charts'), REVALIDATION_TIME);

    return newEntry;
  } catch (error) {
    console.log(`OC: Error retrieving featured games data`);
    throw error;
  }
}

export async function GET(_request: Request) {
  try {
    const { popular, hof } = await getFeaturedData();
    return Response.json({ status: 200, popular, hof });
  } catch (error) {
    console.error(`OC:`, error);
    return Response.json({ error: 'OC: Internal Server Error' }, { status: 500 });
  }
}
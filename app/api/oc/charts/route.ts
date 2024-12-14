type FeaturedData = {
  images: { [key: string]: {[key: string]: string} };
  id: number;
  firstReleaseDate: string;
  Platforms: string[];
  topCriticScore: number;
  tier: string;
  tags: string[];
}

async function getOCCharts() {
  // Fetching HoF data for app ID based on app ID from params in url
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': process.env.OPENCRITIC_API_KEY || '',
      'x-rapidapi-host': process.env.OPENCRITIC_API_HOST || ''
    }
  }
  const allResponses = await Promise.all([
    fetch(`${process.env.OPENCRITIC_API_POPULAR}`, { ...options, next: { revalidate: 28800 } }),  // 8 hours
    fetch(`${process.env.OPENCRITIC_API_HOF}`, { ...options, next: { revalidate: 28800 } }),  // 8 hours
  ]);
  if (!allResponses.every(response => response.ok)) {
    const failedResponse = allResponses.find(response => !response.ok);
    console.log(`Failed to fetch app data, status code: ${failedResponse?.status}`);
    return null;
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

  return newEntry;
}

export async function GET(_request: Request) {
  try {
    const data = await getOCCharts();
    const { popular, hof } = data ?? {};
    if (!popular || !hof) return Response.json({ error: 'OC: Internal Server Error', status: 500 });
    return Response.json({ status: 200, popular, hof });
  } catch (error) {
    console.error(`OC:`, error);
    return Response.json({ error: 'OC: Internal Server Error' , status: 500 });
  }
}
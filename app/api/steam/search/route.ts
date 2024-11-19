import * as cheerio from 'cheerio';
import levenshtein from 'damerau-levenshtein';
import { normalizeString } from "@/app/utility/strings";

type Game = {
  link: string | undefined;
  id: number;
  name: string;
  tags: string[] | undefined;
  releaseDate: string | undefined;
  reviewSummary: string | undefined;
  reviewPercentage: number | undefined;
  posReviewCount: number | undefined;
  ogPrice: number | undefined;
  price: number | undefined;
  discount: string | undefined;
  headerImage: string | undefined;
  capsuleImage: string | undefined;
};

async function convertTags(tagsList: { response: { tags: { name: string; tagid: number }[] } }, tagids: number[]) {
  const tags = tagids.map(tagid => {
    const tag = tagsList.response.tags.find((tag: { tagid: number }) => tag.tagid === tagid);
    return tag ? tag.name : null;
  }).filter(tagName => tagName !== null);
  return tags;
}

async function optimizedSearch(games: Game[], searchQuery: string) {
  // Normalize the query once
  const normalizedQuery = normalizeString(searchQuery);

  // Pre-normalize all app names and create a distance array
  const appDistances = games.map((game) => {
    const normalizedAppName = normalizeString(game.name);
    const distance = levenshtein(normalizedQuery, normalizedAppName).relative;
    return {
      ...game,
      normalizedAppName,
      distance,
    };
  });

  // Filter apps based on levenshtein distance and include normalized query
  const filteredApps = appDistances.filter(({ normalizedAppName, distance }) => normalizedAppName.includes(normalizedQuery) && distance <= 0.75);

  // Sort by the levenshtein distance (ascending)
  filteredApps.sort((a, b) => a.distance - b.distance);

  // Create a unique index of apps based on normalized name
  const uniqueApps = new Map<string, Game & { normalizedAppName: string; distance: number }>();
  filteredApps.forEach((game) => {
    if (!uniqueApps.has(game.normalizedAppName) || game.distance < uniqueApps.get(game.normalizedAppName)!.distance) {
      uniqueApps.set(game.normalizedAppName, { ...game, distance: game.distance });
    }
  });

  // Convert unique apps Map back to an array and remove the normalizedAppName property
  const finalResults = Array.from(uniqueApps.values()).map(({ normalizedAppName: _, ...game }) => game);
  return finalResults;
}

async function getSteamStore(searchQuery: string) {
  if (!searchQuery || searchQuery.length < 3) return [];

  // Fetching the steam store for the search results, then using cheerio to scrape the data
  const urlParams = new URLSearchParams({
    term: searchQuery.replace(/ /g, '+').replace(/-/g, '+'),
    category1: '998',
    supportedlang: 'english',
    ndl: '1',
  });
  const response = await fetch(`${process.env.STEAM_STORE_SEARCH}/?${urlParams}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const tagsList = await fetch(`${process.env.STEAM_API_TAGS}`, { next: { revalidate: 86400 } }).then(res => res.json()); // 1 day

  // Extracting the game data from search results
  const games: Game[] = [];
  await Promise.all(
    $("#search_resultsRows > a").map(async (_, element) => {
      const appid = $(element).attr("data-ds-appid");
      const link = $(element).attr("href");
      const name = $(element).find(".title").text().trim();
      const tagids = JSON.parse($(element).attr("data-ds-tagids") || "[]");
      const tags = await convertTags(tagsList, tagids);
      const releaseDate = $(element).find(".col.search_released").text().trim();

      // Extract review summary and percentage
      const reviewData = $(element)
          .find(".search_review_summary")
          .attr("data-tooltip-html");
      let reviewSummary;
      let reviewPercentage;
      let posReviewCount;
      if (reviewData) {
        const match = reviewData.match(/^(.*)<br>(\d+)% of the (\d{1,3}(?:,\d{3})*) user reviews/);
        if (match) {
          reviewSummary = match[1].trim();                // e.g., "Overwhelmingly Positive"
          reviewPercentage = parseInt(match[2], 10);      // e.g., 99
          posReviewCount = match[3].replace(/,/g, '');    // Remove commas if any, e.g., "5,042" becomes "5042"
          posReviewCount = parseInt(posReviewCount, 10);  // Convert to integer
        }
      }

      // Extract price
      const ogPrice = $(element).find(".discount_original_price").text().trim().replace(/[^\d.]/g, "");
      const price = $(element).find(".discount_final_price").text().trim().replace(/[^\d.]/g, "");
      const discount = $(element).find(".discount_pct").text().trim().replace(/-/g, '');

      // Handle images; fetch capsule image to ensure it exists, otherwise return undefined capsuleImage
      const headerImage = $(element).find("img").attr("src");
      const capsuleImageUrl = process.env.STEAM_CDN_CAPSULE + '/' + appid + '/' + 'library_600x900_2x.jpg';
      const capsuleImageResponse = await fetch(capsuleImageUrl, { method: 'HEAD' });
      const capsuleImage = capsuleImageResponse.ok ? capsuleImageUrl : undefined;

      games.push({
        id: Number(appid),
        link,
        name,
        tags,
        releaseDate,
        reviewSummary,
        reviewPercentage,
        posReviewCount,
        ogPrice: Number(ogPrice) ? Number(ogPrice) : Number(price),
        price: Number(price),
        discount: discount,
        headerImage,
        capsuleImage,
      });
    })
  );

  const levenshteinResults = await optimizedSearch(games, searchQuery);
  return levenshteinResults;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  // const baseUrl = new URL(request.url).origin;
  const searchParams = url.searchParams;
  const searchQuery = searchParams.get('q') || '';

  try {
    // const searchResults = await getSearchResults(baseUrl, searchQuery);
    const searchResults = await getSteamStore(searchQuery);
    return Response.json({ status: 200, searchResults });
  } catch (error) {
    console.log('STEAM:', error);
    return Response.json({ error: 'STEAM: Internal Server Error' }, { status: 500 });
  }
}
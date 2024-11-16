import { headers } from "next/headers";
import CardGrid from "@/app/components/grid/CardGrid";
import { CardCategories, SteamCategories } from "@/app/utility/types";
import { normalizeString } from "@/app/utility/helper";
import { PLACEHOLDER_200X300 } from "@/app/utility/constants";

interface SearchProps {
  params: Promise<{ query: string }>;
}

export default async function SearchPage({ params }: SearchProps) {
  const headersList = await headers();
  const baseUrl = headersList.get('x-base-url') || '';
  const searchQuery = (await params).query || '';

  let categoryData: CardCategories[] = [];

  try {
    // Fetch search results
    const searchResultsResponse = await fetch(`${baseUrl}/api/steam/search?q=${searchQuery}`);
    if (!searchResultsResponse.ok) throw new Error('Failed to fetch search results');
    const { searchResults } = await searchResultsResponse.json();

    // If search results are found (applicable ids), fetch their data
    if (searchResults?.length) {
      // Fetch data for search results using searchResults ids; if there are multiple ids, appDatas array will be returned, otherwise appData object.
      const resultsDataResponse = await fetch(`${baseUrl}/api/steam/${searchResults.map((game: { appid: number }) => game.appid).join(',')}`);
      if (!resultsDataResponse.ok) throw new Error('Failed to fetch results data');
      const { appDatas = [], appData = [] } = await resultsDataResponse.json();
      const resultsData = [...appDatas, appData].flat();
      
      // If we have the data for the results, setup data for CardGrid with sgdbImages being fetched if steam's image is not available
      if (resultsData.length) {
        categoryData = await Promise.all(
          resultsData
            .filter((game: SteamCategories) => game.id)
            .map(async (game: SteamCategories) => {
              const image = game.capsuleImage 
                ? game.capsuleImage 
                : (await fetch(`${baseUrl}/api/sgdb/${normalizeString(game.name, true)}`).then(res => res.json())).capsuleImage;
              return {
                category: 'Search Results',
                steamid: game.id,
                name: game.name,
                releaseDate: game.releaseDate,
                developer: game.developer,
                capsuleImage: image || { og: PLACEHOLDER_200X300 },
              };
            })
        );
        categoryData.reverse();
      }
    }

    return (
      <div className='flex justify-center items-start min-h-screen p-8 bg-zinc-900'>
        {categoryData?.length > 0 
          ? <div className="flex flex-col items-center justify-start p-8">
              <CardGrid categoryData={categoryData} />
            </div>
          : <h1 className="self-center text-white">No results found.</h1>
        }
      </div>
    );
  } catch (error) {
    console.error(error);
    return (
      <div className="flex justify-center items-center min-h-screen p-8 bg-zinc-900">
        <p className="text-white">Failed to load data. Please try again later.</p>
      </div>
    );
  }
}

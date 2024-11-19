import { headers } from "next/headers";
import CardGrid from "./components/grid/CardGrid";
import { getBlurDataURL } from "./utility/data";
import { normalizeString } from "./utility/strings";
import { CardCategories, GameCategories } from "./utility/types";
import { PLACEHOLDER_200X300 } from "./utility/constants";

export default async function Home() {
  const headersList = await headers();
  const baseUrl = headersList.get('x-base-url') || '';

  try {
    // Initializing CardGrids and fetch popular games and HoF games from OpenCritic
    let cardGridOne: CardCategories[] = [];
    let cardGridTwo: CardCategories[] = [];
    const ocData = await fetch(`${baseUrl}/api/opencritic/charts`, { next: { revalidate: 7200 } }).then(res => res.json()); // 2 hours

    // Fetch the data for popular and HoF games from Steam and merge it with the data from OpenCritic
    if (ocData.status === 200) {
      const [ steamPopDataResponse, steamHofDataResponse ] = await Promise.all([
        fetch(`${baseUrl}/api/steam/${ocData.popular.map((game: { name: string }) => normalizeString(game.name, true)).join(',')}`, { next: { revalidate: 300 } }),
        fetch(`${baseUrl}/api/steam/${ocData.hof.map((game: { name: string }) => normalizeString(game.name, true)).join(',')}`, { next: { revalidate: 300 } })
      ])
      const [ steamPopData, steamHofData ] = await Promise.all([ 
        steamPopDataResponse.json().then(data => data.appDatas),
        steamHofDataResponse.json().then(data => data.appDatas)
      ]);

      // Setup data for CardGrid with sgdbImages being fetched if steam's image is not available
      const mergeData = async (ocDataArr: GameCategories[], steamDataArr: GameCategories[]) => {
        return Promise.all(
          ocDataArr.map(async (ocGame) => {
            const steamGame = steamDataArr.find(game => normalizeString(game.name) === normalizeString(ocGame.name)) || undefined;
            const category = ocGame.category;
            const ocid = ocGame.id;
            const steamid = steamGame?.id || undefined;
            const name = ocGame.name || steamGame?.name || 'N/A';
            const releaseDate = ocGame.releaseDate || steamGame?.releaseDate || 'N/A';
            const developer = ocGame.developer || steamGame?.developer || 'N/A';
            const capsuleImage = steamGame?.capsuleImage || ocGame.capsuleImage || (await fetch(`${baseUrl}/api/sgdb/${normalizeString(ocGame.name, true)}`, { next: { revalidate: 600 } }).then(res => res.json())).capsuleImage;
            const og = capsuleImage || undefined;
            const blur = og ? await getBlurDataURL(og) : undefined;
            const image = og ? { og, blur } : { og: PLACEHOLDER_200X300, blur: undefined };
            return {
              category: category,
              ocid,
              steamid,
              name,
              releaseDate,
              developer,
              capsuleImage: image || { og: PLACEHOLDER_200X300 },
            };
          })
        );
      };

      cardGridOne = await mergeData(ocData.popular, steamPopData);
      cardGridTwo = await mergeData(ocData.hof, steamHofData);
    }
    
    // Fetch the charts data for top releases and most played list, then the data for top releases and most played games (all for Steam)
    if (ocData.status !== 200) {
      const { topReleases, mostPlayed } = await fetch(`${baseUrl}/api/steam/charts`, { next: { revalidate: 7200 } }).then(res => res.json()); // 2 hours
      const [topReleasesResponse, mostPlayedResponse] = await Promise.all([
        fetch(`${baseUrl}/api/steam/${topReleases[0].appids.slice(0, 10).join(',')}`, { next: { revalidate: 300 } }),
        fetch(`${baseUrl}/api/steam/${mostPlayed.slice(0, 10).map((game: { appid: number }) => game.appid).join(',')}`, { next: { revalidate: 300 } })
      ]);
      const [topReleasesData, mostPlayedData] = await Promise.all([
        topReleasesResponse.json().then(data => data.appDatas),
        mostPlayedResponse.json().then(data => data.appDatas)
      ]);
      topReleasesData.forEach((game: GameCategories) => game.category = topReleases[0].category);
      mostPlayedData.forEach((game: GameCategories) => game.category = mostPlayed[0].category);
  
      // Setup data for CardGrid with sgdbImages being fetched if steam's image is not available
      const setupGrid = async (data: GameCategories[]) => {
        return Promise.all(
          data.map(async (game: GameCategories) => {
            const og = game.capsuleImage || (await fetch(`${baseUrl}/api/sgdb/${normalizeString(game.name, true)}`, { next: { revalidate: 7200 } }).then(res => res.json())).capsuleImage || undefined;
            const blur = og ? await getBlurDataURL(og) : undefined;
            const image = og ? { og, blur } : { og: PLACEHOLDER_200X300, blur: undefined };
            return {
              category: game.category,
              steamid: game.id,
              name: game.name,
              releaseDate: game.releaseDate,
              developer: game.developer,
              capsuleImage: image || { og: PLACEHOLDER_200X300 },
            };
          })
        )
      };

      cardGridOne = await setupGrid(topReleasesData);
      cardGridTwo = await setupGrid(mostPlayedData);
    }

    return (
      <div className="flex justify-center items-start min-h-screen p-8 bg-zinc-900">
        <div className="flex flex-col items-center p-8">
          <CardGrid categoryData={cardGridOne}/>
          <CardGrid categoryData={cardGridTwo}/>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading data:', error);
    return (
      <div className="flex justify-center items-center min-h-screen p-8 bg-zinc-900">
        <div className="flex flex-col items-center p-8">
          <h1 className="text-6xl font-bold">Error loading data</h1>
          <p className="text-2xl">Please try again later.</p>
        </div>
      </div>
    );
  }
}


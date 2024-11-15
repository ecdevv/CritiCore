import { headers } from "next/headers";
import CardGrid from "./components/card/CardGrid";
import { CardCategories, SteamCategories } from "@/app/utility/types";
import { normalizeString } from "@/app/utility/helper";
import { PLACEHOLDER_200X300 } from "./utility/constants";

export default async function Home() {
  const headersList = await headers();
  const baseUrl = headersList.get('x-base-url') || '';

  try {
    // Fetch top releases and most played games from Steam
    const chartsResponse = await fetch(`${baseUrl}/api/steam/charts`);
    if (!chartsResponse.ok) throw new Error('Failed to fetch Steam charts');
    const { topReleases, mostPlayed } = await chartsResponse.json();

    // Fetch data for top releases and most played games
    const [topReleasesResponse, mostPlayedResponse] = await Promise.all([
      fetch(`${baseUrl}/api/steam/${topReleases[0].appids.slice(0, 10).join(',')}`),
      fetch(`${baseUrl}/api/steam/${mostPlayed.slice(0, 10).map((game: { appid: number }) => game.appid).join(',')}`)
    ]);
    if (!topReleasesResponse.ok || !mostPlayedResponse.ok) throw new Error('Failed to fetch game data');
    const [topReleasesData, mostPlayedData] = await Promise.all([
      topReleasesResponse.json().then(data => data.appDatas),
      mostPlayedResponse.json().then(data => data.appDatas)
    ]);

    // Get the grid images from SGDB
    const [sgdbTopData, sgdbMostData] = await Promise.all([
      topReleasesData?.length > 0 ? fetch(`${baseUrl}/api/sgdb/${topReleasesData.map((game: { name: string }) => normalizeString(game.name, true)).join(',')}`).then(res => res.json()) : Promise.resolve({}),
      mostPlayedData?.length > 0 ? fetch(`${baseUrl}/api/sgdb/${mostPlayedData.map((game: { name: string }) => normalizeString(game.name, true)).join(',')}`).then(res => res.json()) : Promise.resolve({}),
    ]);
    
    // Setup data for CardGrid
    const topReleasesDataFinal: CardCategories[] = topReleasesData.map((game: SteamCategories) => ({
      category: 'Top Releases',
      steamid: game.id,
      name: game.name,
      releaseDate: game.releaseDate,
      developer: game.developer,
      capsuleImage: game.capsuleImage || sgdbTopData.images[topReleasesData.indexOf(game)]?.capsuleImage || PLACEHOLDER_200X300,
    }));
    const mostPlayedDataFinal: CardCategories[] = mostPlayedData.map((game: SteamCategories) => ({
      category: 'Most Played',
      steamid: game.id,
      name: game.name,
      releaseDate: game.releaseDate,
      developer: game.developer,
      capsuleImage: game.capsuleImage || sgdbMostData.images[mostPlayedData.indexOf(game)]?.capsuleImage || PLACEHOLDER_200X300,
    }));


    return (
      <div className="flex justify-center items-start min-h-screen p-8 bg-zinc-900">
        <div className="flex flex-col items-center p-8">
          <CardGrid categoryData={topReleasesDataFinal}/>
          <CardGrid categoryData={mostPlayedDataFinal}/>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading data:', error);
    return (
      <div className="flex justify-center items-center min-h-screen p-8 bg-zinc-900">
        <p className="text-white">Failed to load data. Please try again later.</p>
      </div>
    );
  }
}


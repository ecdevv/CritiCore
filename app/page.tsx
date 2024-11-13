import { headers } from "next/headers";
import CardGrid from "./components/card/CardGrid";
import { TopCategories } from "@/app/utility/types"

export default async function Home() {
  const headersList = await headers();
  const baseUrl = headersList.get('x-base-url') || '';
  
  const response = await fetch(`${baseUrl}/api/steam`);
  const { topReleases, mostPlayed } = await response.json();
  
  const topReleasesData = topReleases[0].appids.slice(0, 10).map(async (appid: number) => {
    const gameResponse = await fetch(`${baseUrl}/api/steam/${appid}`);
    return await gameResponse.json();
  });
  const mostPlayedData = mostPlayed.slice(0, 10).map(async (game: { appid: number }) => {
    const gameResponse = await fetch(`${baseUrl}/api/steam/${game.appid}`);
    return await gameResponse.json();
  });
  const [topReleasesDataRes, mostPlayedDataRes] = await Promise.all([Promise.all(topReleasesData), Promise.all(mostPlayedData)]);
  
  const topReleasesDataFinal = topReleasesDataRes.map((game: TopCategories) => ({
    category: 'Top Releases',
    id: game.id,
    name: game.name,
    releaseDate: game.releaseDate,
    developer: game.developer,
    capsuleImage: game.capsuleImage,
  }));
  const mostPlayedDataFinal = mostPlayedDataRes.map((game: TopCategories) => ({
    category: 'Most Played',
    id: game.id,
    name: game.name,
    releaseDate: game.releaseDate,
    developer: game.developer,
    capsuleImage: game.capsuleImage,
  }));

  return (
    <div className="flex justify-center items-start min-h-screen p-8 bg-zinc-900">
      <div className="flex flex-col items-center p-8">
        <CardGrid categoryData={topReleasesDataFinal}/>
        <CardGrid categoryData={mostPlayedDataFinal}/>
      </div>
    </div>
  );
}


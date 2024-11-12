import { headers } from "next/headers";
import Image from "next/image";
import CardGrid from "./components/card/CardGrid";
import Link from "next/link";
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
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/game/the-witcher-3-wild-hunt"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </Link>
          <Link
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </Link>
        </div>
      </div>
    </div>
  );
}


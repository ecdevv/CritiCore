import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { normalizeString } from "./utility/strings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const ocData = await fetch(`${headersList.get('x-base-url')}/api/oc/charts`, { next: { revalidate: 7200 } }).then(res => res.json()); // 2 hours
  let ocGames = (!ocData || ocData.status !== 200) ? [] : (ocData.popular && ocData.hof) ? ocData.popular.concat(ocData.hof) : [];
  if (ocGames.length <= 0 && ocData.status === 200) {
    if (ocData.popular.length > 0) {
      ocGames = ocData.popular;
    } else if (ocData.hof.length > 0) { 
      ocGames = ocData.hof; 
    }
  }
  const { topReleases, mostPlayed } = await fetch(`${headersList.get('x-base-url')}/api/steam/charts`, { next: { revalidate: 7200 } }).then(res => res.json()); // 2 hours
  const [topReleasesResponse, mostPlayedResponse] = await Promise.all([
    fetch(`${headersList.get('x-base-url')}/api/steam/${topReleases[0].appids.slice(0, 10).join(',')}`, { next: { revalidate: 7200 } }),
    fetch(`${headersList.get('x-base-url')}/api/steam/${mostPlayed.slice(0, 10).map((game: { appid: number }) => game.appid).join(',')}`, { next: { revalidate: 7200 } })
  ]);
  const [topReleasesData, mostPlayedData] = await Promise.all([
    topReleasesResponse.json().then(data => data.appDatas),
    mostPlayedResponse.json().then(data => data.appDatas)
  ]);
  const steamGames = (!topReleasesData || !mostPlayedData) ? [] : topReleasesData.concat(mostPlayedData);
  const Games = [...ocGames, ...steamGames];

  // Fetch the data for popular and HoF games from Steam and merge it with the data from OpenCritic
  const gamesURLs = Games.flatMap((game) => ({
      url: `${headersList.get('x-base-url')}/game/${normalizeString(game.name, true)}`,
      lastModified: new Date(game.releaseDate as string),
    })
  );
  
  return [
    {
      url: `${headersList.get('x-base-url')}`,
      lastModified: new Date(),
    },
    ...(!Games || Games.length <= 0 ? [] : gamesURLs)
  ]
} 
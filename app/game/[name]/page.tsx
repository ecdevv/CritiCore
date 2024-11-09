import React from "react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { getScoreColorClass } from "@/app/utility/helper";

type reviewType = "critic" | "user" ;
type scores = {
  metacritic: { critic: number; user: number };
  opencritic: { critic: number; user: number };
  steam: { critic: number; user: number };
};

export default async function Game({ params, searchParams = { type: "critic" } }: { params: { name: string }, searchParams?: { type: reviewType } }) {
  const headersList = await headers();
  const baseUrl = headersList.get('x-base-url') || '';
  const reviewType = (await searchParams).type as reviewType;
  const name = (await params).name || '';

  const ocResponse = await fetch(`${baseUrl}/api/opencritic?gameName=${name}`);
  const ocData = await ocResponse.json();
  const steamResponse = await fetch(`${baseUrl}/api/steam?gameName=${name}`);
  const steamData = await steamResponse.json();
  const responseStatus = ocData.status === 200 || steamData.status === 200 ? 200 : 404;
  const displayName = ocData.name || steamData.name || name;
  const releaseDate = ocData.releaseDate || steamData.releaseDate || '';
  const developer = ocData.developer || steamData.developer || '';
  const publisher = ocData.publisher || steamData.publisher|| '';
  const image = ocData.image || steamData.image || '';
  
  const scores = {
    metacritic: { critic: 85, user: 75 },
    opencritic: { critic: ocData.criticScore, user: ocData.criticScore },
    steam: { critic: steamData.score, user: steamData.score },
  };

  const calculateAggregateScore = (scores: scores): { critic: number; user: number } => {
    const validScores = Object.entries(scores).filter(([_, { critic, user }]) => critic >= 0 && user >= 0);

    if (validScores.length === 0) {
      return { critic: -1, user: -1 };
    }

    const { critic: criticSum, user: userSum } = validScores.reduce(
      (acc, [_, { critic, user }]) => ({
        critic: acc.critic + (critic >= 0 ? critic : 0),
        user: acc.user + user,
      }),
      { critic: 0, user: 0 }
    );

    const criticAverage = Math.round(criticSum / validScores.length);
    const userAverage = Math.round(userSum / validScores.length);

    return { critic: criticAverage, user: userAverage };
  };

  const currentScores = reviewType === "user"
    ? {
        metacritic: scores.metacritic.user,
        opencritic: scores.opencritic.user,
        steam: scores.steam.user,
        aggregate: calculateAggregateScore(scores).user,
      }
    : {
        metacritic: scores.metacritic.critic,
        opencritic: scores.opencritic.critic,
        steam: scores.steam.critic,
        aggregate: calculateAggregateScore(scores).critic,
      };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-5 bg-zinc-900">
      <h1 className="text-4xl font-bold tracking-wide text-white">{responseStatus === 200 ? displayName : "Invalid Page"}</h1>
      {responseStatus === 200 && (
        <>
          <p className='mt-[-10px] text-white tracking-wide'>Released on <strong>{releaseDate}</strong> by <strong>{developer}</strong></p>
          {/* {(steamAgeRating >= 18 || steamAgeRating === 0) && 
            <p className="text-white">18+</p>
          } */}
          <Image 
            src={image} 
            alt={displayName} 
            width={460}
            height={215}
            className="mt-[-10px] w-[460px] h-[215px] rounded-lg"
          />
          <Link
            href={`?${new URLSearchParams({ type: reviewType === "user" ? "critic" : "user" })}`}
            className="text-center px-4 py-2 text-2xl font-semibold text-white tracking-wide rounded border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950 transition-all duration-100 ease-in-out"
          >
            {`${reviewType === "user" ? "User" : " Critic"} Scores`}
          </Link>
          <div className="grid grid-cols-2 gap-8 text-center text-white">
            <div className={`${getScoreColorClass(currentScores.metacritic)} p-4 rounded-lg`}>
              <h2 className="text-lg font-semibold">Metacritic</h2>
              <p className="text-5xl font-bold">{currentScores.metacritic >= 0 ? currentScores.metacritic : 'N/A'}</p>
            </div>
            <Link href={`${ocData.url}`} target="_blank" rel="noopener noreferrer" className={`${getScoreColorClass(currentScores.opencritic, true)} p-4 rounded-lg`}>
              <h2 className="text-lg font-semibold">OpenCritic</h2>
              <p className="text-5xl font-bold">{currentScores.opencritic >= 0 ? currentScores.opencritic : 'N/A'}</p>
            </Link>
            <Link href={`${steamData.storeUrl}${steamData.id}`} target="_blank" rel="noopener noreferrer" className={`${getScoreColorClass(currentScores.steam, true)} p-4 rounded-lg`}>
              <h2 className="text-lg font-semibold">Steam</h2>
              <p className="text-5xl font-bold">{currentScores.steam >= 0 ? `${currentScores.steam}%` : 'N/A'}</p>
            </Link>
            <div className={`${getScoreColorClass(currentScores.aggregate)} p-4 rounded-lg`}>
              <h2 className="text-lg font-semibold">Aggregate</h2>
              <p className="text-5xl font-bold">{currentScores.aggregate >= 0 ? currentScores.aggregate : 'N/A'}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white">*Steam reviews are users only; aggregated critic scores exclude Steam</p>
        </>
      )}
    </div>
  );
}


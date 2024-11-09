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

  // Fetching API data from Metacritic, OpenCritic, and Steam. OpenCritic API is limited to 25 searches per day and 200 requests per day, so usually using dummy data
  // const ocResponse = await fetch(`${baseUrl}/api/opencritic?gameName=${name}`);
  // const ocData = await ocResponse.json();
  const ocData = { status: 400, name: '', releaseDate: '', developer: '', publisher: '', image: '', criticScore: -1, userScore: -1, totalCriticReviews: 100, totalUserReviews: -1, url: 'https://opencritic.com' };
  const steamResponse = await fetch(`${baseUrl}/api/steam?gameName=${name}`);
  const steamData = await steamResponse.json();
  const responseStatus = ocData.status === 200 || steamData.status === 200 ? 200 : 404;
  const displayName = ocData.name || steamData.name || '';
  const releaseDate = ocData.releaseDate || steamData.releaseDate || '';
  const developer = ocData.developer || steamData.developer || '';
  const publisher = ocData.publisher || steamData.publisher|| '';
  const image = ocData.image || steamData.image || '';
  const validScores = ocData.criticScore >= 0 || ocData.userScore >= 0 || steamData.userScore >= 0;
  
  const scores = {
    metacritic: { critic: 85, user: 75 },
    opencritic: { critic: ocData.criticScore, user: ocData.userScore },
    steam: { critic: steamData.criticScore, user: steamData.userScore },
  };

  // Calculating aggregate score
  const calculateAggregateScore = (scores: scores): { critic: number; user: number } => {
    // Filter out scores that are not available;
    // Also manually filter out steam and opencritic scores for critic and user scores respectively
    // The manual filtering is only needed if we want to do critic === user scores for display purposes since steam only has user scores and opencritic only has critic scores
    const validCriticScores = Object.entries(scores).filter(([key, { critic }]) => key !== 'steam' && critic >= 0);
    const validUserScores = Object.entries(scores).filter(([key, { user }]) => key !== 'opencritic' && user >= 0);

    const criticAverage = validCriticScores.length > 0
      ? Math.round(validCriticScores.reduce((sum, [_, { critic }]) => sum + critic, 0) / validCriticScores.length)
      : -1;

    const userAverage = validUserScores.length > 0
      ? Math.round(validUserScores.reduce((sum, [_, { user }]) => sum + user, 0) / validUserScores.length)
      : -1;

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
    <div className='flex justify-center items-center min-h-screen p-8 bg-zinc-900'>
      <div className="inline-flex flex-col justify-center items-center p-8 gap-5">
        <h1 className="text-4xl font-bold tracking-wide text-white">{(responseStatus === 200 && validScores) ? displayName : "Invalid Page"}</h1>
        {(responseStatus === 200 && validScores) && (
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
              <div className={`${getScoreColorClass(currentScores.metacritic)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg`}>
                <h2 className="text-lg font-semibold">Metacritic</h2>
                <p className="text-5xl font-bold">{currentScores.metacritic >= 0 ? currentScores.metacritic : 'N/A'}</p>
              </div>
              {ocData.status !== 200 || currentScores.opencritic < 0 ? (
                <div className={`${getScoreColorClass(currentScores.opencritic, true)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg`}>
                  <h2 className="text-lg font-semibold">OpenCritic</h2>
                  <p className="text-5xl font-bold">{currentScores.opencritic >= 0 ? currentScores.opencritic : 'N/A'}</p>
                </div>
              ) : (
                <Link href={`${ocData.url}`} target="_blank" rel="noopener noreferrer" className={`${getScoreColorClass(currentScores.opencritic, true)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg`}>
                  <h2 className="text-lg font-semibold">OpenCritic</h2>
                  <p className="text-5xl font-bold">{currentScores.opencritic >= 0 ? currentScores.opencritic : 'N/A'}</p>
                </Link>
              )}
              {steamData.status !== 200 || currentScores.steam < 0 ? (
                <div className={`${getScoreColorClass(currentScores.steam, true)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg`}>
                  <h2 className="text-lg font-semibold">Steam</h2>
                  <p className="text-5xl font-bold">{currentScores.steam >= 0 ? `${currentScores.steam}%` : 'N/A'}</p>
                </div>
              ) : (
                <Link href={`${steamData.url}`} target="_blank" rel="noopener noreferrer" className={`${getScoreColorClass(currentScores.steam, true)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg`}>
                  <h2 className="text-lg font-semibold">Steam</h2>
                  <p className="text-5xl font-bold">{currentScores.steam >= 0 ? `${currentScores.steam}%` : 'N/A'}</p>
                </Link>
              )}
              <div className={`${getScoreColorClass(currentScores.aggregate)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg`}>
                <h2 className="text-lg font-semibold">Aggregate</h2>
                <p className="text-5xl font-bold">{currentScores.aggregate >= 0 ? currentScores.aggregate : 'N/A'}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white text-center">
              *Due to API call limits from OpenCritic, some critic scores may not load if limits are reached.<br />We recommend checking back later if data appears unavailable.
            </p>
          </>
        )}
      </div>
    </div>
  );
}


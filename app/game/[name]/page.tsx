import React from "react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { getScoreColorClass } from "@/app/utility/helper";

type reviewType = "all" | "critic" | "user" ;
type scores = {
  opencritic: { critic: number; user: number };
  steam: { critic: number; user: number };
};

export default async function Game({ params, searchParams }: { params: { name: string }, searchParams: { type: reviewType } }) {
  
  const headersList = await headers();
  const baseUrl = headersList.get('x-base-url') || '';
  const reviewType = (await searchParams).type as reviewType || 'all';
  const name = (await params).name || '';

  // Fetching API data from Metacritic, OpenCritic, and Steam. OpenCritic API is limited to 25 searches per day and 200 requests per day, so usually using dummy data
  // const ocResponse = await fetch(`${baseUrl}/api/opencritic?gameName=${name}`);
  // const ocData = await ocResponse.json();
  const ocData = { status: 200, name: '', releaseDate: '', developer: '', publisher: '', image: '', criticScore: 88, userScore: -1, totalCriticReviews: 100, totalUserReviews: -1, url: 'https://opencritic.com' };
  const steamResponse = await fetch(`${baseUrl}/api/steam?gameName=${name}`);
  const steamData = await steamResponse.json();
  const sgdbResponse = await fetch(`${baseUrl}/api/sgdb?gameName=${name}`);
  const sgdbData = await sgdbResponse.json();
  const responseStatus = ocData.status === 200 || steamData.status === 200 ? 200 : 404;
  const displayName = ocData.name || steamData.name || '';
  const releaseDate = ocData.releaseDate || steamData.releaseDate || '';
  const developer = ocData.developer || steamData.developer || '';
  const publisher = ocData.publisher || steamData.publisher|| '';
  const ageRating = steamData.ageRating || '';
  const image = sgdbData.image || ocData.image || steamData.image || '';
  const ocUrl = ocData.url || '';
  const steamUrl = steamData.url || '';
  const devUrl = steamData.devUrl || '';

  const validScores = ocData.criticScore >= 0 || ocData.userScore >= 0 || steamData.criticScore >= 0 || steamData.userScore >= 0;
  
  const scores = {
    opencritic: { critic: ocData.criticScore, user: ocData.userScore },
    steam: { critic: steamData.criticScore, user: steamData.userScore },
  };

  // Calculating aggregate score
  const calculateAggregateScore = (scores: scores): { critic: number; user: number; overall: number } => {
    // Filter out scores that are not available;
    const validCriticScores = Object.entries(scores).filter(([, { critic }]) => critic >= 0);
    const validUserScores = Object.entries(scores).filter(([, { user }]) => user >= 0);
    const allValidScores = Object.entries(scores).flatMap(([_, { critic, user }]) => [critic, user].filter(score => score >= 0));
    
    const criticAverage = validCriticScores.length > 0
      ? Math.round(validCriticScores.reduce((sum, [_, { critic }]) => sum + critic, 0) / validCriticScores.length)
      : -1;
    const userAverage = validUserScores.length > 0
      ? Math.round(validUserScores.reduce((sum, [_, { user }]) => sum + user, 0) / validUserScores.length)
      : -1;
    const overallAverage = allValidScores.length > 0
      ? Math.round(allValidScores.reduce((sum, score) => sum + score, 0) / allValidScores.length)
      : -1;

    return { critic: criticAverage, user: userAverage, overall: overallAverage };
  };

  const currentScores = reviewType === "all"
    ? {
        opencritic: scores.opencritic.critic,
        steam: scores.steam.user,
        aggregate: calculateAggregateScore(scores).overall,
      }
    : reviewType === "user"
    ? {
        opencritic: scores.opencritic.user,
        steam: scores.steam.user,
        aggregate: calculateAggregateScore(scores).user,
      }
    : {
        opencritic: scores.opencritic.critic,
        steam: scores.steam.critic,
        aggregate: calculateAggregateScore(scores).critic,
      };

  return (
    <div className='flex justify-center items-center min-h-screen p-8 bg-zinc-900'>
      <div className="flex justify-center items-center p-8 gap-12">
        {(responseStatus === 200 && validScores) && (
          <Link href={devUrl} target="_blank" rel="noopener noreferrer" >
            <Image 
              src={image}
              alt={displayName} 
              width={450}
              height={675}
              className={`border-[1px] border-black shadow-vertical-card rounded-xl transition-all duration-200 ease-in-out hover:cursor-pointer hover:opacity-60`}
              priority
              loading="eager"
            />
          </Link>
        )}
          <div className="w-[700px] flex flex-col justify-center items-center p-8 gap-5">
            <h1 className="text-4xl font-bold text-white text-center tracking-wide">{(responseStatus === 200 && validScores) ? displayName : "Invalid Page"}</h1>
            {(responseStatus === 200 && validScores) && (
              <>
                <p className='text-white tracking-wide'>Released on <strong>{releaseDate}</strong> by <strong>{developer}</strong></p>
                  {/* {(steamAgeRating >= 18 || steamAgeRating === 0) && 
                    <p className="text-white">18+</p>
                  } */}
                <Link
                  href={`?${new URLSearchParams({ type: ["all", "critic", "user"][(["all", "critic", "user"].indexOf(reviewType) + 1) % 3] })}`}
                  className="text-center px-4 py-2 text-2xl font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800 hover:bg-[#151517] transition-all duration-100 ease-in-out"
                >
                  {`${reviewType === "all" ? "All Review" : reviewType === "user" ? "User" : " Critic"} Scores`}
                </Link>
                <div className="flex gap-8 text-center text-white">
                  {ocData.status !== 200 || currentScores.opencritic < 0 ? (
                    <div className={`${getScoreColorClass(currentScores.opencritic, true)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg shadow-box-card border-[1px] border-zinc-800`}>
                      <h2 className="text-lg font-semibold">OpenCritic</h2>
                      <p className="text-5xl font-bold">{currentScores.opencritic >= 0 ? currentScores.opencritic : 'N/A'}</p>
                    </div>
                  ) : (
                    <Link href={`${ocUrl}`} target="_blank" rel="noopener noreferrer" className={`${getScoreColorClass(currentScores.opencritic, true)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg shadow-box-card border-[1px] border-zinc-800`}>
                      <h2 className="text-lg font-semibold">OpenCritic</h2>
                      <p className="text-5xl font-bold">{currentScores.opencritic >= 0 ? currentScores.opencritic : 'N/A'}</p>
                    </Link>
                  )}
                  {steamData.status !== 200 || currentScores.steam < 0 ? (
                    <div className={`${getScoreColorClass(currentScores.steam, true)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg shadow-box-card border-[1px] border-zinc-800`}>
                      <h2 className="text-lg font-semibold">Steam</h2>
                      <p className="text-5xl font-bold">{currentScores.steam >= 0 ? `${currentScores.steam}%` : 'N/A'}</p>
                    </div>
                  ) : (
                    <Link href={`${steamUrl}`} target="_blank" rel="noopener noreferrer" className={`${getScoreColorClass(currentScores.steam, true)} flex flex-col justify-center items-center w-[125px] aspect-[20/19] p-3 rounded-lg shadow-box-card border-[1px] border-zinc-800`}>
                      <h2 className="text-lg font-semibold">Steam</h2>
                      <p className="text-5xl font-bold">{currentScores.steam >= 0 ? `${currentScores.steam}%` : 'N/A'}</p>
                    </Link>
                  )}
                </div>
                <div className={`${getScoreColorClass(currentScores.aggregate)} flex flex-col justify-center items-center w-[145px] aspect-[20/19] p-3 rounded-xl shadow-box-card border-[1px] border-zinc-800`}>
                  <h2 className="text-xl font-semibold">Aggregate</h2>
                  <p className="text-6xl font-bold">{currentScores.aggregate >= 0 ? currentScores.aggregate : 'N/A'}</p>
                </div>
                <p className="mt-4 text-sm text-white text-center">
                  *Due to API call limits from OpenCritic, some critic scores may not load if limits are reached.<br />We recommend checking back later if data appears unavailable.
                </p>
              </>
            )}
          </div>
      </div>
    </div>
  );
}


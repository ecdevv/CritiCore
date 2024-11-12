import React from "react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import ScoreBox from "@/app/components/score/ScoreBox";
import OCDataCard from "./OCDataCard";
import SteamDataCard from "./SteamDataCard";

type ReviewType = "all" | "critic" | "user" ;
type DisplayType = "none" | "opencritic" | "steam";
type Scores = {
  opencritic: { critic: number; user: number };
  steam: { critic: number; user: number };
};

export default async function Game({ params, searchParams }: { params: { name: string }, searchParams: { type: ReviewType, display: DisplayType } }) {
  const headersList = await headers();
  const baseUrl = headersList.get('x-base-url') || '';
  const pathname = headersList.get('x-pathname') || '';
  const referer = headersList.get('referer') || '';
  const reviewType = (await searchParams).type as ReviewType || 'all';
  const displayType = (await searchParams).display as DisplayType || 'none';
  const name = (await params).name || '';

  // Fetching API data from Metacritic, OpenCritic, and Steam. OpenCritic API is limited to 25 searches per day and 200 requests per day, so usually using dummy data
  // const ocResponse = await fetch(`${baseUrl}/api/opencritic?name=${name}`);
  // const ocData = await ocResponse.json();
  const ocData = {status: 200, name: undefined, releaseDate: undefined, developer: undefined, capsuleImage: undefined, 
    hasLootBoxes: true, percentRec: 74, criticScore: 81, userScore: -1, totalCriticReviews: 84, totalUserReviews: -1, 
    tier: { name: 'Strong', url: 'https://' + process.env.OPENCRITIC_IMG_HOST + '/mighty-man/' + 'strong' + '-man.png' 
  }};
  const steamResponse = await fetch(`${baseUrl}/api/steam?${new URLSearchParams({ name, display: displayType })}`);
  const steamData = await steamResponse.json();
  const sgdbResponse = await fetch(`${baseUrl}/api/sgdb?${new URLSearchParams({ name })}`);
  const sgdbData = await sgdbResponse.json();
  const responseStatus = ocData.status === 200 || steamData.status === 200 ? 200 : 404;
  const displayName = ocData.name || steamData.name || 'N/A';
  const releaseDate = ocData.releaseDate || steamData.releaseDate || 'N/A';
  const developer = ocData.developer || steamData.developer || 'N/A';
  const capsuleImage = steamData.capsuleImage || ocData.capsuleImage || sgdbData.capsuleImage || '/';
  const validScores = ocData.criticScore >= 0 || ocData.userScore >= 0 || steamData.criticScore >= 0 || steamData.userScore >= 0;
  
  const scores = {
    opencritic: { critic: ocData.criticScore, user: ocData.userScore },
    steam: { critic: steamData.criticScore, user: steamData.userScore },
  };

  // Calculating aggregate score
  const calculateAggregateScore = (scores: Scores): { critic: number; user: number; overall: number } => {
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
      {(responseStatus === 200 && validScores) ? (
        <>
          <div className="flex justify-center items-center p-8 gap-12">
            <Link href={capsuleImage} target="_blank" rel="noopener noreferrer" >
              <Image 
                src={capsuleImage}
                alt={displayName} 
                width={450}
                height={675}
                className={`border-[1px] border-zinc-900 shadow-vertical-card rounded-xl transition-all duration-200 ease-in-out hover:cursor-pointer hover:opacity-50`}
                priority
                loading="eager"
              />
            </Link>
            {(displayType === 'none') && (
              <div className="w-[700px] flex flex-col justify-center items-center p-8 gap-5">
                <h1 className="text-4xl font-bold text-white text-center tracking-wide">{displayName}</h1>
                <p className='text-white tracking-wide'>Released on <strong>{releaseDate}</strong> by <strong>{developer}</strong></p>
                <Link
                  href={`?${new URLSearchParams({ type: ["all", "critic", "user"][(["all", "critic", "user"].indexOf(reviewType) + 1) % 3] })}`}
                  replace
                  className="text-center px-4 py-2 text-2xl font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800 hover:bg-[#151517] transition-all duration-100 ease-in-out"
                >
                  {`${reviewType === "all" ? "All Review" : reviewType === "user" ? "User" : " Critic"} Scores`}
                </Link>
                <div className="flex gap-8 text-center text-white">
                  <ScoreBox status={ocData.status} url={`?${new URLSearchParams({ display: 'opencritic'})}`} score={currentScores.opencritic}>OpenCritic</ScoreBox>
                  <ScoreBox status={steamData.status} url={`?${new URLSearchParams({ display: 'steam'})}`} score={currentScores.steam}>Steam</ScoreBox>
                </div>
                <ScoreBox status={-1} score={currentScores.aggregate} textXL={true} className='flex flex-col justify-center items-center w-[145px] aspect-[20/19] p-3 rounded-xl shadow-box-card border-[1px] border-zinc-800 text-center text-white'>Aggregate</ScoreBox>
                <p className="mt-4 text-sm text-white text-center">
                  *Due to API call limits from OpenCritic, some critic scores may not load if limits are reached.<br />We recommend checking back later if data appears unavailable.
                </p>
              </div>
            )}
            {displayType === 'opencritic' &&
              <OCDataCard pathname={pathname} referer={referer} data={ocData} name={displayName} releaseDate={releaseDate} developer={developer} currentScore={currentScores.opencritic} />
            }
            {displayType === 'steam' &&
              <SteamDataCard pathname={pathname} referer={referer} data={steamData} name={displayName} releaseDate={releaseDate} developer={developer} currentScore={currentScores.steam} />
            }
          </div>
        </>
      ) : (
        <h1 className="text-4xl font-bold text-white text-center tracking-wide">Invalid Page</h1>
      )}
    </div>
  );
}


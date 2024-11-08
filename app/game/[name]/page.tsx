import React from "react";
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

  const steamResponse = await fetch(`${baseUrl}/api/steam?gameName=${(await params).name}`);
  const steamData = await steamResponse.json();
  const steamDataStatus = steamData.status;
  const steamScore = Math.floor(steamData.reviewScore * 100) as number;
  const steamAgeRating = steamData.ageRating as number;
  const appName = steamData.appName as string;

  const scores = {
    metacritic: { critic: 85, user: 75 },
    opencritic: { critic: 88, user: 78 },
    steam: { critic: steamScore, user: steamScore },
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
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-900">
      {(steamAgeRating >= 18 || steamAgeRating === 0) && 
        <p className="text-lg text-white mb-4">18+</p>
      }
      <h1 className="text-4xl font-bold tracking-wide mb-8 text-white">{steamDataStatus === 200 ? appName : "Invalid Page"}</h1>
      {steamDataStatus === 200 && (
        <>
          <div className="flex items-center justify-center gap-4 mb-8">
            <h2 className="text-2xl font-semibold text-white">{`${reviewType === "user" ? "User" : " Critic"} Scores`}</h2>
            <Link
              href={`?${new URLSearchParams({ type: reviewType === "user" ? "critic" : "user" })}`}
              className="max-w-[135px] text-center px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600 transition-all duration-100 ease-in-out"
            >
              Toggle to {reviewType === "user" ? "Critic" : "User"} Reviews
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 text-center">
            <div className={`${getScoreColorClass(currentScores.metacritic)} p-4 rounded-lg`}>
              <h2 className="text-lg font-semibold">Metacritic</h2>
              <p className="text-5xl font-bold">{currentScores.metacritic >= 0 ? currentScores.metacritic : 'N/A'}</p>
            </div>
            <div className={`${getScoreColorClass(currentScores.opencritic)} p-4 rounded-lg`}>
              <h2 className="text-lg font-semibold">OpenCritic</h2>
              <p className="text-5xl font-bold">{currentScores.opencritic >= 0 ? currentScores.opencritic : 'N/A'}</p>
            </div>
            <div className={`${getScoreColorClass(currentScores.steam)} p-4 rounded-lg`}>
              <h2 className="text-lg font-semibold">Steam</h2>
              <p className="text-5xl font-bold">{currentScores.steam >= 0 ? `${currentScores.steam}%` : 'N/A'}</p>
            </div>
            <div className={`${getScoreColorClass(currentScores.aggregate)} p-4 rounded-lg`}>
              <h2 className="text-lg font-semibold">Aggregate</h2>
              <p className="text-5xl font-bold">{currentScores.aggregate >= 0 ? currentScores.aggregate : 'N/A'}</p>
            </div>
          </div>
          <p className="text-sm mt-8 text-white">*Steam reviews are users only; aggregated critic scores exclude Steam</p>
        </>
      )}
    </div>
  );
}


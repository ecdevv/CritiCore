import React from "react";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

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

  const steamScoreResponse = await fetch(`${baseUrl}/api/steam?gameName=${(await params).name}`);
  const steamScoreData = await steamScoreResponse.json();
  const steamScore = Math.floor(steamScoreData.reviewScore * 100) as number;
  const appName = steamScoreData.appName as string;

  const scores = {
    metacritic: { critic: 85, user: 75 },
    opencritic: { critic: 88, user: 78 },
    steam: { critic: steamScore, user: steamScore },
  };

  const aggregateScore = (scores: scores) => {
    const total = Object.entries(scores).reduce(
      (acc, [key, { critic, user }]) => ({
        critic: acc.critic + (key === "steam" ? 0 : critic),
        user: acc.user + user,
      }),
      { critic: 0, user: 0 }
    );

    const entriesCount = Object.keys(scores).length - 1; // Do not count 'steam' for critic
    return {
      critic: Math.round(total.critic / entriesCount),
      user: Math.round(total.user / Object.keys(scores).length),
    };
  };

  const currentScores = reviewType === "user"
    ? {
        metacritic: scores.metacritic.user,
        opencritic: scores.opencritic.user,
        steam: scores.steam.user,
        aggregate: aggregateScore(scores).user,
      }
    : {
        metacritic: scores.metacritic.critic,
        opencritic: scores.opencritic.critic,
        steam: scores.steam.critic,
        aggregate: aggregateScore(scores).critic,
      };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-950">
      <h1 className="text-4xl font-bold tracking-wide mb-8 text-white">{appName !== '' ? appName : "Invalid Page"}</h1>
      {appName !== '' && (
        <>
          <div className="flex items-center justify-center gap-4 mb-8">
            <h2 className="text-2xl font-semibold text-white">Critic Scores</h2>
            <Link
              href={`?${new URLSearchParams({ type: reviewType === "user" ? "critic" : "user" })}`}
              className="max-w-[135px] text-center px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-700"
            >
              Toggle to {reviewType === "user" ? "Critic" : "User"} Reviews
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8 text-center">
            <div className="bg-zinc-900 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-white">Metacritic</h2>
              <p className="text-5xl font-bold text-white">{currentScores.metacritic}</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-white">OpenCritic</h2>
              <p className="text-5xl font-bold text-white">{currentScores.opencritic}</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-white">Steam</h2>
              <p className="text-5xl font-bold text-white">{currentScores.steam}%</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-white">Aggregate</h2>
              <p className="text-5xl font-bold text-white">{currentScores.aggregate}</p>
            </div>
          </div>
          <p className="text-sm mt-8 text-white">*Steam reviews are users only; aggregated critic scores exclude Steam</p>
        </>
      )}
    </div>
  );
}


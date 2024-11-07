import React from "react";
import { headers } from "next/headers";

type scores = {
  metacritic: { critic: number; user: number };
  opencritic: { critic: number; user: number };
  steam: { critic: number; user: number };
};

export default async function Game({ params }: { params: { name: string } }) {
  const headersList = await headers();
  const baseUrl = headersList.get('x-base-url') || '';
  const resolvedParams = await params;

  const steamScoreResponse = await fetch(`${baseUrl}/api/steam?gameName=${resolvedParams.name}`);
  const steamScoreData = await steamScoreResponse.json();
  const steamScore = Math.floor(steamScoreData.reviewScore * 100) as number;
  const appName = steamScoreData.appName as string;

  const showUserReviews = false;
  
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

  const currentScores = showUserReviews
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

  // const [showUserReviews, setShowUserReviews] = useState<boolean>(false);

  // const toggleReviewType = () => {
  //   setShowUserReviews((prev) => !prev);
  // };

  // Placeholder scores, replace with actual API calls or logic to fetch scores

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">
        {appName !== '' ? appName : "Invalid Page"}
      </h1>
      {appName !== '' && (
        <>
          <h2 className='text-lg font-bold mb-4'>{showUserReviews ? "User" : "Critic"} Scores</h2>
          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div>
              <h2 className="text-lg font-semibold">Metacritic</h2>
              <p>{currentScores.metacritic}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">OpenCritic</h2>
              <p>{currentScores.opencritic}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Steam</h2>
              <p>{currentScores.steam}%</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Aggregate</h2>
              <p>{currentScores.aggregate}</p>
            </div>
          </div>
          <p className='text-sm'>*Steam reviews are users only; aggregated critic scores exclude Steam</p>
        </>
      )}
        

      {/* <button
        className="mt-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={toggleReviewType}
      >
        Toggle to {showUserReviews ? "Critic" : "User"} Reviews
      </button> */}
    </div>
  );
}


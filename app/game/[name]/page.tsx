import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import ScoreBox from "@/app/components/score/ScoreBox";
import OCDataCard from "./OCDataCard";
import SteamDataCard from "./SteamDataCard";
import { getBlurDataURL } from "@/app/utility/data";
import { capitalizeFirstLetter } from "@/app/utility/strings";
import { PLACEHOLDER_450X675 } from "@/app/utility/constants";

type ReviewType = "all" | "critic" | "user" ;
type DisplayType = "none" | "opencritic" | "steam";
type Scores = {
  opencritic: { critic: number; user: number };
  steam: { critic: number; user: number };
};

interface GameProps {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ type: ReviewType; display: DisplayType }>;
}

export default async function Game({ params, searchParams }: GameProps) {
  const headersList = await headers();
  const baseURL = headersList.get('x-base-url') || '';
  const pathname = headersList.get('x-pathname') || '';
  const referer = headersList.get('referer') || '';
  const reviewType = (await searchParams).type as ReviewType || 'all';
  const displayType = (await searchParams).display as DisplayType || 'none';
  const name = (await params).name || '';

  try {
    // Fetching API data from OpenCritic, Steam, and SGDB. OpenCritic API is limited to 25 searches per day and 200 requests per day, so usually using dummy data
    const [ocData, steamData] = await Promise.all([
      fetch(`${baseURL}/api/oc/${name}`, { next: { revalidate: 300 } }).then(res => res.json()),
      fetch(`${baseURL}/api/steam/${name}`, { next: { revalidate: 300 } }).then(res => res.json())
    ]);
    const responseStatus = ocData.status === 200 || steamData.status === 200 ? 200 : 404;
    const displayName = ocData.name || steamData.name || 'N/A';
    const releaseDate = ocData.releaseDate || steamData.releaseDate || 'N/A';
    const released = releaseDate !== 'N/A' && new Date(releaseDate) < new Date();
    const developer = ocData.developer || steamData.developer || 'N/A';
    const capsuleImage = steamData.capsuleImage || ocData.capsuleImage || (await fetch(`${baseURL}/api/sgdb/${name}`, { next: { revalidate: 7200 } }).then(res => res.json())).capsuleImage;  // 2 hours
    const capsuleImageBlur = capsuleImage ? await getBlurDataURL(capsuleImage) : undefined;
    const image = capsuleImage ? { og: capsuleImage, blur: capsuleImageBlur } : { og: PLACEHOLDER_450X675, blur: undefined };
    
    const scores = {
      opencritic: { critic: ocData.criticScore, user: ocData.userScore },
      steam: { critic: steamData.criticScore, user: steamData.userScore },
    };

    // Calculating aggregate score
    const calculateAggregateScore = (scores: Scores): { critic: number | null; user: number | null; overall: number | null } => {
      // Filter out scores that are not available;
      const validCriticScores = Object.entries(scores).filter(([, { critic }]) => critic && critic >= 0);
      const validUserScores = Object.entries(scores).filter(([, { user }]) => user && user >= 0);
      const allValidScores = Object.entries(scores).flatMap(([, { critic, user }]) => [critic, user].filter(score => score && score >= 0));
      
      const criticAverage = validCriticScores.length > 0
        ? Math.round(validCriticScores.reduce((sum, [, { critic }]) => sum + critic, 0) / validCriticScores.length)
        : null;
      const userAverage = validUserScores.length > 0
        ? Math.round(validUserScores.reduce((sum, [, { user }]) => sum + user, 0) / validUserScores.length)
        : null;
      const overallAverage = allValidScores.length > 0
        ? Math.round(allValidScores.reduce((sum, score) => sum + score, 0) / allValidScores.length)
        : null;

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
        {(responseStatus === 200) ? (
          <>
            <section className="flex justify-center items-center p-8 gap-12">
              <Link href={image.og || ''} target="_blank" rel="noopener noreferrer" >
                <Image 
                  src={image.og}
                  alt={displayName} 
                  width={450}
                  height={675}
                  priority
                  placeholder={image.blur ? 'blur' : 'empty'}
                  blurDataURL={image.blur ? image.blur : undefined}    
                  className={`border-[1px] border-zinc-900 shadow-vertical-card rounded-xl transition-all duration-200 ease-in-out hover:cursor-pointer hover:opacity-50`}
                />
              </Link>
              {(displayType === 'none') && (
                <div className="w-[725px] flex flex-col justify-center items-center p-8 gap-5">
                  <h1 className="text-4xl font-bold text-white text-center tracking-wide">{displayName}</h1>
                  { isNaN(new Date(releaseDate).getTime()) ? (
                    <p className='text-white tracking-wide'>
                      <strong>{capitalizeFirstLetter(releaseDate) || 'Invalid Date'}</strong> by <strong>{developer}</strong>
                    </p>
                  ) : released ? (
                    <p className='text-white tracking-wide'>
                      Released on <strong>{releaseDate}</strong> by <strong>{developer}</strong>
                    </p>
                  ) : (
                    <p className='text-white tracking-wide'>
                      Releasing on <strong>{releaseDate}</strong> by <strong>{developer}</strong>
                    </p>
                  )}
                  <Link
                    href={`?${new URLSearchParams({ type: ["all", "critic", "user"][(["all", "critic", "user"].indexOf(reviewType) + 1) % 3] })}`}
                    replace
                    scroll={false}
                    className="text-center px-4 py-2 text-2xl font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-[#151517] transition-all duration-100 ease-in-out"
                  >
                    {`${reviewType === "all" ? "All Review" : reviewType === "user" ? "User" : " Critic"} Scores`}
                  </Link>
                  <div className="flex gap-8 text-center text-white">
                    <ScoreBox status={ocData.status} url={`?${new URLSearchParams({ display: 'opencritic'})}`} score={currentScores.opencritic}>OpenCritic</ScoreBox>
                    <ScoreBox status={steamData.status} url={`?${new URLSearchParams({ display: 'steam'})}`} score={currentScores.steam}>Steam</ScoreBox>
                  </div>
                  <ScoreBox 
                    status={-1}
                    score={currentScores.aggregate} 
                    textXL={true} 
                    className='flex flex-col justify-center items-center w-[145px] aspect-[20/19] p-3 rounded-xl shadow-box-card border-[1px] border-zinc-800 text-center text-white'
                  >
                    Aggregate
                  </ScoreBox>
                  <p className="mt-4 text-sm text-white text-center">
                    *Due to API call limits from OpenCritic, some critic scores may not load if limits are reached.<br />We recommend checking back later if data appears unavailable.
                  </p>
                </div>
              )}
              {displayType === 'opencritic' &&
                <OCDataCard pathname={pathname} referer={referer} data={ocData} name={displayName} released={released} releaseDate={releaseDate} developer={developer} currentScore={currentScores.opencritic} />
              }
              {displayType === 'steam' &&
                <SteamDataCard pathname={pathname} referer={referer} data={steamData} name={displayName} released={released} releaseDate={releaseDate} developer={developer} currentScore={currentScores.steam} />
              }
            </section>
          </>
        ) : (
          <section><h1 className="text-4xl font-bold text-white text-center tracking-wide">Invalid Page</h1></section>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error loading data:', error);
    return <section><h1 className="text-4xl font-bold text-white text-center tracking-wide">Failed to load page</h1></section>
  };
}
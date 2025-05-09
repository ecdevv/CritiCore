import Link from 'next/link'
import { FaSteam, FaHome } from 'react-icons/fa'
import { SiSteamdb } from 'react-icons/si'
import { TbArrowBackUp } from 'react-icons/tb'
import BackButton from '@/components/common/BackButton'
import ScoreBox from '@/components/score/ScoreBox'
import { capitalizeFirstLetter } from '@/utility/strings'
import { getSteamScoreClass } from '@/utility/helper'
import { SteamData } from '@/utility/types'

interface Props {
  href: string;
  target?: string;
  rel?: string;
  className?: string;
  children: React.ReactNode
}
const LinkButton = ({ href, target = '_blank', rel = 'noopener noreferrer', className, children}: Props) => {
  return (
    <Link 
      href={href} 
      target={target}
      rel={rel}
      className={className}
    >
      {children}
    </Link>
  )
}

interface SteamDataCardProps {
  pathname: string;
  referer: string;
  data: SteamData;
  name: string;
  released: boolean;
  releaseDate: string;
  developer: string;
  currentScore: number;
}

const SteamDataCard = ({ pathname, referer, data, name, released, releaseDate, developer, currentScore }: SteamDataCardProps) => {
  const totalReviews = typeof data.totalReviews === 'number' && data.totalReviews >= 0 ? data.totalReviews : 'N/A';
  const totalPositive = typeof data.totalPositive === 'number' && data.totalPositive >= 0 ? data.totalPositive : 'N/A';
  const totalNegative = typeof data.totalNegative === 'number' && data.totalNegative >= 0 ? data.totalNegative : 'N/A';
  const currentPlayers = typeof data.currentPlayers === 'number' && data.currentPlayers >= 0 ? data.currentPlayers : 'N/A';
  const reviewDesc = data.reviewDesc || 'N/A';
  const steamUrl = data.url || 'https://store.steampowered.com/app/';
  const devUrl = data.devUrl || 'https://store.steampowered.com/developer/';
  const score = typeof currentScore === 'number' && currentScore >= 0 ? currentScore : -1;

  const linkBtnClass = 'group justify-center items-center max-h-[50px] p-2 bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800 hover:scale-110 transition-all duration-100 ease-in-out';
  const reactIconClass = 'fill-white group-hover:fill-[#2196F3] transition-all duration-100 ease-in-out';

  return (
    <div className="relative xl:w-[725px] sm:w-[500px] lg:mt-0 mt-5 flex flex-col items-center p-4 gap-5">
      <BackButton pathname={pathname} referer={referer} className="group absolute top-[-30px] left-1/2 translate-x-[-50%] p-[2px] bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800">
        <TbArrowBackUp size={32} className='group-hover:text-[#2196F3] text-white transition-colors duration-100 ease-in-out'/>
      </BackButton>
      <h1 className="sm:text-4xl text-3xl font-bold text-white text-center tracking-wide">{name}</h1>
      { isNaN(new Date(releaseDate).getTime()) ? (
        <p className='text-white text-center tracking-wide'>
          <strong>{capitalizeFirstLetter(releaseDate) || 'Invalid Date'}</strong> by <strong>{developer}</strong>
        </p>
      ) : released ? (
        <p className='text-white text-center tracking-wide'>
          Released on <strong>{releaseDate}</strong> by <strong>{developer}</strong>
        </p>
      ) : (
        <p className='text-white text-center tracking-wide'>
          Releasing on <strong>{releaseDate}</strong> by <strong>{developer}</strong>
        </p>
      )}
      <div className="relative flex flex-col gap-2">
        <div className='relative flex flex-row gap-2'>
          <div className="flex flex-col justify-center gap-3 text-white p-4 bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800">
            <p className='flex justify-between gap-4 sm:text-lg text-base'><strong>Total Reviews:</strong><span className={data.totalReviews !== 'N/A' ? "" : "text-zinc-400"}>{totalReviews}</span></p>
            <p className='flex justify-between gap-4 sm:text-lg text-base'><strong>Positive Reviews:</strong><span className={data.totalPositive !== 'N/A' ? "text-positive" : "text-zinc-400"}>{totalPositive}</span></p>
            <p className='flex justify-between gap-4 sm:text-lg text-base'><strong>Negative Reviews:</strong><span className={data.totalNegative !== 'N/A' ? "text-negative" : "text-zinc-400"}>{totalNegative}</span></p>
            <p className={`${getSteamScoreClass(score)} text-center sm:text-lg text-base`}>{reviewDesc}</p>
          </div>
          <div className="flex flex-col gap-3 text-white">
            <ScoreBox status={data.status} target={true} score={score}>Steam</ScoreBox>
            <div className="sm:w-[125px] w-[105px] flex flex-col p-2 justify-center items-center text-center bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800">
              <h2 className="sm:text-3xl text-2xl font-bold tracking-wide">{currentPlayers}</h2>
              <p className="sm:text-base text-sm">In-Game</p>
            </div>
          </div>
        </div>
        <div className='flex flex-row justify-center gap-2'>
          <LinkButton href={devUrl} className={linkBtnClass}><FaHome size={32} className={reactIconClass} /></LinkButton>
          <LinkButton href={steamUrl} className={linkBtnClass}><FaSteam size={32} className={reactIconClass} /></LinkButton>
          <LinkButton href={`https://steamdb.info/app/${data.id}/charts/`} className={linkBtnClass}><SiSteamdb size={32} className={reactIconClass} /></LinkButton>
        </div>
      </div>
    </div>
  )
};

export default SteamDataCard
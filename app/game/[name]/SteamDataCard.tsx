import React from 'react'
import Link from 'next/link'
import { FaSteam, FaHome } from 'react-icons/fa'
import { SiSteamdb } from 'react-icons/si'
import { TbArrowBackUp } from 'react-icons/tb'
import BackButton from '@/app/components/common/BackButton'
import ScoreBox from '@/app/components/score/ScoreBox'
import { getSteamScoreClass } from '@/app/utility/helper'
import { SteamData } from '@/app/utility/types'

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
  releaseDate: string;
  developer: string;
  currentScore: number;
}

const SteamDataCard = ({ pathname, referer, data, name, releaseDate, developer, currentScore }: SteamDataCardProps) => {
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
    <div className="relative w-[725px] flex flex-col items-center p-8 gap-5">
      <BackButton pathname={pathname} referer={referer} className="group absolute top-[-30px] left-1/2 translate-x-[-50%] p-[2px] bg-[#1E1E1E] fill-white shadow-box-card rounded-lg border-[1px] border-zinc-800">
        <TbArrowBackUp size={32} className='group-hover:text-[#2196F3] transition-colors duration-100 ease-in-out'/>
      </BackButton>
      <h1 className="text-4xl font-bold text-white text-center tracking-wide">{name}</h1>
      <p className='text-white tracking-wide'>Released on <strong>{releaseDate}</strong> by <strong>{developer}</strong></p>
      <div className="relative flex flex-col gap-2">
        <div className='relative flex flex-row gap-2'>
          <div className="flex flex-col justify-center gap-3 text-white p-4 bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800">
            <p className='flex justify-between gap-4 text-lg'><strong>Total Reviews:</strong><span className={data.totalReviews !== 'N/A' ? "" : "text-zinc-400"}>{totalReviews}</span></p>
            <p className='flex justify-between gap-4 text-lg'><strong>Positive Reviews:</strong><span className={data.totalPositive !== 'N/A' ? "text-positive" : "text-zinc-400"}>{totalPositive}</span></p>
            <p className='flex justify-between gap-4 text-lg'><strong>Negative Reviews:</strong><span className={data.totalNegative !== 'N/A' ? "text-negative" : "text-zinc-400"}>{totalNegative}</span></p>
            <p className={`${getSteamScoreClass(score)} text-center text-lg`}>{reviewDesc}</p>
          </div>
          <div className="flex flex-col gap-3 text-white">
            <ScoreBox status={data.status} target={true} score={score}>Steam</ScoreBox>
            <div className="w-[125px] flex flex-col p-2 justify-center items-center text-center bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800">
              <h2 className="text-3xl font-bold tracking-wide">{currentPlayers}</h2>
              <p className="text-base">In-Game</p>
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
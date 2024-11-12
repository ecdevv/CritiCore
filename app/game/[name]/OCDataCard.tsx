import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaSteam } from 'react-icons/fa'
import { TbArrowBackUp } from 'react-icons/tb'
import BackButton from '@/app/components/common/BackButton'
import ScoreBox from '@/app/components/score/ScoreBox'
import { getOpenCriticScoreClass } from '@/app/utility/helper'

interface Props {
  href: string;
  target?: string;
  rel?: string;
  className?: string;
  children: React.ReactNode
}
const LinkButton = ({ href, target = '_blank', rel = 'noopener noreferrer', className = 'group self-start p-2 bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800', children}: Props) => {
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

interface OpenCriticDataCardProps {
  pathname: string;
  referer: string;
  data: any;
  name: string;
  releaseDate: string;
  developer: string;
  currentScore: number;
}

const OCDataCard = ({ pathname, referer, data, name, releaseDate, developer, currentScore}: OpenCriticDataCardProps) => {
  const totalCriticReviews = data.totalCriticReviews >= 0 ? data.totalCriticReviews : 'N/A';
  const hasLootBoxes = data.hasLootBoxes !== false && !data.hasLootBoxes ? 'N/A' : data.hasLootBoxes ? 'Yes' : 'No';
  const percentRec = data.percentRec >= 0 ? data.percentRec : 'N/A';
  const tierName = data.tier.name || 'N/A';
  const tierImgUrl = data.tier.url || '/';
  const ocUrl = data.url || 'https://www.opencritic.com/';
  const score = currentScore >= 0 ? currentScore : -1;

  return (
    <div className="relative w-[700px] flex flex-col items-center p-8 gap-5">
      <BackButton pathname={pathname} referer={referer} className="group absolute top-[-30px] left-1/2 translate-x-[-50%] self-start p-1 bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800">
        <TbArrowBackUp size={32} className='group-hover:text-[#62BEF0] transition-colors duration-100 ease-in-out'/>
      </BackButton>
      <h1 className="text-4xl font-bold text-white text-center tracking-wide">{name}</h1>
      <p className='text-white tracking-wide'>Released on <strong>{releaseDate}</strong> by <strong>{developer}</strong></p>
      <div className="relative flex flex-col gap-2">
        <div className='relative flex flex-row gap-2'>
          <div className="flex flex-col justify-center gap-3 text-white p-4 bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800">
            <p className='flex justify-between gap-4 text-lg'><strong>Total Reviews:</strong><span className={totalCriticReviews !== 'N/A' ? "" : "text-zinc-400"}>{totalCriticReviews}</span></p>
            <p className='flex justify-between gap-4 text-lg'><strong>Has Lootboxes:</strong><span className={hasLootBoxes !== 'N/A' ? "" : "text-zinc-400"}>{hasLootBoxes}</span></p>
            <Image src={tierImgUrl} alt={tierName} width={75} height={75} className='self-center'/>
          </div>
          <div className="flex flex-col gap-3 text-white">
            <ScoreBox status={data.status} target={true} score={score}>OpenCritic</ScoreBox>
            <div className={`${getOpenCriticScoreClass(score)} w-[125px] flex flex-col p-4 justify-center items-center text-center shadow-box-card rounded-lg bg-[#1E1E1E] border-[1px] border-zinc-800`}>
              <h2 className="text-4xl font-bold">{percentRec}{percentRec !== 'N/A' ? '%' : ''}</h2>
              <p className="text-sm">Critics Recommend</p>
            </div>
          </div>
        </div>
        <div className='flex flex-row justify-center gap-2'>
          <LinkButton href={ocUrl}><FaSteam size={32} className='group-hover:fill-[#2196F3] transition-colors duration-100 ease-in-out' /></LinkButton>
        </div>
      </div>
    </div>
  )
};

export default OCDataCard
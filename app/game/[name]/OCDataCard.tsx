import Image from 'next/image'
import Link from 'next/link'
import { TbArrowBackUp } from 'react-icons/tb'
import BackButton from '@/components/common/BackButton'
import ScoreBox from '@/components/score/ScoreBox'
import { capitalizeFirstLetter } from '@/utility/strings'
import { getOpenCriticScoreClass } from '@/utility/helper'
import { OCData } from '@/utility/types'

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

interface OpenCriticDataCardProps {
  pathname: string;
  referer: string;
  data: OCData;
  name: string;
  released: boolean;
  releaseDate: string;
  developer: string;
  currentScore: number;
}

const OCDataCard = ({ pathname, referer, data, name, released, releaseDate, developer, currentScore}: OpenCriticDataCardProps) => {
  const totalCriticReviews = typeof data.totalCriticReviews === 'number' && data.totalCriticReviews >= 0 ? data.totalCriticReviews : 'N/A';
  const hasLootBoxes = data.hasLootBoxes !== false && !data.hasLootBoxes ? 'N/A' : data.hasLootBoxes ? 'Yes' : 'No';
  const percentRec = typeof data.percentRec === 'number' && data.percentRec >= 0 ? data.percentRec : 'N/A';
  const tierName = data.tier?.name || 'N/A';
  const tierImgUrl = data.tier?.url || '/';
  const ocUrl = data.url || 'https://www.opencritic.com/';
  const score = currentScore >= 0 ? currentScore : -1;

  const linkBtnClass = 'group justify-center items-center max-h-[50px] p-2 bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800 hover:scale-110 transition-all duration-100 ease-in-out';
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
            <p className='flex justify-between gap-4 sm:text-lg text-base'><strong>Total Reviews:</strong><span className={totalCriticReviews !== 'N/A' ? "" : "text-zinc-400"}>{totalCriticReviews}</span></p>
            <p className='flex justify-between gap-4 sm:text-lg text-base'><strong>Has Lootboxes:</strong><span className={hasLootBoxes !== 'N/A' ? "" : "text-zinc-400"}>{hasLootBoxes}</span></p>
            { tierImgUrl !== '/' && <Image src={tierImgUrl} alt={tierName} width={75} height={75} className='self-center'/> }
          </div>
          <div className="flex flex-col gap-3 text-white">
            <ScoreBox status={data.status} target={true} score={score}>OpenCritic</ScoreBox>
            <div className={`${getOpenCriticScoreClass(score)} sm:w-[125px] w-[105px] flex flex-col p-4 justify-center items-center text-center shadow-box-card rounded-lg bg-[#1E1E1E] border-[1px] border-zinc-800`}>
              <h2 className="sm:text-4xl text-3xl font-bold">{percentRec}{percentRec !== 'N/A' ? '%' : ''}</h2>
              <p className="sm:text-sm text-xs">Critics Recommend</p>
            </div>
          </div>
        </div>
        <div className='flex flex-row justify-center gap-2'>
          <LinkButton href={ocUrl} className={linkBtnClass}>
            <Image src={'/ocLogo.svg'} alt="OpenCritic Logo" width={32} height={32} className='group-hover:fill-[#2196F3] transition-all duration-100 ease-in-out' />
          </LinkButton>
        </div>
      </div>
    </div>
  )
};

export default OCDataCard
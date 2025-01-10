import Link from 'next/link'
import { getScoreColorClass } from '@/utility/helper'

interface ScoreBoxProps {
  status: number
  url?: string
  target?: boolean
  score: number | null | undefined
  textXL?: boolean
  className?: string
  children?: React.ReactNode
}

const ScoreBox = ({ status, url, target = false, score, textXL = false, className = 'flex flex-col justify-center items-center sm:w-[125px] w-[105px] aspect-[20/19] p-3 rounded-lg shadow-box-card border-[1px] border-zinc-800', children = 'N/A' }: ScoreBoxProps) => {
  return (
    <>
      {status !== 200 || !score || score < 0 || !url ? (
        <div className={`${getScoreColorClass(score)} ${className}`}>
          <h2 className={`${textXL ? 'sm:text-xl text-lg' : 'sm:text-lg text-base'} font-semibold`}>{children}</h2>
          <p className={`${textXL ? 'sm:text-6xl text-5xl' : 'sm:text-5xl text-4xl'} font-bold`}>{score && score >= 0 ? score + (children?.toString() === "Steam" ? '%' : '') : 'N/A'}</p>
        </div>
      ) : (
        <Link href={`${url}`} target={target === true ? '_blank' : ''} rel="noopener noreferrer" replace scroll={false} className={`${getScoreColorClass(score, true)} ${className}`}>
          <h2 className={`${textXL ? 'sm:text-xl text-lg' : 'sm:text-lg text-base'} font-semibold`}>{children}</h2>
          <p className={`${textXL ? 'sm:text-6xl text-5xl' : 'sm:text-5xl text-4xl'} font-bold`}>{score && score >= 0 ? score + (children?.toString() === "Steam" ? '%' : '') : 'N/A'}</p>
        </Link>
      )}
    </>
  )
}

export default ScoreBox

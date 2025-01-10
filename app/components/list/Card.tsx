import Image from 'next/image' 
import Link from 'next/link'
import { normalizeString } from '@/utility/strings'
import { CardCategories } from '@/utility/types'

interface CardProps {
  data: CardCategories,
}

const Card = ({ data }: CardProps ) => {
  return (
    <Link href={`/game/${normalizeString(data.name, true)}`} className='group flex font-semibold text-white shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-500 hover:bg-[#0F1012] transition-color duration-75 ease-in-out'>
      <Image
        src={data.headerImage.og}
        alt={data.name || 'Placeholder'}
        width={184}
        height={69}
        placeholder={data.headerImage.blur ? 'blur' : 'empty'}
        blurDataURL={data.headerImage.blur || undefined}
        className='sm:w-auto sm:h-[69px] w-[122.67px] h-[46px] border-r-[1px] border-zinc-800 group-hover:border-zinc-500'
      />
      <div className='flex flex-col h-[69px] justify-center items-start px-4 gap-1 truncate'>
        <h1 className='w-full sm:text-base text-sm truncate'>{data.name}</h1>
        <p className='w-full sm:text-sm text-xs truncate'>{data.releaseDate}</p>
      </div>
    </Link>
  )
}
export default Card
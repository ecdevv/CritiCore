import Image from 'next/image' 
import Link from 'next/link'
import { normalizeString } from '@/app/utility/strings'
import { CardCategories } from '@/app/utility/types'

interface CardProps {
  data: CardCategories,
}

const Card = ({ data }: CardProps ) => {
  return (
    <Link href={`/game/${normalizeString(data.name, true)}`} className='group flex font-semibold text-white shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-600 hover:bg-[#0F1012] transition-all duration-75 ease-in-out'>
      <Image
        src={data.headerImage.og}
        alt={data.name || 'Placeholder'}
        width={184}
        height={69}
        placeholder={data.headerImage.blur ? 'blur' : 'empty'}
        blurDataURL={data.headerImage.blur || undefined}
        className='w-[184px] h-[69px] border-r-[1px] border-zinc-800 group-hover:border-zinc-600'
      />
      <div className='flex flex-col h-[69px] justify-center items-start px-4 gap-2'>
        <h1 className='text-lg'>{data.name}</h1>
        <p className='text-base'>{data.releaseDate}</p>
      </div>
    </Link>
  )
}
export default Card
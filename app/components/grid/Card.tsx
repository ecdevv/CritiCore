import Image from 'next/image' 
import Link from 'next/link'
import { normalizeString } from '@/app/utility/helper'

const Card = ({ name, image }: { name: string; image: { og: string; blur: string } }) => {
  return (
    <Link href={`/game/${normalizeString(name, true)}`} className='transition ease-in-out hover:scale-110'>
      <Image
        src={image.og}
        alt={name || 'Placeholder'}
        width={200}
        height={300}
        placeholder={image.blur ? 'blur' : 'empty'}
        blurDataURL={image.blur || undefined}
        className='w-[200px] h-[300px] border-[1px] border-zinc-900 shadow-vertical-card rounded-xl transition-all duration-200 ease-in-out'
      />
    </Link>
  )
}
export default Card
import Image from 'next/image' 
import Link from 'next/link'
import { normalizeString } from '@/utility/strings'

interface CardProps {
  name: string;
  image: { og: string; blur: string | undefined };
}

const Card = ({ name, image }: CardProps ) => {
  return (
    <Link href={`/game/${normalizeString(name, true)}`} className='group border-[1px] border-zinc-900 shadow-vertical-card rounded-xl sm:hover:scale-110 hover:scale-105 transition-transform duration-200 ease-in-out'>
      <Image
        src={image.og}
        alt={name || 'Placeholder'}
        width={200}
        height={300}
        placeholder={image.blur ? 'blur' : 'empty'}
        blurDataURL={image.blur || undefined}
        className='border-zinc-800 rounded-xl'  // Setting the border color to match the color for list cards in case we want to transition images
      />
    </Link>
  )
}
export default Card
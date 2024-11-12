import React from 'react'
import Link from 'next/link'
import Image from 'next/image' 
import { normalizeStringWithDashes } from '@/app/utility/helper'

const Card = ({ name, imgUrl }: { name: string; imgUrl: string; }) => {
  return (
    <Link href={`/game/${normalizeStringWithDashes(name)}`} className='transition ease-in-out hover:scale-110'>
      <Image
        src={imgUrl}
        alt={name}
        width={300}
        height={600}
        className='w-[200px] h-[300px] border-[1px] border-zinc-900 shadow-vertical-card rounded-xl transition-all duration-200 ease-in-out hover:cursor-pointer'
      />
    </Link>
  )
}
export default Card
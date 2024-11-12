import React from 'react'
import Link from 'next/link'
import Image from 'next/image' 
const Card = () => {
  return (
    <Link href="/" className='transition ease-in-out hover:scale-110 border-[1px] rounded-lg'>
      <Image
        src="/window.svg"
        alt="placeholder game"
        width={300}
        height={600}
        className='w-[200px] h-[300px]'
      />
    </Link>
  )
}
export default Card
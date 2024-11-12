import React from 'react'
import Image from 'next/image' 
const Card = () => {
  return (
    <div className='transition ease-in-out delay-150 hover:scale-110 border-[1px]'>
        <Image
              className="rounded"
              src="/"
              alt="placeholder game"
              width={240}
              height={320}
            />
    </div>
  )
}
export default Card
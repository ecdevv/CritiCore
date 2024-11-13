import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Navbar = () => {
  return (
    <nav className="absolute w-full flex justify-evenly items-center p-4 bg-zinc-800">
      <div className="flex items-center gap-4">
        <Link href='/' className='relative'>
          <Image
            className="dark:invert"
            src="/logo.png"
            alt="logo"
            width={150}
            height={0}
          />
        </Link>
        <ul className="flex gap-4 text-white">
          <li>
            <Link href="#">News</Link>
          </li>
          <li>
            <Link href="#">Browse Games</Link>
          </li>
        </ul>
      </div>    
      <div>
        <input className="outline-none bg-inherit border-b-2" type="search" placeholder="Search" />
      </div>
    </nav>
  )
}

export default Navbar
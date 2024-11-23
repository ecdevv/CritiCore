import Image from 'next/image'
import Link from 'next/link'
import SearchBar from '../search/SearchBar'

const Navbar = () => {
  return (
    <nav className="absolute w-full p-4 bg-zinc-800">
      <div className='xl:w-[1088px] w-full flex xl:justify-between justify-evenly items-center m-auto'>
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
        <SearchBar />
      </div>
    </nav>
  )
}

export default Navbar
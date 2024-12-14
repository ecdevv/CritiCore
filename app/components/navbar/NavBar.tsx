import Image from 'next/image'
import Link from 'next/link'
import SearchBar from '../search/SearchBar'

const Navbar = () => {
  return (
    <nav className="fixed w-full p-4 bg-zinc-800 z-10">
      <div className='xl:w-[1088px] w-full flex sm:flex-row flex-col xl:justify-between justify-evenly items-center m-auto gap-4'>
        <div className="flex items-center gap-6">
          <Link href='/' className='relative'>
            <Image
              className="dark:invert"
              src="/logo.png"
              alt="logo"
              width={150}
              height={0}
            />
          </Link>
        </div>    
        <SearchBar />
      </div>
    </nav>
  )
}

export default Navbar
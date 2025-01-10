import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-white row-start-3 flex flex-col flex-wrap items-center justify-center sm:px-4 px-2 py-4">
      <Link href='/' className='relative pb-4'>
        <Image
          src="/logo.webp"
          alt="logo"
          width={125}
          height={0}
        />
      </Link>
      <div className='border-t-[1px] border-zinc-800 sm:w-[50%] w-full text-center text-sm pt-4'>© 2024 Urban Luxe. All rights reserved. Site design by</div>
    </footer>
  )
}

export default Footer
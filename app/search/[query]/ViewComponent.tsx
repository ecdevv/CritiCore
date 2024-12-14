'use client';
import Link from 'next/link';

type ViewType = "grid" | "list";
const ViewComponent = ( { page, searchResultsLength }: { page: string, searchResultsLength: number } ) => {
  const setCookies = (newState: ViewType) => {
    document.cookie = `view=${newState}; path=/`;
  };
  
  const handlePage = (newState: ViewType) => {
    const newMaxLength = newState === 'grid' ? 20 : 40;
    const newMaxPages = Math.ceil(searchResultsLength / newMaxLength);
    const newPage = Math.min(Number(page), newMaxPages);
    return newPage.toString();
  };

  return (
    <div className='sm:absolute top-1/2 right-0 sm:translate-y-[-50%] flex gap-3 justify-center items-center'>
      <Link href={`?${new URLSearchParams({ p: handlePage('grid') })}`} onClick={() => (setCookies('grid'))} replace className='group flex justify-center items-center gap-2 sm:w-[125px] w-[75px] px-1 py-1 text-base rounded shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-[#151517] transition-color duration-100 ease-in-out'>
        <div className='w-[16px] h-[16px]'>
          <svg
            viewBox="6.5 6.5 11 11"
            fill="currentColor"
            width="100%"
            height="100%"
            className='group-hover:fill-[#2196F3] transition-all duration-200 ease-in-out'
          >
            <path d="M11 7H7v4h4V7zM11 13H7v4h4v-4zM13 13h4v4h-4v-4zM17 7h-4v4h4V7z" />
          </svg>
        </div>
        <span className='sm:inline hidden group-hover:text-[#2196F3] transition-color duration-200 ease-in-out'>Gallery</span>
      </Link>
      <Link href={`?${new URLSearchParams({ p: handlePage('list') })}`} onClick={() => (setCookies('list'))} replace className='group flex justify-center items-center gap-2 sm:w-[125px] w-[75px] px-1 py-1 text-base rounded shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-[#151517] transition-color duration-100 ease-in-out'>
        <div className='w-[16px] h-[16px]'>
          <svg
            viewBox="3 2.5 11 11"
            fill="currentColor"
            width="100%"
            height="100%"
            className='group-hover:fill-[#2196F3] transition-all duration-200 ease-in-out'
          >
            <path
              fillRule="evenodd"
              d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"
            />
          </svg>
        </div>
        <span className='sm:inline hidden group-hover:text-[#2196F3] transition-color duration-200 ease-in-out'>List</span>
      </Link>
    </div>
  )
}

export default ViewComponent;
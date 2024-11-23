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
      <Link href={`?${new URLSearchParams({ p: handlePage('grid') })}`} onClick={() => (setCookies('grid'))} replace className='group'>
        <svg
          viewBox="0 0 512 512"
          fill="currentColor"
          height="32"
          width="32"
          className='group-hover:fill-[#2196F3] transition-all duration-200 ease-in-out'
        >
          <path d="M240 240H32V32h208zM480 240H272V32h208zM240 480H32V272h208zM480 480H272V272h208z" />
        </svg>
      </Link>
      <Link href={`?${new URLSearchParams({ p: handlePage('list') })}`} onClick={() => (setCookies('list'))} replace className='group'>
        <svg
          viewBox="4 4 16 16"
          fill="currentColor"
          height="32"
          width="32"
          className='group-hover:fill-[#2196F3] transition-all duration-200 ease-in-out'
        >
          <path d="M9 5v4h12V5M9 19h12v-4H9m0-1h12v-4H9M4 9h4V5H4m0 14h4v-4H4m0-1h4v-4H4v4z" />
        </svg>
      </Link>
    </div>
  )
}

export default ViewComponent;
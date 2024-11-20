import { headers } from "next/headers";
import Link from "next/link";
import CardGrid from "@/app/components/grid/CardGrid";
import CardList from "@/app/components/list/CardList";
import Pagination from "@/app/components/pagination/Pagination";
import { getBlurDataURL }from "@/app/utility/data";
import { capitalizeFirstLetter, normalizeString } from "@/app/utility/strings";
import { CardCategories, GameCategories } from "@/app/utility/types";
import { PLACEHOLDER_200X300 } from "@/app/utility/constants";

type DisplayType = "grid" | "list";
interface SearchProps {
  params: Promise<{ query: string }>;
  searchParams: Promise<{ display: string, p: string | number }>;
}

const ViewComponent = ( { handlePage }: { handlePage: (newState: DisplayType) => string } ) => {
  return (
    <div className='absolute top-1/2 right-0 translate-y-[-50%] flex gap-4 text-center'>
      <Link href={`?${new URLSearchParams({ p: handlePage('grid'), display: 'grid' })}`} replace className='w-[100px] px-4 py-[2px] text-2xl font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-[#151517] transition-all duration-100 ease-in-out'>
        <h1 className="text-3xl font-bold text-white tracking-wide">Grid</h1>
      </Link>
      <Link href={`?${new URLSearchParams({ p: handlePage('list'), display: 'list' })}`} replace className='w-[100px] px-4 py-[2px] text-2xl font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-[#151517] transition-all duration-100 ease-in-out'>
        <h1 className="text-3xl font-bold text-white tracking-wide">List</h1>
      </Link>
    </div>
  )
}

export default async function SearchPage({ params, searchParams }: SearchProps) {
  const headersList = await headers();
  const baseUrl = headersList.get('x-base-url') || '';
  const searchQuery = (await params).query || '';
  const state = (await searchParams).display || 'grid';
  const page = (await searchParams).p || 1;
  const maxLength = state === 'grid' ? 20 : 40

  let categoryData: CardCategories[] = [];

  try {
    // Fetch search results
    const searchResultsResponse = await fetch(`${baseUrl}/api/steam/search/?${new URLSearchParams({ q: searchQuery })}`, { next: { revalidate: 7200 } });  // 2 hours
    const { searchResults } = await searchResultsResponse.json();

    // If we have the data for the results, setup data for CardGrid with sgdbImages being fetched if steam's image is not available
    if (searchResults.length) {
      categoryData = await Promise.all(
        searchResults
          .filter((game: GameCategories) => game.id)
          .map(async (game: GameCategories) => {
            const headerog = game.headerImage || undefined
            const headerblur = headerog ? await getBlurDataURL(headerog) : undefined
            const headerimage = headerog ? { og: headerog, blur: headerblur } : { og: PLACEHOLDER_200X300, blur: undefined };
            const og = game.capsuleImage || (await fetch(`${baseUrl}/api/sgdb/${normalizeString(game.name, true)}`, { next: { revalidate: 7200 } }).then(res => res.json())).capsuleImage || undefined;  // 2 hours
            const blur = og ? await getBlurDataURL(og) : undefined;
            const image = og ? { og, blur } : { og: PLACEHOLDER_200X300, blur: undefined };
            return {
              category: 'Search Results',
              steamid: game.id,
              name: game.name,
              releaseDate: capitalizeFirstLetter(game.releaseDate),
              developer: game.developer || 'N/A',
              headerImage: headerimage,
              capsuleImage: image,
            };
          })
      );
      categoryData.sort((a, b) => {
        const dateA = a.releaseDate === 'To Be Announced' || a.releaseDate === 'Coming Soon' ? new Date().getTime() : new Date(a.releaseDate).getTime();
        const dateB = b.releaseDate === 'To Be Announced' || b.releaseDate === 'Coming Soon' ? new Date().getTime() : new Date(b.releaseDate).getTime();
        return dateB - dateA;
      });
    }

    const paginatedData = categoryData.slice((Number(page) - 1) * maxLength, Number(page) * maxLength);

    const handlePrevPage = () => {
      const pageNum = Number(page);
      return (pageNum > 1 ? pageNum - 1 : 1); 
    }
    const handleNextPage = () => {
      const pageNum = Number(page);
      return (pageNum < Math.ceil(searchResults.length / maxLength) ? (pageNum + 1) : Math.ceil(searchResults.length / maxLength));
    }

    const handlePageOnSwitch = (newState: DisplayType) => {
      const newMaxLength = newState === 'grid' ? 20 : 40;
      const newMaxPages = Math.ceil(searchResults.length / newMaxLength);
      const newPage = Math.min(Number(page), newMaxPages);
      return newPage.toString();
    };

    return (
      <div className='flex justify-center items-start min-h-screen p-8 bg-zinc-900'>
        {paginatedData?.length > 0 
          ? <div className="flex flex-col items-center justify-start p-8">
              {state === 'grid' 
                ? <CardGrid data={paginatedData}>
                    <ViewComponent handlePage={handlePageOnSwitch}/>
                  </CardGrid>
                : <CardList data={paginatedData}>
                    <ViewComponent handlePage={handlePageOnSwitch}/>
                  </CardList>
              }
              {(searchResults.length > maxLength ) && <Pagination display={state} handlePrev={handlePrevPage} handleNext={handleNextPage} />}
            </div>
          : <h1 className="self-center text-white">No results found.</h1>
        }
      </div>
    );
  } catch (error) {
    console.error(error);
    return (
      <div className="flex justify-center items-center min-h-screen p-8 bg-zinc-900">
        <p className="text-white">Failed to load data. Please try again later.</p>
      </div>
    );
  }
}


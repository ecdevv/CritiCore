import { Metadata, ResolvingMetadata } from "next";
import { headers, cookies } from "next/headers";
import ViewComponent from "./ViewComponent";
import CardGrid from "@/app/components/grid/CardGrid";
import CardList from "@/app/components/list/CardList";
import Pagination from "@/app/components/pagination/Pagination";
import { getBlurDataURL }from "@/app/utility/data";
import { capitalizeFirstLetter, normalizeString } from "@/app/utility/strings";
import { CardCategories, GameCategories } from "@/app/utility/types";
import { PLACEHOLDER_184X69, PLACEHOLDER_200X300 } from "@/app/utility/constants";

export async function generateMetadata({}, 
  parent: ResolvingMetadata
): Promise<Metadata> {
  // optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || []

  // Get the headers
  const headersList = await headers();

  // Parse the search categories and set the title
  const pathname = headersList.get('x-pathname') || '';
  const title = normalizeString(pathname.substring(pathname.lastIndexOf('/') + 1));

  return {
    title: "Search results for " + title,
    openGraph: {
      title: "Search results for " + title,
      description: 'Search results for ' + title,
      type: 'website',
      locale: 'en-US',
      url: `${headersList.get('x-pathname')}`,
      siteName: 'Criticore',
      images: [
        ...previousImages
      ]
    },
  }
}

interface SearchProps {
  params: Promise<{ query: string }>;
  searchParams: Promise<{ view: string, p: string | number }>;
}

export default async function SearchPage({ params, searchParams }: SearchProps) {
  const headersList = await headers();
  const cookiesStore = await cookies();
  const baseUrl = headersList.get('x-base-url') || '';
  const searchQuery = (await params).query || '';
  const state = cookiesStore.get('view')?.value.toString() || 'grid';
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
            const headerimage = headerog ? { og: headerog, blur: headerblur } : { og: PLACEHOLDER_184X69, blur: undefined };
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

    return (
      <div className='flex justify-center items-start min-h-screen sm:p-12 py-12 px-6 bg-zinc-900'>
        {paginatedData?.length > 0 
          ? <div className={`${state === 'grid' ? '' : 'xl:w-[1088px] w-full'} flex flex-col items-center justify-start sm:mt-12 mt-[96.033px] gap-10`}>
              {state === 'grid'
                ? <CardGrid data={paginatedData}>
                    <ViewComponent page={page.toString()} searchResultsLength={searchResults.length} />
                  </CardGrid>
                : <CardList data={paginatedData}>
                    <ViewComponent page={page.toString()} searchResultsLength={searchResults.length} />
                  </CardList>
              }
              {(searchResults.length > maxLength ) && <Pagination handlePrev={handlePrevPage} handleNext={handleNextPage} />}
            </div>
          : <h1 className="self-center text-white">No results found.</h1>
        }
      </div>
    );
  } catch (error) {
    console.error(error);
    return (
      <div className="flex justify-center items-center min-h-screen sm:p-12 py-12 px-6 bg-zinc-900">
        <p className="text-white">Failed to load data. Please try again later.</p>
      </div>
    );
  }
}


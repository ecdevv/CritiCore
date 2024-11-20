import Link from "next/link";

const Pagination = ({ display, handlePrev, handleNext }: { display: string, handlePrev: () => number, handleNext: () => number }) => {
  return (
    <div className="flex items-center justify-center">
      <Link href={`?${new URLSearchParams({ p: handlePrev().toString(), ...(display && { display }) })}`} scroll={false} className="w-[100px] px-4 py-2 text-white bg-gray-700 rounded-l-lg hover:bg-gray-600 text-center">Previous</Link>
      <Link href={`?${new URLSearchParams({ p: handleNext().toString(), ...(display && { display }) })}`} scroll={false} className="w-[100px] px-4 py-2 text-white bg-gray-700 rounded-r-lg hover:bg-gray-600 text-center">Next</Link>
    </div>
  );
};

export default Pagination;
import Link from "next/link";

const Pagination = ({ handlePrev, handleNext }: { handlePrev: () => number, handleNext: () => number }) => {
  return (
    <div className="flex justify-center items-center text-center gap-4">
      <Link href={`?${new URLSearchParams({ p: handlePrev().toString() })}`} scroll={false} className="w-[150px] px-4 py-[2px] text-2xl font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-[#151517] transition-all duration-100 ease-in-outext-center">Previous</Link>
      <Link href={`?${new URLSearchParams({ p: handleNext().toString() })}`} scroll={false} className="w-[150px] px-4 py-[2px] text-2xl font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-[#151517] transition-all duration-100 ease-in-outtext-center">Next</Link>
    </div>
  );
};

export default Pagination;
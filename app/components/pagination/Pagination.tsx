import Link from "next/link";

const Pagination = ({ handlePrev, handleNext }: { handlePrev: () => number, handleNext: () => number }) => {
  return (
    <div className="flex justify-center items-center text-center gap-4">
      <Link href={`?${new URLSearchParams({ p: handlePrev().toString() })}`} scroll={false} className="sm:w-[150px] w-[125px] px-4 py-[2px] sm:text-lg text-base font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-[#151517] hover:text-[#2196F3] transition-color duration-100 ease-in-out">Previous</Link>
      <Link href={`?${new URLSearchParams({ p: handleNext().toString() })}`} scroll={false} className="sm:w-[150px] w-[125px] px-4 py-[2px] sm:text-lg text-base font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800 hover:border-zinc-700 hover:bg-[#151517] hover:text-[#2196F3] transition-color duration-100 ease-in-out">Next</Link>
    </div>
  );
};

export default Pagination;
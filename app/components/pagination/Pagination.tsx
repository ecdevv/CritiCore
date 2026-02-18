import Link from "next/link";
import PageJump from "./PageJump";

const Pagination = ({ current, total, handlePrev, handleNext }: { current: number, total: number, handlePrev: () => number, handleNext: () => number }) => {
  return (
    <div className="flex justify-center items-center text-center gap-4">
      <Link 
        href={`?${new URLSearchParams({ p: handlePrev().toString() })}`}
        scroll={false}
        className={`sm:w-[150px] w-[125px] px-4 py-[2px] sm:text-lg text-base font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800
        ${current === 1 ? "opacity-50 pointer-events-none" : "hover:border-zinc-700 hover:bg-[#151517] hover:text-[#2196F3]"}
        transition-color duration-100 ease-in-out`}
      >
        Previous
      </Link>
      <PageJump current={current} total={total} />
      <Link
        href={`?${new URLSearchParams({ p: handleNext().toString() })}`}
        scroll={false}
        className={`sm:w-[150px] w-[125px] px-4 py-[2px] sm:text-lg text-base font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] border-zinc-800
        ${current === total ? "opacity-50 pointer-events-none" : "hover:border-zinc-700 hover:bg-[#151517] hover:text-[#2196F3]"}
        transition-color duration-100 ease-in-out`}
      >
        Next
      </Link>
    </div>
  );
};

export default Pagination;
'use client'
import { useEffect, useState } from 'react';

const PageJump = ({ current, total }: { current: number; total: number }) => {
  const [pageInput, setPageInput] = useState(current);

  useEffect(() => {
    setPageInput(current);
  }, [current]);

  return (
    // Jump to page input
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const page = Math.max(1, Math.min(total, Number(pageInput)));
        if (page === current) return;
        window.location.search = `?p=${page}`;
      }}
      className="flex items-center gap-2"
    >
      <label htmlFor="pageInput">Go to page:</label>
      <input
        id="pageInput"
        type="number"
        min={1}
        max={total}
        value={pageInput}
        onChange={(e) => setPageInput(Number(e.target.value))}
        className="w-20 px-2 py-1 rounded border text-black"
      />
      <button
        type="submit"
        className="px-4 py-[2px] sm:text-lg text-base font-semibold text-white tracking-wide rounded shadow-box-card border-[1px] bg-blue-400 border-zinc-700  hover:bg-blue-500 hover:border-zinc-500 transition-color duration-100 ease-in-out"
      >
        Go
      </button>
    </form>
  );
};

export default PageJump;
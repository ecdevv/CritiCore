'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { normalizeString } from '@/utility/strings';
import { CiSearch } from 'react-icons/ci';

const SearchBar = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    inputRef?.current?.focus();
    if (!searchQuery.trim()) return;
    const normalizedQuery = normalizeString(searchQuery.trim(), true, true);
    const encodedQuery = encodeURI(normalizedQuery);
    router.push( `/search/${encodedQuery}`);
    setSearchQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="group sm:w-[35%] w-full relative flex items-center">
      <label htmlFor="search-input" className="sr-only">
        Search:
      </label>
      <input
        id="search-input"
        ref={inputRef}
        type="text"
        value={searchQuery}
        minLength={3}
        onChange={handleChange}
        placeholder="Search"
        required
        className="w-full px-4 py-[6px] border-[1px] bg-zinc-900 text-white border-transparent rounded-md outline-transparent focus:outline-none focus:border-zinc-400 group-hover:border-zinc-400 transition-color duration-100 ease-in-out"
      />
      <button type="submit" className="absolute right-[1px] px-[6px] py-[5px] border-[1px] border-transparent bg-zinc-500 text-white rounded-r-[4px] group-focus-within:bg-zinc-400 group-hover:bg-zinc-400 hover:!bg-zinc-300 hover:border-zinc-300 transition-color duration-100 ease-in-out">
        <CiSearch size={24} aria-label={'Search'} className="text-zinc-800" />
      </button>
    </form>
  );

};

export default SearchBar;

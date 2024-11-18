'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { normalizeString } from '@/app/utility/strings';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const router = useRouter();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = normalizeString(searchQuery.trim(), true, true);
    const encodedQuery = encodeURI(normalizedQuery);
    router.push( `/search/${encodedQuery}`);
    setSearchQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <input
        type="text"
        value={searchQuery}
        onChange={handleChange}
        placeholder="Search..."
        className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500 dark:text-black"
      />
      <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md">
        Search
      </button>
    </form>
  );

};

export default SearchBar;

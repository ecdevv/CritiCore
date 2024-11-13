import React from 'react';
import Card from './Card';
import { TopCategories } from '@/app/utility/types';

const CardGrid = ({categoryData = []}: { category?: string, categoryData?: TopCategories[] }) => {
  const Cards = Array.from({ length: 10 });

  return (
    <div className='flex flex-col p-8'>
      <h1 className='text-3xl font-bold text-white tracking-wide'>{categoryData[0].category}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-4">
        {Cards.map((_, index) => (
          <Card key={index} name={categoryData[index].name} imgUrl={categoryData[index].capsuleImage}  />
        ))}
      </div>
    </div>
  );
};

export default CardGrid;
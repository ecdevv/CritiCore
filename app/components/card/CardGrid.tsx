import React from 'react';
import Card from './Card';

const CardGrid = ({headerText = ''}: {headerText?: string}) => {
  const cards = Array.from({ length: 10 });

  return (
    <div className='flex flex-col p-8'>
      <h1 className='text-3xl font-bold text-white tracking-wide'>{headerText}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
        {cards.map((_, index) => (
          <Card key={index} />
        ))}
      </div>
    </div>
  );
};

export default CardGrid;
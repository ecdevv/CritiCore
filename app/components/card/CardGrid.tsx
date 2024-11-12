import React from 'react';
import Card from './Card';

const CardGrid = () => {
  const cards = Array.from({ length: 50 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-8">
      {cards.map((_, index) => (
        <Card key={index} />
      ))}
    </div>
  );
};

export default CardGrid;
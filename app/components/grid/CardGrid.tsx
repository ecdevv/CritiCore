import Card from './Card';
import { CardCategories } from '@/app/utility/types';

const CardGrid = ({ categoryData = [] }: { categoryData?: CardCategories[] }) => {
  if (categoryData.length === 0) return null;
  
  return (
  <div className='flex flex-col p-8'>
    <h1 className='text-3xl font-bold text-white tracking-wide'>{categoryData[0].category}</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-4">
      {categoryData.map((data, index) => (
        <Card key={index} name={data.name} image={data.capsuleImage}  />
      ))}
    </div>
  </div>
  );
};

export default CardGrid;
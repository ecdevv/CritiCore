import Card from './Card';
import { CardCategories } from '@/app/utility/types';

const CardGrid = ({ data = [], children }: { data?: CardCategories[], children?: React.ReactNode }) => {
  if (data.length === 0) return null;
  
  return (
  <div className='w-[1150px] flex flex-col p-8'>
    <h1 className='relative text-3xl font-bold text-white tracking-wide'>{data[0].category}{children}</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-5">
      {data.map((data, index) => (
        <Card key={index} name={data.name} image={data.capsuleImage as { og: string; blur: string | undefined }}  />
      ))}
    </div>
  </div>
  );
};

export default CardGrid;
import Card from './Card';
import { CardCategories } from '@/app/utility/types';

const CardList = ({ data = [], children }: { data?: CardCategories[], children?: React.ReactNode }) => {
  if (data.length === 0) return null;
  
  return (
  <div className='w-full flex flex-col gap-5'>
    <div className={`relative w-full sm:block flex flex-col gap-3 text-3xl font-bold text-white tracking-wide ${children ? 'sm:text-left' : 'lg:text-left'} text-center`}><h1>{data[0].category}</h1>{children}</div>
    <div className="flex flex-col gap-1">
      {data.map((data, index) => (
        <Card key={index} data={data} />
      ))}
    </div>
  </div>
  );
};

export default CardList;

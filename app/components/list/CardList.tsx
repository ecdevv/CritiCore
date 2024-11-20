import Card from './Card';
import { CardCategories } from '@/app/utility/types';

const CardList = ({ data = [], children }: { data?: CardCategories[], children?: React.ReactNode }) => {
  if (data.length === 0) return null;
  
  return (
  <div className='w-[1150px] flex flex-col p-8'>
    <h1 className='relative text-3xl font-bold text-white tracking-wide'>{data[0].category}{children}</h1>
    <div className="grid grid-cols-1 gap-1 mt-4">
      {data.map((data, index) => (
        <Card key={index} data={data}  />
      ))}
    </div>
  </div>
  );
};

export default CardList;

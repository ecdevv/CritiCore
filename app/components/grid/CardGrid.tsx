import Card from './Card';
import { CardCategories } from '@/app/utility/types';

const CardGrid = ({ data = [], children }: { data?: CardCategories[], children?: React.ReactNode }) => {
  if (data.length === 0) return null;
  
  return (
  <div className='w-full flex flex-col justify-center items-center gap-5'>
    <div className={`relative sm:block flex flex-col gap-3 w-full sm:text-3xl text-2xl font-bold text-white tracking-wide ${children ? 'sm:text-left' : 'lg:text-left'} text-center`}><h1>{data[0].category}</h1>{children}</div>
    <div className="grid xl:grid-cols-5 lg:grid-cols-4 grid-cols-3 sm:gap-5 min-[450px]:gap-3 gap-2">
      {data.map((data, index) => (
        <Card key={index} name={data.name} image={data.capsuleImage as { og: string; blur: string | undefined }} />
      ))}
    </div>
  </div>
  );
};

export default CardGrid;
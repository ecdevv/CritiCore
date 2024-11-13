'use client'
import { useRouter } from 'next/navigation';

interface Props {
  pathname?: string;
  referer?: string;
  className?: string; 
  children: React.ReactNode
}

// TODO: Fix referer being unused
const BackButton = ({ pathname, referer, className = "group self-start p-1 bg-[#1E1E1E] shadow-box-card rounded-lg border-[1px] border-zinc-800", children }: Props) => {
  const router = useRouter();

  const goBack = () => {
    // The commented below navigate back to the previous page better, but I can't figure out how to prevent it from scrolling back to the previous location.
    // const previousUrl = referer;
    // const sameDomain = previousUrl && new URL(previousUrl).origin === window.location.origin;

    // if (sameDomain) {
    //   router.back(); 
    // } else if (pathname) {
    //   router.push(pathname, { scroll: false });
    // }
    console.log(referer);
    if (pathname) {
      router.replace(pathname, { scroll: false });
    }
  };

  return (
    <button onClick={goBack} className={className}>
      {children}
    </button>
  );
};

export default BackButton;

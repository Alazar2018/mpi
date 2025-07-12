import { Skeleton, SkeletonStyles } from '@/components/ui/Skeleton';

export function VersusSkeleton() {
  return (
    <div className="rounded-[1.5rem] bg-gray-1 p-4 grid gap-2 grid-cols-8">
      <SkeletonStyles />
      
      {/* Player 1 Card */}
      <div className="col-span-3 flex-col gap-3 bg-white rounded-2xl p-4 card-shadow flex justify-center items-center">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col items-center gap-2 w-full">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      
      {/* VS Card */}
      <div className="col-span-2 flex-col gap-3 bg-white rounded-2xl p-4 card-shadow flex justify-center items-center">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      
      {/* Player 2 Card */}
      <div className="col-span-3 flex-col gap-3 bg-white rounded-2xl p-4 card-shadow flex justify-center items-center">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col items-center gap-2 w-full">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default VersusSkeleton;

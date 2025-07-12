import { Skeleton, SkeletonStyles } from '@/components/ui/Skeleton';

export function MatchResultCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-[1.5rem] border border-gray-1">
      <SkeletonStyles />
      
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      
      <div className="flex items-ce	nter gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default MatchResultCardSkeleton;

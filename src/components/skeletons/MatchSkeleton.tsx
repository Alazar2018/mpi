import { Skeleton, SkeletonStyles } from '@/components/ui/Skeleton';

export function MatchSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonStyles />
      
      {/* Grid of match details */}
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center p-4 gap-4 bg-blue-50 rounded-lg">
            <Skeleton className="size-[54px] rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Action button */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  );
}

export default MatchSkeleton;

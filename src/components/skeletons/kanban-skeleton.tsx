import { Skeleton } from '@/components/ui/skeleton';

export function KanbanSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {[1, 2, 3].map((col) => (
        <div key={col} className="flex-1 min-w-[320px]">
          <div className="bg-black border overflow-hidden h-full flex flex-col shadow-xl">
            {/* Column Header */}
            <div className="p-5 border-b  bg-black">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10" />
                <Skeleton className="h-6 w-32" />
                <div className="ml-auto">
                  <Skeleton className="w-12 h-7" />
                </div>
              </div>
            </div>

            {/* Single Card Skeleton */}
            <div className="p-4">
              <div className="flex gap-3 p-3 overflow-hidden border bg-black">
                {/* Square thumbnail on left */}
                <Skeleton className="w-24 h-24 flex-shrink-0" />
                {/* Content on right */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

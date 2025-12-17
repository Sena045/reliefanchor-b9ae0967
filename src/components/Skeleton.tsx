import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <div className="space-y-2 flex-1 flex flex-col items-end">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

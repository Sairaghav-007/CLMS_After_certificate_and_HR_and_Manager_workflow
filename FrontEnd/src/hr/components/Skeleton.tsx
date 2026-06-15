import { cn } from '@/hr/lib/utils';
import { useThemeStore } from '@/hr/store';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'animate-pulse rounded-xl',
        isDark ? 'bg-surface-700/50' : 'bg-surface-200/60',
        className
      )}
    />
  );
}

export function DashboardSkeleton() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-[20px] p-6 border-l-4 border',
              isDark
                ? 'bg-surface-800/80 border-surface-700/50 border-l-surface-600'
                : 'bg-white border-surface-100 border-l-surface-300'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="w-12 h-12 rounded-2xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom sections skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cn(
          'rounded-[20px] p-6 border',
          isDark ? 'bg-surface-800/80 border-surface-700/50' : 'bg-white border-surface-100'
        )}>
          <Skeleton className="h-6 w-40 mb-5" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 py-3.5">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>

        <div className={cn(
          'rounded-[20px] p-6 border',
          isDark ? 'bg-surface-800/80 border-surface-700/50' : 'bg-white border-surface-100'
        )}>
          <Skeleton className="h-6 w-40 mb-5" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 py-3 rounded-2xl">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
              </div>
              <Skeleton className="w-20 h-8 rounded-xl flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  BadgeCheck,
  FileEdit,
  CalendarClock,
} from 'lucide-react';
import { cn } from '@/hr/lib/utils';
import { formatRelativeTime } from '@/hr/lib/utils';
import { useThemeStore } from '@/hr/store';
import type { RecentActivity } from '@/hr/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardCheck,
  BadgeCheck,
  FileEdit,
  CalendarClock,
};

const typeColors: Record<string, {
  bg: string;
  bgDark: string;
  icon: string;
  dot: string;
}> = {
  review: {
    bg: 'bg-blue-50',
    bgDark: 'bg-blue-500/10',
    icon: 'text-blue-600',
    dot: 'bg-blue-500',
  },
  publish: {
    bg: 'bg-accent-50',
    bgDark: 'bg-accent-500/10',
    icon: 'text-accent-600',
    dot: 'bg-accent-500',
  },
  edit: {
    bg: 'bg-amber-50',
    bgDark: 'bg-amber-500/10',
    icon: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  schedule: {
    bg: 'bg-secondary-50',
    bgDark: 'bg-secondary-500/10',
    icon: 'text-secondary-600',
    dot: 'bg-secondary-500',
  },
};

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className={cn(
        'rounded-[20px] p-6 border transition-colors duration-300',
        isDark
          ? 'bg-surface-800/80 border-surface-700/50 backdrop-blur-sm'
          : 'bg-white border-surface-100 shadow-sm'
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className={cn(
          'text-lg font-bold',
          isDark ? 'text-white' : 'text-surface-900'
        )}>
          Recent Activities
        </h2>
        <span className={cn(
          'text-xs font-medium px-2.5 py-1 rounded-full',
          isDark ? 'bg-surface-700 text-surface-300' : 'bg-surface-100 text-surface-500'
        )}>
          {activities.length} total
        </span>
      </div>

      {/* Timeline */}
      <div className="relative max-h-[420px] overflow-y-auto pr-1 space-y-0">
        {/* Timeline line */}
        <div className={cn(
          'absolute left-[19px] top-3 bottom-3 w-[2px]',
          isDark ? 'bg-surface-700' : 'bg-surface-200'
        )} />

        {activities.map((activity, index) => {
          const colors = typeColors[activity.type];
          const Icon = iconMap[activity.icon];

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.06, duration: 0.3 }}
              className={cn(
                'relative flex items-start gap-4 py-3.5 pl-0',
                index !== activities.length - 1 && ''
              )}
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  isDark ? colors.bgDark : colors.bg
                )}>
                  {Icon && <Icon className={cn('w-4.5 h-4.5', colors.icon)} />}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={cn(
                  'text-sm font-semibold',
                  isDark ? 'text-surface-100' : 'text-surface-900'
                )}>
                  {activity.title}
                </p>
                <p className={cn(
                  'text-xs mt-0.5 line-clamp-2',
                  isDark ? 'text-surface-400' : 'text-surface-500'
                )}>
                  {activity.description}
                </p>
              </div>

              {/* Timestamp */}
              <span className={cn(
                'text-[11px] font-medium flex-shrink-0 mt-1',
                isDark ? 'text-surface-500' : 'text-surface-400'
              )}>
                {formatRelativeTime(activity.timestamp)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}


import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { cn } from '@/hr/lib/utils';
import { useThemeStore } from '@/hr/store';
import type { PendingAction, PendingActionPriority } from '@/hr/types';

const priorityConfig: Record<PendingActionPriority, {
  badge: string;
  badgeDark: string;
  badgeText: string;
  badgeTextDark: string;
  label: string;
  button: string;
  buttonDark: string;
}> = {
  high: {
    badge: 'bg-danger-50',
    badgeDark: 'bg-danger-500/15',
    badgeText: 'text-danger-600',
    badgeTextDark: 'text-danger-400',
    label: 'High',
    button: 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25',
    buttonDark: 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20',
  },
  medium: {
    badge: 'bg-warning-50',
    badgeDark: 'bg-warning-500/15',
    badgeText: 'text-warning-600',
    badgeTextDark: 'text-warning-400',
    label: 'Medium',
    button: 'bg-surface-100 hover:bg-surface-200 text-surface-700',
    buttonDark: 'bg-surface-700 hover:bg-surface-600 text-surface-200',
  },
  low: {
    badge: 'bg-accent-50',
    badgeDark: 'bg-accent-500/15',
    badgeText: 'text-accent-600',
    badgeTextDark: 'text-accent-400',
    label: 'Low',
    button: 'bg-surface-100 hover:bg-surface-200 text-surface-600',
    buttonDark: 'bg-surface-700 hover:bg-surface-600 text-surface-300',
  },
};

interface PendingActionsProps {
  actions: PendingAction[];
}

export function PendingActions({ actions }: PendingActionsProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className={cn(
        'rounded-[20px] p-6 border transition-colors duration-300',
        isDark
          ? 'bg-surface-800/80 border-surface-700/50 backdrop-blur-sm'
          : 'bg-white border-surface-100 shadow-sm'
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            isDark ? 'bg-danger-500/10' : 'bg-danger-50'
          )}>
            <Shield className="w-4 h-4 text-danger-500" />
          </div>
          <h2 className={cn(
            'text-lg font-bold',
            isDark ? 'text-white' : 'text-surface-900'
          )}>
            Pending Actions
          </h2>
        </div>
        <span className={cn(
          'text-xs font-bold px-2.5 py-1 rounded-full',
          isDark ? 'bg-danger-500/15 text-danger-400' : 'bg-danger-50 text-danger-600'
        )}>
          {actions.reduce((sum, a) => sum + a.count, 0)} Total
        </span>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const config = priorityConfig[action.priority];

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.08, duration: 0.3 }}
              className={cn(
                'rounded-2xl p-4 border transition-all duration-200',
                isDark
                  ? 'bg-surface-900/50 border-surface-700/50 hover:border-surface-600'
                  : 'bg-surface-50/50 border-surface-100 hover:border-surface-200 hover:shadow-sm'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Count badge */}
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl text-lg font-extrabold flex-shrink-0',
                  isDark ? config.badgeDark : config.badge,
                  isDark ? config.badgeTextDark : config.badgeText
                )}>
                  {action.count}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={cn(
                      'text-sm font-semibold',
                      isDark ? 'text-surface-100' : 'text-surface-900'
                    )}>
                      {action.title}
                    </p>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
                      isDark ? config.badgeDark : config.badge,
                      isDark ? config.badgeTextDark : config.badgeText
                    )}>
                      {config.label}
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs line-clamp-1',
                    isDark ? 'text-surface-400' : 'text-surface-500'
                  )}>
                    {action.description}
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex-shrink-0',
                    isDark ? config.buttonDark : config.button
                  )}
                  aria-label={`${action.actionLabel} ${action.title}`}
                >
                  {action.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}


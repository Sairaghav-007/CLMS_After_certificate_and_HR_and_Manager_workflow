import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileEdit,
  ClipboardCheck,
  BadgeCheck,
  AlertTriangle,
  CalendarClock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/hr/lib/utils';
import { useThemeStore } from '@/hr/store';
import type { KPICard } from '@/hr/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  FileEdit,
  ClipboardCheck,
  BadgeCheck,
  AlertTriangle,
  CalendarClock,
};

const colorClasses: Record<string, {
  iconBg: string;
  iconBgDark: string;
  iconColor: string;
  accentBorder: string;
  accentBorderDark: string;
  trendColor: string;
  highlightBg: string;
  highlightBgDark: string;
}> = {
  primary: {
    iconBg: 'bg-primary-50',
    iconBgDark: 'bg-primary-900/20',
    iconColor: 'text-primary-700',
    accentBorder: 'border-l-primary-700',
    accentBorderDark: 'border-l-primary-500',
    trendColor: 'text-primary-700',
    highlightBg: 'bg-primary-50',
    highlightBgDark: 'bg-primary-900/20',
  },
  accent: {
    iconBg: 'bg-accent-50',
    iconBgDark: 'bg-accent-900/20',
    iconColor: 'text-accent-700',
    accentBorder: 'border-l-accent-700',
    accentBorderDark: 'border-l-accent-500',
    trendColor: 'text-accent-700',
    highlightBg: 'bg-accent-50',
    highlightBgDark: 'bg-accent-900/20',
  },
  warning: {
    iconBg: 'bg-warning-50',
    iconBgDark: 'bg-warning-900/20',
    iconColor: 'text-warning-700',
    accentBorder: 'border-l-warning-700',
    accentBorderDark: 'border-l-warning-500',
    trendColor: 'text-warning-700',
    highlightBg: 'bg-warning-50',
    highlightBgDark: 'bg-warning-900/20',
  },
  info: {
    iconBg: 'bg-info-50',
    iconBgDark: 'bg-info-900/20',
    iconColor: 'text-info-700',
    accentBorder: 'border-l-info-700',
    accentBorderDark: 'border-l-info-500',
    trendColor: 'text-info-700',
    highlightBg: 'bg-info-50',
    highlightBgDark: 'bg-info-900/20',
  },
  danger: {
    iconBg: 'bg-danger-50',
    iconBgDark: 'bg-danger-900/20',
    iconColor: 'text-danger-700',
    accentBorder: 'border-l-danger-700',
    accentBorderDark: 'border-l-danger-500',
    trendColor: 'text-danger-700',
    highlightBg: 'bg-danger-50',
    highlightBgDark: 'bg-danger-900/20',
  },
  secondary: {
    iconBg: 'bg-surface-50',
    iconBgDark: 'bg-surface-800/50',
    iconColor: 'text-surface-600',
    accentBorder: 'border-l-surface-400',
    accentBorderDark: 'border-l-surface-600',
    trendColor: 'text-surface-600',
    highlightBg: 'bg-surface-50',
    highlightBgDark: 'bg-surface-800/50',
  },
};

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1500): number {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animFrame = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);

      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      }
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [target, duration]);

  return count;
}

interface StatCardProps {
  card: KPICard;
  index: number;
}

function StatCard({ card, index }: StatCardProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const colors = colorClasses[card.color];
  const Icon = iconMap[card.icon];
  const animatedValue = useAnimatedCounter(card.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.08)' }}
      className={cn(
        'relative rounded-[20px] p-6 border-l-4 transition-all duration-300 cursor-pointer group overflow-hidden',
        isDark
          ? `bg-surface-800/80 border border-surface-700/50 backdrop-blur-sm ${colors.accentBorderDark}`
          : `bg-white border border-surface-100 shadow-sm ${colors.accentBorder}`
      )}
      role="article"
      aria-label={`${card.title}: ${card.displayValue}`}
    >
      {/* Highlight badge for warning cards */}
      {card.highlight && (
        <div className={cn(
          'absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
          isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
        )}>
          Attention
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs font-semibold uppercase tracking-wider mb-2',
            isDark ? 'text-surface-400' : 'text-surface-500'
          )}>
            {card.title}
          </p>

          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-3xl font-extrabold tabular-nums tracking-tight',
              isDark ? 'text-white' : 'text-surface-900'
            )}>
              {animatedValue}
            </span>
            {card.subtitle && (
              <span className={cn(
                'text-sm font-medium',
                isDark ? 'text-surface-400' : 'text-surface-500'
              )}>
                {card.subtitle}
              </span>
            )}
          </div>

          {/* Trend or extra info */}
          {card.trend && (
            <div className="flex items-center gap-1 mt-2">
              {card.trend.direction === 'up' ? (
                <TrendingUp className={cn('w-3.5 h-3.5', card.id === 'kpi-6' ? colors.trendColor : 'text-accent-500')} />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-danger-500" />
              )}
              <span className={cn(
                'text-xs font-medium',
                card.id === 'kpi-6' ? colors.trendColor : (card.trend.direction === 'up' ? 'text-accent-600' : 'text-danger-600'),
                isDark && (card.id === 'kpi-6' ? '' : (card.trend.direction === 'up' ? 'text-accent-400' : 'text-danger-400'))
              )}>
                {card.id === 'kpi-6' ? card.trend.value : `↑ ${card.trend.value}%`} {card.trend.label}
              </span>
            </div>
          )}

          <p className={cn(
            'text-[11px] mt-2.5',
            isDark ? 'text-surface-500' : 'text-surface-400'
          )}>
            {card.description}
          </p>
        </div>

        {/* Icon */}
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-2xl transition-transform duration-300 group-hover:scale-110',
          isDark ? colors.iconBgDark : colors.iconBg
        )}>
          {Icon && <Icon className={cn('w-6 h-6', colors.iconColor)} />}
        </div>
      </div>
    </motion.div>
  );
}

interface StatsGridProps {
  cards: KPICard[];
}

export function StatsGrid({ cards }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <StatCard key={card.id} card={card} index={index} />
      ))}
    </div>
  );
}


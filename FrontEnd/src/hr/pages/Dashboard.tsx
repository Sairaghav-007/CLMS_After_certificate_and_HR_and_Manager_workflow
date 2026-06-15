import { motion } from 'framer-motion';
import { StatsGrid } from '@/hr/components/StatsGrid';
import { RecentActivities } from '@/hr/components/RecentActivities';
import { PendingActions } from '@/hr/components/PendingActions';
import { mockKPICards, mockRecentActivities, mockPendingActions } from '@/hr/data/mockData';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';

export default function Dashboard() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className={cn(
          "text-3xl font-extrabold tracking-tight",
          isDark ? "text-white" : "text-surface-900"
        )}>
          Dashboard Overview
        </h1>
        <p className={cn(
          "text-surface-500",
          isDark ? "text-surface-400" : "text-surface-500"
        )}>
          Welcome back! Here's what's happening in the HR portal today.
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid cards={mockKPICards} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <RecentActivities activities={mockRecentActivities} />
        <PendingActions actions={mockPendingActions} />
      </div>

      {/* Bottom Spacer for mobile */}
      <div className="h-4 lg:hidden" />
    </motion.div>
  );
}


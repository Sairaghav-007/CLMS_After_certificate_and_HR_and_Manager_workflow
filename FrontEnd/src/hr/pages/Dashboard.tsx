import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { StatsGrid } from '@/hr/components/StatsGrid';
import { RecentActivities } from '@/hr/components/RecentActivities';
//import { PendingActions } from '@/hr/components/PendingActions';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import { api } from '@/api/client';
//import type { KPICard, RecentActivity, PendingAction } from '@/hr/types';
import type { KPICard, RecentActivity } from '@/hr/types';

export default function Dashboard() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [kpiCards, setKpiCards] = useState<KPICard[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  //const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/hr/dashboard');
      const d = res.data;

      setKpiCards([
        {
          id: 'kpi-1',
          title: 'Total Courses',
          description: 'All courses in the system',
          value: d.totalCourses ?? 0,
          displayValue: String(d.totalCourses ?? 0),
          trend: { value: 0, direction: 'up', label: 'total in DB' },
          icon: 'BookOpen',
          color: 'indigo',
        },
        {
          id: 'kpi-2',
          title: 'Draft Modules',
          description: 'Courses saved but not submitted',
          value: d.drafts ?? 0,
          displayValue: String(d.drafts ?? 0),
          subtitle: 'Drafts',
          icon: 'FileEdit',
          color: 'amber',
        },
        {
          id: 'kpi-3',
          title: 'Under Review',
          description: 'Courses waiting for manager approval',
          value: d.pendingReview ?? 0,
          displayValue: String(d.pendingReview ?? 0),
          subtitle: 'Courses',
          icon: 'ClipboardCheck',
          color: 'blue',
          highlight: (d.pendingReview ?? 0) > 0,
        },
        {
          id: 'kpi-4',
          title: 'Published Courses',
          description: 'Courses visible to employees',
          value: d.published ?? 0,
          displayValue: String(d.published ?? 0),
          subtitle: 'Published',
          icon: 'BadgeCheck',
          color: 'emerald',
        },
        {
          id: 'kpi-5',
          title: 'Ready to Publish',
          description: 'Manager-approved, awaiting HR publish',
          value: d.approved ?? 0,
          displayValue: String(d.approved ?? 0),
          subtitle: 'Approved',
          icon: 'AlertTriangle',
          color: 'orange',
          highlight: (d.approved ?? 0) > 0,
        },
        {
          id: 'kpi-6',
          title: 'Need Changes',
          description: 'Courses returned with manager feedback',
          value: d.needChanges ?? 0,
          displayValue: String(d.needChanges ?? 0),
          subtitle: 'Returned',
          icon: 'CalendarClock',
          color: 'violet',
        },
      ]);

      setRecentActivities(
        (d.recentActivities ?? []).map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          type: a.type,
          timestamp: a.timestamp,
          icon: a.icon,
        }))
      );

      // setPendingActions(
      //   (d.pendingActions ?? []).map((pa: any) => ({
      //     id: pa.id,
      //     title: pa.title,
      //     description: pa.description,
      //     count: pa.count,
      //     priority: pa.priority,
      //     actionLabel: pa.actionLabel,
      //     actionType: pa.actionType,
      //   }))
      // );
    } catch (err) {
      console.error('[HR Dashboard] Failed to load live data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // SSE — real-time refresh on course state changes (same SSE as manager)
    const es = new EventSource('http://localhost:8080/api/hr/events');
    es.addEventListener('course_update', () => {
      console.log('[SSE] HR Dashboard: course_update received, refreshing...');
      fetchDashboard();
    });
    es.addEventListener('course_review', () => {
      console.log('[SSE] HR Dashboard: course_review received, refreshing...');
      fetchDashboard();
    });
    es.onerror = () => {
      // SSE lost — silently ignore; data will still be accurate on next mount
    };
    return () => es.close();
  }, []);

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

      {/* Stats Grid — live from PostgreSQL */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-[20px] bg-surface-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <StatsGrid cards={kpiCards} />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
        <RecentActivities activities={recentActivities} />
        {/*<PendingActions actions={pendingActions} />*/}
      </div>

      {/* Bottom Spacer for mobile */}
      <div className="h-4 lg:hidden" />
    </motion.div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Clock, CheckCircle2, BarChart3,
  Maximize2, Share2, Loader2
} from 'lucide-react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart
} from 'recharts';
import { PageHeader, KPICard, ExportButton } from '../components/ui';
import { useAuditStore } from '../stores';
import { useUIStore } from '@/store/UIStore';
import { exportData } from '../lib/exportUtils';
import { api } from '@/api/client';

interface TrendPoint {
  period: string;
  completed: number;
  inProgress: number;
}

export default function TrendProgressPage() {
  const [timeframe, setTimeframe] = useState('Month');
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { addToast } = useUIStore();
  const addLog = useAuditStore(s => s.addLog);

  const fetchTrend = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const backendTimeframe = timeframe === 'Week' ? 'Weekly' : timeframe === 'Month' ? 'Monthly' : timeframe === 'Quarter' ? 'Quarterly' : 'Yearly';
      const res = await api.get(`/manager/dashboard/trend?timeframe=${backendTimeframe}`);
      setTrendData(res.data);
    } catch (err) {
      console.error('Failed to load trend data:', err);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrend(true);
  }, [timeframe]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrend(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [timeframe]);

  // Derive KPI stats from real trend data
  const kpiStats = useMemo(() => {
    if (trendData.length === 0) return { totalCompleted: 0, avgCompleted: 0, totalInProgress: 0, latestCompliance: 0 };
    const totalCompleted = trendData.reduce((s, d) => s + (d.completed ?? 0), 0);
    const avgCompleted = Math.round(totalCompleted / trendData.length);
    const totalInProgress = trendData.reduce((s, d) => s + (d.inProgress ?? 0), 0);
    // Compliance trend: % of completed out of completed+inProgress
    const totalActivity = totalCompleted + totalInProgress;
    const latestCompliance = totalActivity > 0 ? Math.round((totalCompleted / totalActivity) * 100) : 0;
    return { totalCompleted, avgCompleted, totalInProgress, latestCompliance };
  }, [trendData]);

  const handleExport = (fmt: string) => {
    addLog({ action: 'Report Downloaded', user: 'Sarah Mitchell', details: `Exported Trend Analytics (${fmt})` });
    exportData(fmt, {
      filename: 'trend_analytics_report',
      title: 'Learning Trend Analytics',
      headers: ['Period', 'Courses Completed', 'In Progress'],
      data: trendData.map(t => [t.period, t.completed, t.inProgress]),
      jsonData: trendData.map(t => ({ Period: t.period, Completed: t.completed, InProgress: t.inProgress }))
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast({
      type: 'success',
      title: 'Link Copied',
      message: 'Shareable link to trend analytics copied to clipboard.'
    });
  };

  const trendStats = [
    { title: 'Total Completions', value: String(kpiStats.totalCompleted), icon: CheckCircle2, gradient: 'gradient-primary', change: { value: 0, label: 'last 6 months' } },
    { title: 'Avg/Month', value: String(kpiStats.avgCompleted), icon: BarChart3, gradient: 'gradient-accent', change: { value: 0, label: 'completions per month' } },
    { title: 'In Progress', value: String(kpiStats.totalInProgress), icon: Clock, gradient: 'gradient-warning', change: { value: 0, label: 'active learners' } },
    { title: 'Completion Rate', value: `${kpiStats.latestCompliance}%`, icon: TrendingUp, gradient: 'bg-gradient-to-br from-primary-700 to-accent-600', change: { value: 0, label: 'of activity' } },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto text-left space-y-6">
      <PageHeader
        title="Trend Progress"
        subtitle="Analyze long-term learning patterns and organizational growth over time"
        actions={<ExportButton onExport={handleExport} />}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-2" />
          <span className="text-sm font-semibold text-surface-500">Loading trend data…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendStats.map((s, i) => (
              <KPICard key={s.title} {...s} delay={i * 0.1} />
            ))}
          </div>

          {/* Timeframe Filter Bar */}
          <div className="glass-card rounded-card p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Time-Based Filter</span>
            <div className="flex items-center gap-2">
              {['Week', 'Month', 'Quarter', 'Year'].map(t => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeframe === t
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {trendData.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center text-surface-400">
              <TrendingUp className="w-12 h-12 mx-auto text-surface-200 mb-3" />
              <p className="text-sm font-semibold">No trend data available yet.</p>
              <p className="text-xs mt-1">Data will appear once employees start completing courses.</p>
            </div>
          ) : (
            <>
              {/* Main Chart */}
              <div className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-surface-900 dark:text-white">Learning Engagement Trend</h3>
                      <p className="text-[10px] text-surface-500">Completions vs. In-Progress per period</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setIsExpanded(true)}
                        className="p-1 rounded hover:bg-surface-50 text-surface-400 hover:text-surface-600 transition-colors"
                        title="Expand Chart"
                      >
                        <Maximize2 className="w-4 h-4 cursor-pointer" />
                      </button>
                      <button 
                        onClick={handleShare}
                        className="p-1 rounded hover:bg-surface-50 text-surface-400 hover:text-surface-600 transition-colors"
                        title="Share Chart"
                      >
                        <Share2 className="w-4 h-4 cursor-pointer" />
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Bar yAxisId="left" dataKey="completed" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={24} name="Completed" />
                      <Line yAxisId="right" type="monotone" dataKey="inProgress" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }} name="In Progress" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Monthly Summary Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl overflow-hidden"
              >
                <div className="p-5 border-b border-surface-200 dark:border-surface-700">
                  <h3 className="font-bold text-surface-900 dark:text-white text-sm">Monthly Breakdown</h3>
                  <p className="text-[10px] text-surface-500 mt-0.5">Detailed view of each period's learning activity</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-50 dark:bg-surface-800/50">
                        {['Period', 'Courses Completed', 'In Progress', 'Completion Rate'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trendData.map((row, i) => {
                        const total = (row.completed ?? 0) + (row.inProgress ?? 0);
                        const rate = total > 0 ? Math.round(((row.completed ?? 0) / total) * 100) : 0;
                        return (
                          <tr key={i} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                            <td className="px-5 py-3 font-semibold text-surface-900 dark:text-white">{row.period}</td>
                            <td className="px-5 py-3 text-success-600 font-bold">{row.completed ?? 0}</td>
                            <td className="px-5 py-3 text-warning-600 font-bold">{row.inProgress ?? 0}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden max-w-[80px]">
                                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-xs font-bold text-surface-700">{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </>
      )}

      {/* Expand Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl w-full max-w-5xl overflow-hidden p-6 animate-fade-in"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">Learning Engagement Trend (Expanded)</h3>
                <p className="text-xs text-surface-500">Completions vs. In-Progress per period ({timeframe} view)</p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg hover:bg-surface-50 text-surface-400 hover:text-surface-600 transition-colors font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar yAxisId="left" dataKey="completed" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={32} name="Completed" />
                <Line yAxisId="right" type="monotone" dataKey="inProgress" stroke="#16a34a" strokeWidth={3} dot={{ r: 5, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }} name="In Progress" />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}
    </div>
  );
}

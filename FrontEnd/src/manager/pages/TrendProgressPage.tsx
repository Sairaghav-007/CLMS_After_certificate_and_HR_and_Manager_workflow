import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Clock, CheckCircle2, BarChart3,
  Maximize2, Share2, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Line, ComposedChart
} from 'recharts';
import { PageHeader, FilterBar, KPICard, ExportButton } from '../components/ui';
import { useAuditStore } from '../stores';
import { exportData } from '../lib/exportUtils';
import { api } from '@/api/client';

interface TrendPoint {
  period: string;
  completed: number;
  inProgress: number;
}

export default function TrendProgressPage() {
  const [filterCategory, setFilterCategory] = useState('Individual');
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('Month');
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const addLog = useAuditStore(s => s.addLog);

  useEffect(() => {
    api.get('/manager/dashboard/trend')
      .then(res => setTrendData(res.data))
      .catch(err => console.error('Failed to load trend data:', err))
      .finally(() => setLoading(false));
  }, []);

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

  const trendStats = [
    { title: 'Total Completions', value: String(kpiStats.totalCompleted), icon: CheckCircle2, gradient: 'gradient-primary', change: { value: 0, label: 'last 6 months' } },
    { title: 'Avg/Month', value: String(kpiStats.avgCompleted), icon: BarChart3, gradient: 'gradient-accent', change: { value: 0, label: 'completions per month' } },
    { title: 'In Progress', value: String(kpiStats.totalInProgress), icon: Clock, gradient: 'gradient-warning', change: { value: 0, label: 'active learners' } },
    { title: 'Completion Rate', value: `${kpiStats.latestCompliance}%`, icon: TrendingUp, gradient: 'bg-gradient-to-br from-indigo-500 to-blue-600', change: { value: 0, label: 'of activity' } },
  ];

  return (
    <div className="space-y-6">
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

          <FilterBar
            category={filterCategory}
            onCategoryChange={setFilterCategory}
            search={search}
            onSearchChange={setSearch}
            extra={
              <div className="flex items-center gap-2">
                {['Week', 'Month', 'Quarter', 'Year'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timeframe === t
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            }
          />

          {trendData.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center text-surface-400">
              <TrendingUp className="w-12 h-12 mx-auto text-surface-200 mb-3" />
              <p className="text-sm font-semibold">No trend data available yet.</p>
              <p className="text-xs mt-1">Data will appear once employees start completing courses.</p>
            </div>
          ) : (
            <>
              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-surface-900 dark:text-white">Learning Engagement Trend</h3>
                      <p className="text-[10px] text-surface-500">Completions vs. In-Progress per month</p>
                    </div>
                    <Maximize2 className="w-4 h-4 text-surface-400 cursor-pointer" />
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Bar yAxisId="left" dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} name="Completed" />
                      <Line yAxisId="right" type="monotone" dataKey="inProgress" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} name="In Progress" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-surface-900 dark:text-white">Completion Trajectory</h3>
                      <p className="text-[10px] text-surface-500">Monthly completion trend over time</p>
                    </div>
                    <Share2 className="w-4 h-4 text-surface-400 cursor-pointer" />
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="inProgressGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={3} fill="url(#completedGrad)" name="Completed" />
                      <Area type="monotone" dataKey="inProgress" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" fill="url(#inProgressGrad)" name="In Progress" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary-500" /><span className="text-[10px] text-surface-500">Completed</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-warning-500" /><span className="text-[10px] text-surface-500">In Progress</span></div>
                  </div>
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
    </div>
  );
}

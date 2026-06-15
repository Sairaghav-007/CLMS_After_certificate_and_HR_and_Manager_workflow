import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Clock, CheckCircle2, BarChart3, 
  ArrowUpRight, Maximize2, Share2, BookOpen, Users
} from 'lucide-react';
import { 
  AreaChart, Area, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  Line, ComposedChart
} from 'recharts';
import { PageHeader, FilterBar, KPICard, ExportButton } from '../components/ui';
import { mockTrendData } from '../data/mockData';
import { useAuditStore } from '../stores';
import { exportData } from '../lib/exportUtils';

export default function TrendProgressPage() {
  const [filterCategory, setFilterCategory] = useState('Individual');
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('Weekly');
  const addLog = useAuditStore(s => s.addLog);

  const handleExport = (fmt: string) => {
    addLog({ action: 'Report Downloaded', user: 'Sarah Mitchell', details: `Exported Trend Analytics (${fmt})` });

    exportData(fmt, {
      filename: 'trend_analytics_report',
      title: 'Learning Trend Analytics',
      headers: ['Period', 'Learning Hours', 'Courses Completed', 'Average Scores', 'Compliance Trend (%)'],
      data: mockTrendData.map(t => [
        t.period,
        t.learningHours,
        t.coursesCompleted,
        t.averageScores + '%',
        t.complianceTrend + '%'
      ]),
      jsonData: mockTrendData.map(t => ({
        'Period': t.period,
        'Hours': t.learningHours,
        'Completions': t.coursesCompleted,
        'Avg Score': t.averageScores,
        'Compliance': t.complianceTrend
      }))
    });
  };

  const trendStats = [
    { title: 'Avg Learning Hours', value: '184h', icon: Clock, gradient: 'gradient-primary', change: { value: 12.5, label: 'vs prev period' } },
    { title: 'Courses Completed', value: '142', icon: CheckCircle2, gradient: 'gradient-accent', change: { value: 8.2, label: 'vs prev period' } },
    { title: 'Average Score', value: '82.4%', icon: BarChart3, gradient: 'gradient-warning', change: { value: -2.1, label: 'vs prev period' } },
    { title: 'Compliance Trend', value: '91.5%', icon: TrendingUp, gradient: 'bg-gradient-to-br from-indigo-500 to-blue-600', change: { value: 4.8, label: 'vs prev period' } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trend Progress"
        subtitle="Analyze long-term learning patterns and organizational growth over time"
        actions={<ExportButton onExport={handleExport} />}
      />

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

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-surface-900 dark:text-black">Learning Engagement Trend</h3>
              <p className="text-[10px] text-surface-500">Correlation between hours and completions</p>
            </div>
            <Maximize2 className="w-4 h-4 text-surface-400 cursor-pointer" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar yAxisId="left" dataKey="learningHours" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="coursesCompleted" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} />
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
              <h3 className="text-sm font-bold text-surface-900 dark:text-black">Score & Compliance Outlook</h3>
              <p className="text-[10px] text-surface-500">Quality metrics over 12-week period</p>
            </div>
            <Share2 className="w-4 h-4 text-surface-400 cursor-pointer" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockTrendData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="averageScores" stroke="#f59e0b" strokeWidth={3} fill="url(#scoreGrad)" />
              <Area type="monotone" dataKey="complianceTrend" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-warning-500" /><span className="text-[10px] text-surface-500">Avg Score</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary-500" /><span className="text-[10px] text-surface-500">Compliance %</span></div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Best Performing Course', value: 'React Advanced', icon: BookOpen, color: 'text-primary-500', trend: 14.2 },
          { title: 'Highest Participation', value: 'Engineering Team', icon: Users, color: 'text-accent-500', trend: 8.5 },
          { title: 'Fastest Completion', value: 'Cybersecurity 101', icon: Clock, color: 'text-warning-500', trend: 31.4 },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="glass-card rounded-2xl p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest">{item.title}</p>
              <h4 className="text-sm font-bold text-surface-900 dark:text-black truncate">{item.value}</h4>
              <p className="text-[10px] text-accent-500 font-bold flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" /> +{item.trend}% growth
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


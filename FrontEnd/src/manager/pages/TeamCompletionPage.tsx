import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Clock, BarChart3, AlertTriangle, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { PageHeader, KPICard, ExportButton } from '../components/ui';
import { useAuditStore } from '../stores';
import { exportData } from '../lib/exportUtils';
import { api } from '@/api/client';

interface TeamRow {
  teamId: string;
  name: string;
  averageCompletion: number;
  status: string;
  learningHours: number;
  averageQuizScore: number;
  nonCompliantCount: number;
  memberCount: number;
}

// Custom tooltip for the bar chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value as number;
    return (
      <div style={{
        background: 'rgba(255,255,255,0.97)',
        border: 'none',
        borderRadius: '14px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
        padding: '12px 18px',
        color: '#0f172a',
        minWidth: 160,
      }}>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
          Avg Completion: <span style={{ fontSize: 15 }}>{val}%</span>
        </p>
        <div style={{
          marginTop: 6,
          height: 4,
          borderRadius: 99,
          background: '#e2e8f0',
          overflow: 'hidden',
        }}>
          <div style={{ width: `${val}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#a78bfa)', borderRadius: 99 }} />
        </div>
      </div>
    );
  }
  return null;
};

// Pick bar colour based on completion level
const barColor = (value: number) => {
  if (value >= 75) return '#22c55e';   // green
  if (value >= 40) return '#6366f1';   // indigo
  return '#f59e0b';                    // amber
};

export default function TeamCompletionPage() {
  const [timeframe, setTimeframe] = useState('Monthly');
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [metrics, setMetrics] = useState({
    completionRate: 0,
    totalHours: 0,
    avgScore: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);
  const addLog = useAuditStore(s => s.addLog);

  const loadData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const res = await api.get(`/manager/teams/completion?timeframe=${timeframe}`);
      setTeams(res.data.teams);
      setMetrics(res.data.metrics);
    } catch (err) {
      console.error('Failed to load team completion data:', err);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  const handleExport = (fmt: string) => {
    addLog({ action: 'Report Downloaded', user: 'Manager', details: `Exported Team Completion Report (${fmt})` });
    exportData(fmt, {
      filename: 'team_completion_report',
      title: 'Team Completion Analytics',
      headers: ['Team ID', 'Team Name', 'Average Completion Score', 'Status'],
      data: teams.map(team => [team.teamId, team.name, `${team.averageCompletion}%`, team.status]),
      jsonData: teams.map(team => ({ TeamID: team.teamId, TeamName: team.name, AverageCompletion: `${team.averageCompletion}%`, Status: team.status }))
    });
  };

  const kpiCards = [
    { title: 'Completion Rate', value: `${metrics.completionRate}%`, icon: CheckCircle2, gradient: 'gradient-accent', change: { value: 0, label: 'of assigned courses' } },
    { title: 'Team Learning Hours', value: `${metrics.totalHours}h`, icon: Clock, gradient: 'gradient-primary', change: { value: 0, label: 'total hours logged' } },
    { title: 'Avg Quiz Score', value: `${metrics.avgScore}%`, icon: BarChart3, gradient: 'gradient-warning', change: { value: 0, label: 'team average' } },
    { title: 'Non-Compliant', value: String(metrics.overdue), icon: AlertTriangle, gradient: 'gradient-danger', change: { value: 0, label: 'employees' } },
  ];

  // Chart data: short name + value
  const chartData = teams.map(t => ({
    name: t.name.length > 14 ? t.name.slice(0, 12) + '…' : t.name,
    fullName: t.name,
    completion: t.averageCompletion,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-2" />
        <span className="text-sm font-semibold text-surface-500">Loading Team Completion…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Completion"
        subtitle="Comprehensive analytics on team learning milestones and performance"
        actions={<ExportButton onExport={handleExport} />}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((s, i) => (
          <KPICard key={s.title} {...s} delay={i * 0.1} />
        ))}
      </div>

      {/* Timeframe Filter Bar */}
      <div className="glass-card rounded-card p-4 flex items-center justify-between">
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Time-Based Filter</span>
        <div className="flex items-center gap-2">
          {['Weekly', 'Monthly', 'Quarterly'].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

      {/* ── Bar Chart ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-surface-900 dark:text-white text-sm">
              Team Average Completion Score
            </h3>
            <p className="text-xs text-surface-500 mt-0.5">
              {timeframe} view · {teams.length} team{teams.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-semibold text-surface-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#22c55e' }} /> ≥ 75 %
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#6366f1' }} /> 40–74 %
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#f59e0b' }} /> &lt; 40 %
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm font-semibold text-surface-400">
            No teams found — create teams in the Admin panel first.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              barGap={8}
              margin={{ top: 18, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                className="dark:opacity-10"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                dx={-6}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 8 }} />
              <Bar
                dataKey="completion"
                name="Avg Completion"
                radius={[8, 8, 0, 0]}
                barSize={36}
                maxBarSize={56}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColor(entry.completion)} />
                ))}
                <LabelList
                  dataKey="completion"
                  position="top"
                  formatter={(v: any) => `${v}%`}
                  style={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* ── Team Table ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm">Team Overview</h3>
          <span className="text-xs text-surface-500">{teams.length} Teams</span>
        </div>
        {teams.length === 0 ? (
          <div className="p-12 text-center text-surface-400 text-sm font-semibold">No team data available yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50">
                  {['Team ID', 'Team Name', 'Team Average Completion Score', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.teamId} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                    <td className="px-5 py-3 text-xs text-surface-500 font-semibold">{team.teamId}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-left">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {team.name?.charAt(0) ?? 'T'}
                        </div>
                        <span className="font-semibold text-surface-900 dark:text-white text-xs">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-surface-900 dark:text-white w-10 shrink-0">{team.averageCompletion}%</span>
                        <div className="flex-1 h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden max-w-[120px]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(team.averageCompletion, 100)}%`,
                              background: barColor(team.averageCompletion),
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-left">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        team.status === 'Completed' ? 'bg-success-50 text-success-700 border border-success-200' :
                        team.status === 'In Progress' ? 'bg-primary-50 text-primary-700 border border-primary-200' :
                        'bg-surface-100 text-surface-700 border border-surface-200'
                      }`}>{team.status ?? 'Not Started'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

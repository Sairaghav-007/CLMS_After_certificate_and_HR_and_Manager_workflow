import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Clock, BarChart3, AlertTriangle, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { PageHeader, FilterBar, KPICard, ExportButton } from '../components/ui';
import { useAuditStore } from '../stores';
import { exportData } from '../lib/exportUtils';
import { api } from '@/api/client';

interface EmployeeRow {
  id: string;
  name: string;
  department: string;
  designation: string;
  completedCourses: number;
  assignedCourses: number;
  learningHours: number;
  averageQuizScore: number;
  status: string;
}

interface TrendPoint {
  period: string;
  completed: number;
  inProgress: number;
}

export default function TeamCompletionPage() {
  const [filterCategory, setFilterCategory] = useState('Individual');
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('Monthly');
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const addLog = useAuditStore(s => s.addLog);

  const loadData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const [empRes, trendRes] = await Promise.all([
        api.get('/manager/employees'),
        api.get('/manager/dashboard/trend'),
      ]);
      setEmployees(empRes.data);
      setTrendData(trendRes.data);
    } catch (err) {
      console.error('Failed to load team completion data:', err);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Compute KPI metrics from real data
  const metrics = useMemo(() => {
    const totalAssigned = employees.reduce((s, e) => s + (e.assignedCourses ?? 0), 0);
    const totalCompleted = employees.reduce((s, e) => s + (e.completedCourses ?? 0), 0);
    const totalHours = employees.reduce((s, e) => s + (e.learningHours ?? 0), 0);
    const overdue = employees.filter(e => e.status === 'Non-Compliant').length;
    const avgScore = employees.length > 0
      ? Math.round(employees.reduce((s, e) => s + (e.averageQuizScore ?? 0), 0) / employees.length)
      : 0;
    const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
    return { completionRate, totalHours, avgScore, overdue };
  }, [employees]);

  const handleExport = (fmt: string) => {
    addLog({ action: 'Report Downloaded', user: 'Manager', details: `Exported Team Completion Report (${fmt})` });
    exportData(fmt, {
      filename: 'team_completion_report',
      title: 'Team Completion Analytics',
      headers: ['Employee Name', 'Department', 'Designation', 'Completed', 'Assigned', 'Status'],
      data: employees.map(emp => [emp.name, emp.department, emp.designation, emp.completedCourses, emp.assignedCourses, emp.status]),
      jsonData: employees.map(emp => ({ Name: emp.name, Dept: emp.department, Role: emp.designation, Completed: emp.completedCourses, Total: emp.assignedCourses, Status: emp.status }))
    });
  };

  const kpiCards = [
    { title: 'Completion Rate', value: `${metrics.completionRate}%`, icon: CheckCircle2, gradient: 'gradient-accent', change: { value: 0, label: 'of assigned courses' } },
    { title: 'Team Learning Hours', value: `${metrics.totalHours}h`, icon: Clock, gradient: 'gradient-primary', change: { value: 0, label: 'total hours logged' } },
    { title: 'Avg Quiz Score', value: `${metrics.avgScore}%`, icon: BarChart3, gradient: 'gradient-warning', change: { value: 0, label: 'team average' } },
    { title: 'Non-Compliant', value: String(metrics.overdue), icon: AlertTriangle, gradient: 'gradient-danger', change: { value: 0, label: 'employees' } },
  ];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((s, i) => (
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
            {['Weekly', 'Monthly', 'Quarterly'].map(t => (
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-6">Monthly Completion Trend</h3>
          {trendData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-surface-400 text-xs font-semibold">No data available yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="tcCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={3} fill="url(#tcCompleted)" name="Completed" />
                <Area type="monotone" dataKey="inProgress" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" fill="transparent" name="In Progress" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-6">Department Completion Breakdown</h3>
          {employees.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-surface-400 text-xs font-semibold">No data available yet.</div>
          ) : (() => {
            // Group by department
            const deptMap: Record<string, { completed: number; assigned: number }> = {};
            employees.forEach(emp => {
              if (!deptMap[emp.department]) deptMap[emp.department] = { completed: 0, assigned: 0 };
              deptMap[emp.department].completed += emp.completedCourses ?? 0;
              deptMap[emp.department].assigned += emp.assignedCourses ?? 0;
            });
            const deptData = Object.entries(deptMap).map(([dept, v]) => ({
              dept: dept.length > 10 ? dept.slice(0, 9) + '…' : dept,
              rate: v.assigned > 0 ? Math.round((v.completed / v.assigned) * 100) : 0,
            }));
            return (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={deptData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis dataKey="dept" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(v: any) => [`${v}%`, 'Completion Rate']} />
                  <Bar dataKey="rate" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </motion.div>
      </div>

      {/* Employee list */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <h3 className="font-bold text-surface-900 dark:text-white text-sm">Team Members Overview</h3>
          <span className="text-xs text-surface-500">{employees.length} employees</span>
        </div>
        {employees.length === 0 ? (
          <div className="p-12 text-center text-surface-400 text-sm font-semibold">No employee data available yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50">
                  {['Employee', 'Department', 'Courses Done', 'Hours', 'Avg Score', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees
                  .filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()))
                  .slice(0, 20)
                  .map((emp) => (
                    <tr key={emp.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {emp.name?.charAt(0) ?? 'E'}
                          </div>
                          <span className="font-semibold text-surface-900 dark:text-white text-xs">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-surface-500">{emp.department}</td>
                      <td className="px-5 py-3 text-xs font-bold text-surface-900 dark:text-white">
                        {emp.completedCourses}/{emp.assignedCourses}
                      </td>
                      <td className="px-5 py-3 text-xs text-surface-500">{emp.learningHours}h</td>
                      <td className="px-5 py-3 text-xs font-bold text-surface-700">{emp.averageQuizScore}%</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          emp.status === 'Compliant' ? 'bg-success-50 text-success-700 border border-success-200' :
                          emp.status === 'Non-Compliant' ? 'bg-danger-50 text-danger-700 border border-danger-200' :
                          'bg-warning-50 text-warning-700 border border-warning-200'
                        }`}>{emp.status ?? 'Unknown'}</span>
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

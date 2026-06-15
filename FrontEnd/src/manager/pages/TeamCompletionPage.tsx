import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Clock, BarChart3, AlertTriangle, List 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { PageHeader, FilterBar, KPICard, ExportButton } from '../components/ui';
import { mockCompletionTrends, mockEmployees } from '../data/mockData';
import { useAuditStore } from '../stores';
import { exportData } from '../lib/exportUtils';

export default function TeamCompletionPage() {
  const [filterCategory, setFilterCategory] = useState('Individual');
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('Weekly');
  const addLog = useAuditStore(s => s.addLog);

  const handleExport = (fmt: string) => {
    addLog({ action: 'Report Downloaded', user: 'Sarah Mitchell', details: `Exported Team Completion Report (${fmt})` });
    
    exportData(fmt, {
      filename: 'team_completion_report',
      title: 'Team Completion Analytics',
      headers: ['Employee Name', 'Department', 'Designation', 'Completed', 'Assigned', 'Status'],
      data: mockEmployees.map(emp => [
        emp.name, 
        emp.department, 
        emp.designation, 
        emp.completedCourses, 
        emp.assignedCourses, 
        emp.status
      ]),
      jsonData: mockEmployees.map(emp => ({
        'Name': emp.name,
        'Dept': emp.department,
        'Role': emp.designation,
        'Completed': emp.completedCourses,
        'Total': emp.assignedCourses,
        'Status': emp.status
      }))
    });
  };

  const metrics = [
    { title: 'Completion Rate', value: '71.8%', icon: CheckCircle2, gradient: 'gradient-accent' },
    { title: 'Team Learning Hours', value: '1,248h', icon: Clock, gradient: 'gradient-primary' },
    { title: 'Pass Percentage', value: '84.2%', icon: BarChart3, gradient: 'gradient-warning' },
    { title: 'Overdue Employees', value: '6', icon: AlertTriangle, gradient: 'gradient-danger' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Completion"
        subtitle="Comprehensive analytics on team learning milestones and performance"
        actions={<ExportButton onExport={handleExport} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <KPICard key={m.title} {...m} delay={i * 0.1} />
        ))}
      </div>

      <FilterBar
        category={filterCategory}
        onCategoryChange={setFilterCategory}
        search={search}
        onSearchChange={setSearch}
        extra={
          <div className="flex items-center gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-semibold outline-none"
            >
              {['Weekly', 'Monthly', 'Quarterly', 'Yearly'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Completion Progress Rate</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary-500" />
              <span className="text-[10px] text-surface-500">Completed</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockCompletionTrends}>
              <defs>
                <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
              <XAxis dataKey="period" hide />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">Distribution Status</h3>
            <List className="w-4 h-4 text-surface-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockCompletionTrends.slice(-6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" className="dark:opacity-10" />
              <XAxis type="number" hide />
              <YAxis dataKey="period" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="inProgress" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="overdue" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {[
              { label: 'Completed', color: 'bg-accent-500' },
              { label: 'In Progress', color: 'bg-primary-500' },
              { label: 'Overdue', color: 'bg-danger-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[10px] text-surface-500 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <h3 className="font-bold text-surface-900 dark:text-white">Recent Team Events</h3>
          <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 font-medium">View All Events</button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockEmployees.slice(0, 5).map((emp, i) => (
              <div key={emp.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center font-bold text-surface-400 text-xs shadow-sm">
                  {new Date().getDate() - i} <br/> JUN
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-surface-900 dark:text-white">
                    {emp.name} completed <span className="text-primary-600">Cybersecurity Fundamentals</span>
                  </p>
                  <p className="text-[10px] text-surface-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {i * 2 + 1} hours ago • Score: {90 + i}%
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent-50 dark:bg-accent-950/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-accent-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}


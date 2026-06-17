import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Award, BarChart3, Mail, User, Calendar, Link2 as Linkedin, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { KPICard, PageHeader, Drawer, StatusBadge, ProgressBar } from '../components/ui';
import { api } from '@/api/client';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [employeeCourses, setEmployeeCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (selectedEmployee) {
      setLoadingCourses(true);
      api.get(`/manager/employees/${selectedEmployee.id}/courses`)
        .then(res => {
          setEmployeeCourses(res.data);
        })
        .catch(err => {
          console.error("Failed to load employee courses", err);
        })
        .finally(() => {
          setLoadingCourses(false);
        });
    } else {
      setEmployeeCourses([]);
    }
  }, [selectedEmployee]);

  const fetchData = async () => {
    try {
      const statsRes = await api.get('/manager/dashboard/stats');
      const activityRes = await api.get('/manager/dashboard/activity');
      const trendRes = await api.get('/manager/dashboard/trend');
      
      setStats(statsRes.data);
      setActivity(activityRes.data);
      setTrend(trendRes.data);
    } catch (error) {
      console.error("Failed to load manager dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time SSE listener
    const eventSource = new EventSource("http://localhost:8080/api/manager/dashboard/events");
    
    eventSource.addEventListener("course_review", () => {
      console.log("[SSE] Course review update received. Refreshing dashboard...");
      fetchData();
    });

    eventSource.addEventListener("employee_nudge", () => {
      console.log("[SSE] Employee nudge logged. Refreshing dashboard...");
      fetchData();
    });

    eventSource.onmessage = (event) => {
      console.log("[SSE] Message received:", event.data);
      fetchData();
    };

    // Polling backup
    const interval = setInterval(() => {
      fetchData();
    }, 15000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 font-semibold text-surface-500">Loading Manager Dashboard...</span>
      </div>
    );
  }

  const kpiCards = [
    { title: 'Total Team Members', value: stats.totalTeamMembers, icon: Users, gradient: 'gradient-primary', change: { value: 4, label: 'vs last month' } },
    { title: 'Assigned Courses', value: stats.assignedCourses, icon: BookOpen, gradient: 'bg-gradient-to-br from-violet-500 to-primary-600', change: { value: 12, label: 'new this month' } },
    { title: 'Completed Courses', value: stats.completedCourses, icon: CheckCircle2, gradient: 'gradient-accent', change: { value: 8, label: 'this week' } },
    { title: 'In Progress', value: stats.inProgressCourses, icon: Clock, gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600', change: { value: -3, label: 'fewer pending' } },
    { title: 'Overdue Employees', value: stats.overdueEmployees, icon: AlertTriangle, gradient: 'gradient-danger', change: { value: -2, label: 'improvement' } },
    { title: 'Team Completion Rate', value: `${stats.teamCompletionRate}%`, icon: TrendingUp, gradient: 'gradient-accent', change: { value: 5.2, label: 'vs last quarter' } },
    { title: 'Average Quiz Score', value: `${stats.averageQuizScore}%`, icon: BarChart3, gradient: 'gradient-warning', change: { value: 2.1, label: 'vs last month' } },
    { title: 'Certificates Earned', value: stats.certificatesEarned, icon: Award, gradient: 'bg-gradient-to-br from-amber-500 to-orange-600', change: { value: 15, label: 'this month' } },
  ];

  const pieData = [
    { name: 'Compliant', value: activity.filter(e => e.status === 'Compliant').length, color: '#22c55e' },
    { name: 'At Risk', value: activity.filter(e => e.status === 'At Risk').length, color: '#f59e0b' },
    { name: 'Non-Compliant', value: activity.filter(e => e.status === 'Non-Compliant').length, color: '#ef4444' },
  ];

  // Derive department performance dynamically
  const deptData = (() => {
    const depts = new Map<string, { completed: number; total: number }>();
    activity.forEach(e => {
      const d = depts.get(e.department) || { completed: 0, total: 0 };
      d.completed += e.completedCourses;
      d.total += e.assignedCourses;
      depts.set(e.department, d);
    });
    return Array.from(depts.entries()).map(([dept, d]) => ({
      department: dept,
      completed: d.completed,
      assigned: d.total,
      rate: Math.round((d.completed / d.total) * 100),
    }));
  })();

  return (
    <div>
      <PageHeader
        title="Manager Dashboard"
        subtitle="Learning Operations Control Center — Real-time team insights"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((kpi, i) => (
          <KPICard key={kpi.title} {...kpi} delay={i * 0.05} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Completion Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card rounded-card p-6"
        >
          <h3 className="text-2xl font-bold text-surface-900 mb-6 tracking-tight">Completion Trend</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-10" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                  color: '#0f172a',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px', color: '#94a3b8' }} iconType="circle" />
              <Area type="monotone" dataKey="completed" stroke="#6366f1" fill="url(#completedGrad)" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              <Area type="monotone" dataKey="inProgress" stroke="#22c55e" fill="url(#progressGrad)" strokeWidth={3} dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Team Compliance Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-card p-6"
        >
          <h3 className="text-2xl font-bold text-surface-900 mb-6 tracking-tight">Compliance</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  color: '#0f172a',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-3 mt-6">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-surface-50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs font-bold text-surface-700">
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-surface-900">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Department Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-card p-6 mb-8"
      >
        <h3 className="text-2xl font-bold text-surface-900 mb-6 tracking-tight">Performance by Department</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={deptData} barGap={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-10" vertical={false} />
            <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.95)',
                border: 'none',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                color: '#0f172a',
              }}
            />
            <Bar dataKey="completed" fill="#6366f1" radius={[8, 8, 0, 0]} name="Completed" barSize={32} />
            <Bar dataKey="assigned" fill="#e2e8f0" radius={[8, 8, 0, 0]} name="Assigned" barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card rounded-card p-6"
      >
        <h3 className="text-2xl font-bold text-surface-900 mb-6 tracking-tight">Real-time Team Activity</h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {activity.map((emp, i) => (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              onClick={() => setSelectedEmployee(emp)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-100/80 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {emp.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-surface-900 truncate">{emp.name}</p>
                <p className="text-[10px] text-surface-500">{emp.department} • {emp.designation}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-surface-900">{emp.completedCourses}/{emp.assignedCourses}</p>
                <p className="text-[10px] text-surface-500">courses</p>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                emp.status === 'Compliant' ? 'bg-success-500' : emp.status === 'At Risk' ? 'bg-warning-500' : 'bg-danger-500'
              }`} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Employee Detail Drawer */}
      <Drawer
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title="Employee Details"
      >
        {selectedEmployee && (
          <div className="space-y-6 text-left">
            {/* Employee Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-750 flex items-center justify-center text-xl font-bold shadow-lg shadow-primary-500/10">
                {selectedEmployee.avatar || 'E'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900">{selectedEmployee.name}</h3>
                <p className="text-xs text-surface-500 mb-1">{selectedEmployee.id} • {selectedEmployee.designation || 'Software Engineer'}</p>
                <StatusBadge status={selectedEmployee.status} size="md" />
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mail, label: 'Email', value: selectedEmployee.email },
                { icon: User, label: 'Department', value: selectedEmployee.department },
                { icon: Award, label: 'Designation', value: selectedEmployee.designation || 'Software Developer' },
                { icon: Calendar, label: 'Joining Date', value: selectedEmployee.joiningDate || '2026-03-01' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-surface-50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="w-3 h-3 text-surface-400" />
                    <span className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">{item.label}</span>
                  </div>
                  <p className="text-xs font-semibold text-surface-900 truncate">{item.value}</p>
                </div>
              ))}

              {/* LinkedIn URL Link display */}
              <div className="p-3 rounded-xl bg-surface-50 col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-primary-500" />
                  <div>
                    <span className="text-[10px] text-surface-500 uppercase tracking-wider font-medium block">LinkedIn Profile</span>
                    {selectedEmployee.linkedinUrl ? (
                      <a 
                        href={selectedEmployee.linkedinUrl}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline truncate max-w-[280px] block"
                      >
                        {selectedEmployee.linkedinUrl}
                      </a>
                    ) : (
                      <span className="text-xs text-surface-400 font-semibold">No URL provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Summary */}
            <div>
              <h4 className="text-sm font-bold text-surface-900 mb-3">Learning Summary</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Assigned', value: selectedEmployee.assignedCourses, icon: BookOpen, color: 'text-primary-500' },
                  { label: 'Completed', value: selectedEmployee.completedCourses, icon: CheckCircle2, color: 'text-accent-500' },
                  { label: 'In Progress', value: selectedEmployee.inProgressCourses, icon: Clock, color: 'text-warning-500' },
                  { label: 'Certificates', value: selectedEmployee.certificatesEarned || 0, icon: Award, color: 'text-primary-500' },
                  { label: 'Hours', value: selectedEmployee.learningHours || 0, icon: Clock, color: 'text-cyan-500' },
                  { label: 'Avg Score', value: `${selectedEmployee.averageQuizScore || 0}%`, icon: BarChart3, color: 'text-amber-500' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 rounded-xl bg-surface-50">
                    <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
                    <p className="text-lg font-bold text-surface-900">{item.value}</p>
                    <p className="text-[10px] text-surface-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Progress */}
            <div>
              <h4 className="text-sm font-bold text-surface-900 mb-3">Course Progress</h4>
              {loadingCourses ? (
                <div className="py-6 text-center text-xs text-surface-500 font-semibold">
                  <Loader2 className="animate-spin w-5 h-5 mx-auto mb-2 text-primary-500" />
                  <span>Loading progress records...</span>
                </div>
              ) : employeeCourses.length === 0 ? (
                <div className="py-4 text-center text-xs text-surface-450 font-semibold bg-surface-50 rounded-xl">
                  No courses assigned to this employee.
                </div>
              ) : (
                <div className="space-y-2">
                  {employeeCourses.map(course => (
                    <div key={course.courseId} className="p-3 rounded-xl bg-surface-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-surface-900">{course.courseName}</p>
                        <StatusBadge status={course.status} />
                      </div>
                      <ProgressBar
                        value={course.completionPercent}
                        color={course.status === 'Completed' ? 'bg-accent-500' : course.status === 'Overdue' ? 'bg-danger-500' : 'bg-primary-500'}
                        size="md"
                      />
                      <p className="text-[10px] text-surface-500 mt-1">Due: {course.dueDate}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import { useAuthStore, useCourseStore } from "../shared/store";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Award,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn, formatRelativeDate, getDueDateColor } from "@/shared/utils";
import { DashboardSkeleton } from "@/shared/components/Skeleton";
import { CompletionStatus, CourseCategory } from "@/shared/types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } },
} as const;

interface DashboardData {
  completedCourses: number;
  dueCourses: number;
  inProgressCourses: number;
  upcomingCourses: number;
  chartLabels: string[];
  chartValues: number[];
}

export function EmployeeDashboard() {
  const [dbData, setDbData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const { courses, setCourses } = useCourseStore();
  const navigate = useNavigate();

  // Load Dashboard Stats & Course Library
  useEffect(() => {
    setLoading(true);
    const fetchDashboard = api.get("/employee/dashboard").then((res) => setDbData(res.data));
    const fetchCourses = api.get("/employee/courses").then((res) => {
      // Map API course values into store structure
      const localCourses = useCourseStore.getState().courses;
      const mapped = res.data.map((bc: any) => {
        const existing = localCourses.find((e) => e.id === String(bc.id));
        
        const categoryMap: Record<string, CourseCategory> = {
          MANDATORY: CourseCategory.MANDATORY,
          COMPLIANCE: CourseCategory.MANDATORY,
          TECHNICAL: CourseCategory.ELECTIVE,
          ELECTIVE: CourseCategory.ELECTIVE,
          HR: CourseCategory.DEPARTMENT,
        };

        const mappedCategory = categoryMap[bc.category?.toUpperCase()] || CourseCategory.ELECTIVE;
        const duration = existing?.duration || 6;

        return {
          id: String(bc.id),
          title: bc.title,
          description: bc.description,
          thumbnail: bc.thumbnail || "",
          category: mappedCategory,
          instructor: existing?.instructor || {
            id: "INS-DEFAULT",
            name: "Corporate Trainer",
            title: "L&D Director",
            avatar: "",
            bio: "Acme Corp corporate compliance and technology instructor.",
          },
          duration,
          totalModules: existing?.modules?.length || 2,
          totalAssessments: 1,
          progress: bc.progressPercent !== undefined ? bc.progressPercent : (existing?.progress || 0),
          status: bc.status?.toLowerCase() === "completed" ? CompletionStatus.COMPLETED : 
                  bc.status?.toLowerCase() === "in_progress" ? CompletionStatus.IN_PROGRESS : 
                  (existing?.status || CompletionStatus.NOT_STARTED),
          dueDate: bc.dueDate,
          assignedDate: "2026-05-15",
          lastUpdated: "2026-06-01",
          objectives: existing?.objectives || [
            "Understand regulatory compliance and security parameters.",
            "Incorporate standard processes into daily activities.",
            "Verify controls are active and report performance issues."
          ],
          learningOutcomes: existing?.learningOutcomes || [
            "Outline key guidelines of the corporate subject matter.",
            "Recognize and resolve non-compliance events.",
            "Implement secure coding workflows."
          ],
          completionCriteria: "Complete all sections and score 80% on final quiz.",
          passingPercentage: 80,
          modules: existing?.modules || [],
          assessment: existing?.assessment,
          certificate: existing?.certificate,
          popularity: 90,
          department: "Engineering",
        };
      });
      setCourses(mapped);
    });

    Promise.all([fetchDashboard, fetchCourses])
      .finally(() => setLoading(false));
  }, [setCourses]);

  // Derived dashboard statistics from CourseStore (real-time progress updates)
  const dashboardStats = useMemo(() => {
    const total = courses.length;
    const completed = courses.filter((c) => c.progress === 100).length;
    const certs = courses.filter((c) => c.certificate).length;
    const hours = courses.reduce((acc, c) => acc + (c.progress / 100) * c.duration, 0);
    const pendingMandatory = courses.filter((c) => c.category === CourseCategory.MANDATORY && c.progress < 100).length;
    const inProgress = courses.filter((c) => c.progress > 0 && c.progress < 100).length;

    return {
      assigned: total,
      completed,
      certificates: certs,
      hoursLearned: parseFloat(hours.toFixed(1)),
      mandatoryPending: pendingMandatory,
      inProgress,
    };
  }, [courses]);

  // Chart Progress data derived from SpringBoot Dashboard payload
  const progressChartData = useMemo(() => {
    if (!dbData) return [];
    return dbData.chartLabels.map((label, index) => ({
      name: label,
      hours: dbData.chartValues[index],
    }));
  }, [dbData]);

  // Pie Chart Distribution (mapped categories)
  const distributionData = useMemo(() => {
    const map: Record<string, { count: number; color: string }> = {
      [CourseCategory.MANDATORY]: { count: 0, color: "#ef4444" }, // Red
      [CourseCategory.ELECTIVE]: { count: 0, color: "#3b82f6" },  // Blue
      [CourseCategory.DEPARTMENT]: { count: 0, color: "#8b5cf6" }, // Purple
    };

    courses.forEach((c) => {
      if (map[c.category]) {
        map[c.category].count += 1;
      }
    });

    const list = Object.entries(map).map(([cat, val]) => ({
      category: cat.toUpperCase(),
      count: val.count,
      color: val.color,
    })).filter((item) => item.count > 0);

    const total = list.reduce((sum, entry) => sum + entry.count, 0);
    return list.map(entry => ({
      ...entry,
      percentage: total > 0 ? Math.round((entry.count / total) * 100) : 0
    }));
  }, [courses]);

  // Urgent upcoming due dates derived from courses
  const urgentCourses = useMemo(() => {
    return courses
      .filter((c) => c.progress < 100)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
  }, [courses]);

  // Active in-progress courses
  const activeLearningCourses = useMemo(() => {
    return courses.filter((c) => c.progress > 0 && c.progress < 100);
  }, [courses]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto text-left font-sans">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-surface-900 tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">{user?.fullName?.split(' ')[0] || 'Employee'}</span>
          </h1>
          <p className="text-surface-500 mt-1 text-sm font-medium">
            Track your learning progress and stay on schedule
          </p>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Assigned', value: dashboardStats.assigned, icon: BookOpen, bgLight: 'bg-primary-50 text-primary-600 border-primary-100' },
            { label: 'Completed', value: dashboardStats.completed, icon: CheckCircle, bgLight: 'bg-success-50 text-success-600 border-success-100' },
            { label: 'Certificates', value: dashboardStats.certificates, icon: Award, bgLight: 'bg-accent-50 text-accent-600 border-accent-100' },
            { label: 'Hours Learned', value: `${dashboardStats.hoursLearned}h`, icon: Clock, bgLight: 'bg-blue-50 text-blue-600 border-blue-100' },
            { label: 'Mandatory Pending', value: dashboardStats.mandatoryPending, icon: AlertTriangle, bgLight: 'bg-danger-50 text-danger-600 border-danger-100' },
            { label: 'In Progress', value: dashboardStats.inProgress, icon: TrendingUp, bgLight: 'bg-warning-50 text-warning-600 border-warning-100' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="bg-white rounded-2xl border border-surface-200/80 p-4 lg:p-5 hover:shadow-lg hover:border-surface-300/80 transition-all duration-300 flex flex-col items-start"
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border mb-3', stat.bgLight)}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-2xl lg:text-3xl font-black text-surface-900 tracking-tight">{stat.value}</p>
              <p className="text-[11px] text-surface-400 mt-1 font-black uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Progress Area Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-3 bg-white rounded-2xl border border-surface-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-surface-900 tracking-tight">Learning Hours Trend</h2>
              <p className="text-xs text-surface-400 font-semibold mt-0.5">Completion overview from SpringBoot metrics</p>
            </div>

            <div className="h-[280px] w-full">
              {progressChartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-surface-400">
                  <Clock size={28} className="text-surface-200 mb-2" />
                  <span className="text-xs">No trend statistics found.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      dy={8}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    />
                    <ChartTooltip
                      cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-xl border border-surface-200/80 text-left min-w-[140px]">
                              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1.5">{label}</p>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-bold text-surface-600 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                  Hours Learned
                                </span>
                                <span className="text-xs font-black text-surface-900">{payload[0].value}h</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Category Distribution Pie Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl border border-surface-200/80 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-surface-900 tracking-tight">Category Distribution</h2>
              <p className="text-xs text-surface-400 font-semibold mt-0.5">Assigned courses sorted by category types</p>
            </div>

            <div className="h-[220px] w-full relative flex items-center justify-center">
              {distributionData.length === 0 ? (
                <div className="text-surface-400 flex flex-col items-center justify-center">
                  <BookOpen size={28} className="text-surface-200 mb-2" />
                  <span className="text-xs">No distribution records.</span>
                </div>
              ) : (
                <>
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-surface-950">{courses.length}</span>
                    <span className="text-[9px] font-black uppercase text-surface-400 tracking-widest mt-0.5">Courses</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={6}
                        dataKey="count"
                        nameKey="category"
                        stroke="none"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              {distributionData.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-50 border border-surface-100">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-bold text-surface-600 capitalize text-[11px]">{item.category.toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-surface-500">
                    <span>{item.count} Course{item.count !== 1 ? 's' : ''}</span>
                    <span className="font-black text-surface-900 text-[11px]">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Rows: Deadlines & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Due Dates */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-surface-200/80 p-6 text-left">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-warning-50 flex items-center justify-center text-warning-600 border border-warning-100">
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-md font-bold text-surface-900 leading-tight">Upcoming Deadlines</h2>
                <p className="text-[11px] text-surface-400 font-semibold mt-0.5">Complete assigned materials on time</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {urgentCourses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/employee/courses/${course.id}`)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50 hover:bg-surface-100/80 border border-surface-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full bg-warning-500 flex-shrink-0 animate-pulse" />
                    <span className="text-xs font-semibold text-surface-800 truncate leading-none">{course.title}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={cn('text-xs font-black whitespace-nowrap uppercase tracking-wider', getDueDateColor(course.dueDate))}>
                      {formatRelativeDate(course.dueDate)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
              {urgentCourses.length === 0 && (
                <div className="text-center py-10 text-xs text-surface-400 font-medium">
                  No upcoming deadlines. You are all caught up!
                </div>
              )}
            </div>
          </motion.div>

          {/* Continue Learning */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-surface-200/80 p-6 text-left">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-100">
                  <Flame className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-md font-bold text-surface-900 leading-tight">Continue Learning</h2>
                  <p className="text-[11px] text-surface-400 font-semibold mt-0.5">Resume where you recently paused</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/employee/courses')}
                className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                View Library
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {activeLearningCourses.slice(0, 4).map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/employee/courses/${course.id}`)}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-surface-50 hover:bg-surface-100/80 border border-surface-100 transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center flex-shrink-0 border border-primary-200/50">
                    <BookOpen className="w-4.5 h-4.5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-surface-900 truncate leading-none mb-1">{course.title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-surface-400 font-black whitespace-nowrap">{course.progress}%</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </motion.div>
              ))}
              {activeLearningCourses.length === 0 && (
                <div className="text-center py-10 text-xs text-surface-400 font-medium">
                  No courses in progress. Open your Course library to start a module!
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

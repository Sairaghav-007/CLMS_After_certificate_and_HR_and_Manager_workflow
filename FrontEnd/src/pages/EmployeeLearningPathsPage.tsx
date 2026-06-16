import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, Clock, BookOpen, CheckCircle, ArrowRight, Building2, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../shared/store';
import { cn } from '@/shared/utils';

interface LearningPath {
  id: string;
  name: string;
  description: string;
  duration: number;
  department: string;
}

interface CourseItem {
  id: string;
  title: string;
  progressPercent: number;
  status: string;
  dueDate: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } },
} as const;

export function EmployeeLearningPathsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pathsRes, coursesRes] = await Promise.all([
          api.get('/admin/learning-paths'),
          api.get('/employee/courses'),
        ]);
        setPaths(pathsRes.data);
        setCourses(
          coursesRes.data.map((c: any) => ({
            id: String(c.id),
            title: c.title,
            progressPercent: c.progressPercent ?? 0,
            status: c.status ?? 'NOT_STARTED',
            dueDate: c.dueDate ?? '',
          }))
        );
      } catch (err) {
        console.error('Failed to load learning paths:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Filter paths by employee's department (case-insensitive, "All" matches all)
  const myPaths = useMemo(() => {
    const dept = user?.department?.toLowerCase() ?? '';
    return paths.filter(
      (p) => p.department.toLowerCase() === dept || p.department.toLowerCase() === 'all'
    );
  }, [paths, user]);

  // Courses matching department or mandatory
  const departmentCourses = useMemo(() => courses, [courses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-3" />
        <span className="text-sm font-semibold text-surface-500">Loading Learning Paths…</span>
      </div>
    );
  }

  const completedCount = departmentCourses.filter((c) => c.status?.toLowerCase() === 'completed').length;
  const totalCount = departmentCourses.length;
  const overallPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Map className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-surface-900 tracking-tight">
              My Learning Paths
            </h1>
            <p className="text-surface-500 text-sm font-medium">
              Structured training programs assigned to your department
            </p>
          </div>
        </div>

        {/* Overall summary bar */}
        {totalCount > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-surface-200 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-surface-500 mb-2">
                <span>Overall Department Progress</span>
                <span className="text-surface-900">{completedCount}/{totalCount} Completed</span>
              </div>
              <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${overallPct}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                />
              </div>
            </div>
            <div className="text-3xl font-black text-surface-900 flex-shrink-0">{overallPct}%</div>
          </div>
        )}
      </motion.div>

      {myPaths.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-surface-200"
        >
          <Map className="w-16 h-16 text-surface-200 mb-4" />
          <h3 className="text-base font-bold text-surface-700 mb-1">No Learning Paths Yet</h3>
          <p className="text-xs text-surface-400 font-semibold text-center max-w-xs">
            No learning paths have been assigned to your department ({user?.department ?? 'Unknown'}) yet. Check back later.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Path Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="lg:col-span-1 space-y-4"
          >
            <h2 className="text-xs font-black uppercase tracking-widest text-surface-400 mb-3">
              {myPaths.length} Path{myPaths.length !== 1 ? 's' : ''} Available
            </h2>
            {myPaths.map((path) => (
              <motion.div
                key={path.id}
                variants={itemVariants}
                onClick={() => setSelectedPath(path)}
                className={cn(
                  'p-5 rounded-2xl border cursor-pointer transition-all duration-200',
                  selectedPath?.id === path.id
                    ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-accent-50 shadow-md shadow-primary-200/40'
                    : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow-md'
                )}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 border border-primary-200/50 flex items-center justify-center flex-shrink-0">
                    <Map className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-surface-900 leading-tight truncate">{path.name}</h3>
                    <span className={cn(
                      'text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider mt-1 inline-block',
                      path.department.toLowerCase() === 'all'
                        ? 'bg-purple-50 text-purple-600 border border-purple-100'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    )}>
                      {path.department}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-surface-500 line-clamp-2 leading-relaxed mb-3">
                  {path.description}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-surface-400 font-bold">
                  <Clock className="w-3 h-3" />
                  <span>{path.duration}h estimated duration</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {selectedPath ? (
              <motion.div
                key={selectedPath.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-surface-200 p-6 space-y-6"
              >
                {/* Path Header */}
                <div className="flex items-start gap-4 pb-4 border-b border-surface-100">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
                    <Map className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-surface-900">{selectedPath.name}</h2>
                    <p className="text-xs text-surface-500 font-medium mt-1 leading-relaxed">
                      {selectedPath.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-surface-400">
                        <Clock className="w-3 h-3" /> {selectedPath.duration}h
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-surface-400">
                        <Building2 className="w-3 h-3" /> {selectedPath.department}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Courses in this path */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-surface-400 mb-4">
                    Your Courses ({departmentCourses.length})
                  </h3>

                  {departmentCourses.length === 0 ? (
                    <div className="text-center py-12 text-surface-400">
                      <BookOpen className="w-10 h-10 mx-auto text-surface-200 mb-3" />
                      <p className="text-xs font-semibold">No courses available yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {departmentCourses.map((course) => {
                        const isCompleted = course.status?.toLowerCase() === 'completed';
                        const pct = course.progressPercent ?? 0;
                        return (
                          <motion.div
                            key={course.id}
                            whileHover={{ x: 3 }}
                            onClick={() => navigate(`/employee/courses/${course.id}`)}
                            className="flex items-center gap-4 p-4 rounded-xl border border-surface-100 bg-surface-50/40 hover:bg-surface-50 hover:border-surface-200 cursor-pointer transition-all group"
                          >
                            <div className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border',
                              isCompleted
                                ? 'bg-success-50 border-success-200 text-success-600'
                                : 'bg-primary-50 border-primary-100 text-primary-600'
                            )}>
                              {isCompleted ? <CheckCircle className="w-4.5 h-4.5" /> : <BookOpen className="w-4.5 h-4.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-surface-900 truncate group-hover:text-primary-700 transition-colors">
                                {course.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={false}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6 }}
                                    className={cn(
                                      'h-full rounded-full',
                                      isCompleted
                                        ? 'bg-gradient-to-r from-success-400 to-success-500'
                                        : 'bg-gradient-to-r from-primary-400 to-accent-500'
                                    )}
                                  />
                                </div>
                                <span className="text-[10px] font-black text-surface-400 whitespace-nowrap">{pct}%</span>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[360px] bg-white rounded-2xl border border-surface-200 border-dashed">
                <Map className="w-14 h-14 text-surface-200 mb-3" />
                <h3 className="text-sm font-bold text-surface-700 mb-1">Select a Learning Path</h3>
                <p className="text-xs text-surface-400 font-medium text-center max-w-[220px]">
                  Click a path on the left to view its details and your course progress.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

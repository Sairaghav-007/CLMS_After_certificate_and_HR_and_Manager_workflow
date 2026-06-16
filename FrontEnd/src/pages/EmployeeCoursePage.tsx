import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  Clock,
  BookOpen,
  FileText,
  Play,
  Eye,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useDebounce } from '@/shared/hooks';
import { useCourseStore } from '@/shared/store';
import { CourseCategory, CompletionStatus } from '@/shared/types';
import type { Course } from '@/shared/types';
import { cn, formatDuration, formatRelativeDate, getDueDateColor, formatDate } from '@/shared/utils';
import { CourseCardSkeleton } from '@/shared/components/Skeleton';
import { api } from '../api/client';

const categoryConfig = {
  [CourseCategory.MANDATORY]: { label: 'Mandatory', color: 'bg-danger-500/10 text-danger-600 border-danger-200' },
  [CourseCategory.ELECTIVE]: { label: 'Elective', color: 'bg-primary-500/10 text-primary-600 border-primary-200' },
  [CourseCategory.DEPARTMENT]: { label: 'Department Assigned', color: 'bg-accent-500/10 text-accent-600 border-accent-200' },
};

const statusConfig = {
  [CompletionStatus.NOT_STARTED]: { label: 'Not Started', icon: AlertCircle, color: 'text-surface-450' },
  [CompletionStatus.IN_PROGRESS]: { label: 'In Progress', icon: Clock, color: 'text-primary-500' },
  [CompletionStatus.COMPLETED]: { label: 'Completed', icon: CheckCircle, color: 'text-success-500' },
};

function CourseCard({ course, index }: { course: Course; index: number }) {
  const navigate = useNavigate();
  const catConfig = categoryConfig[course.category] || categoryConfig[CourseCategory.ELECTIVE];
  const statConfig = statusConfig[course.status] || statusConfig[CompletionStatus.NOT_STARTED];
  const StatusIcon = statConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', damping: 20 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl border border-surface-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-surface-300 transition-all duration-300 group flex flex-col text-left"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-surface-100 to-surface-200 overflow-hidden flex-shrink-0">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center ${course.thumbnail ? 'bg-black/20' : 'bg-gradient-to-br from-primary-600/80 via-accent-600/60 to-primary-800/80'}`}>
          {!course.thumbnail && <BookOpen className="w-12 h-12 text-white/20" />}
        </div>
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm bg-white/95', catConfig.color)}>
            {catConfig.label}
          </span>
        </div>
        {/* Status */}
        <div className="absolute top-3 right-3">
          <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 border border-surface-200 shadow-sm', statConfig.color)}>
            <StatusIcon className="w-3 h-3" />
            {statConfig.label}
          </span>
        </div>
        {/* Progress Bar overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-700"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-sm font-black text-surface-900 line-clamp-2 mb-1.5 group-hover:text-primary-700 transition-colors leading-snug tracking-tight">
          {course.title}
        </h3>
        <p className="text-xs text-surface-500 line-clamp-2 mb-4 leading-relaxed">{course.description}</p>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-300 to-accent-300 flex items-center justify-center text-white text-[10px] font-bold">
            {course.instructor.name.charAt(0)}
          </div>
          <span className="text-[11px] text-surface-600 font-semibold">{course.instructor.name}</span>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-surface-400 font-bold mb-4 border-b border-surface-100 pb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(course.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            {course.totalModules} modules
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {course.totalAssessments} quiz
          </span>
        </div>

        {/* Progress percentage */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
            <span className="text-surface-400">Progress</span>
            <span className="text-surface-700">{course.progress}%</span>
          </div>
          <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={cn(
                'h-full rounded-full',
                course.progress >= 100
                  ? 'bg-gradient-to-r from-success-400 to-success-500'
                  : 'bg-gradient-to-r from-primary-400 to-accent-500'
              )}
            />
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center justify-between mb-5 text-[11px]">
          <span className={cn('font-bold uppercase tracking-wider', getDueDateColor(course.dueDate))}>
            {formatRelativeDate(course.dueDate)}
          </span>
          <span className="text-surface-400 font-semibold">Due {formatDate(course.dueDate)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => navigate(`/employee/courses/${course.id}`)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm',
              course.status === CompletionStatus.COMPLETED
                ? 'bg-success-50 text-success-700 hover:bg-success-100 border border-success-200'
                : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-primary-500/10'
            )}
          >
            {course.status === CompletionStatus.COMPLETED ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                View Course
              </>
            ) : course.status === CompletionStatus.IN_PROGRESS ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Start
              </>
            )}
          </button>
          <button
            onClick={() => navigate(`/employee/courses/${course.id}`)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-surface-600 bg-surface-100 hover:bg-surface-200 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function EmployeeCoursesPage() {
  const { filters, setFilters, resetFilters, setCourses, getFilteredCourses } = useCourseStore();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch from SpringBoot on search parameter change
  useEffect(() => {
    setLoading(true);
    api
      .get("/employee/courses", { params: { search: debouncedSearch } })
      .then((res) => {
        const localCourses = useCourseStore.getState().courses;
        const mapped = res.data.map((bc: any) => {
          const existing = localCourses.find((e) => e.id === String(bc.id));

          const categoryMap: Record<string, CourseCategory> = {
            MANDATORY: CourseCategory.MANDATORY,
            COMPLIANCE: CourseCategory.MANDATORY,
            TECHNICAL: CourseCategory.ELECTIVE,
            ELECTIVE: CourseCategory.ELECTIVE,
            HR: CourseCategory.DEPARTMENT,
            'DEPARTMENT-ORIENTED': CourseCategory.DEPARTMENT,
            DEPARTMENT: CourseCategory.DEPARTMENT,
          };

          const mappedCategory = categoryMap[bc.category?.toUpperCase().replace(/ /g, '-')] || CourseCategory.ELECTIVE;
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
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, setCourses]);

  const filteredCourses = getFilteredCourses();

  const filterTabs = [
    { label: 'All Categories', value: 'all' },
    { label: 'Mandatory', value: CourseCategory.MANDATORY },
    { label: 'Elective', value: CourseCategory.ELECTIVE },
    { label: 'Departmental', value: CourseCategory.DEPARTMENT },
  ];

  const statusTabs = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Not Started', value: CompletionStatus.NOT_STARTED },
    { label: 'In Progress', value: CompletionStatus.IN_PROGRESS },
    { label: 'Completed', value: CompletionStatus.COMPLETED },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto text-left font-sans">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl lg:text-3xl font-black text-surface-900 tracking-tight">My Course Library</h1>
        <p className="text-surface-500 mt-1 text-sm font-semibold">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} assigned
        </p>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-surface-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setFilters({ search: e.target.value });
              }}
              placeholder="Search by course title or description..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-surface-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all placeholder:text-surface-400"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setFilters({ search: '' });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-surface-400" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer',
              showFilters
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          {/* Sort Menu */}
          <div className="relative">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
                setFilters({ sortBy, sortOrder });
              }}
              className="appearance-none w-full sm:w-48 px-4 py-3 pr-10 rounded-2xl bg-white border border-surface-200 text-sm font-semibold text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 cursor-pointer"
            >
              <option value="dueDate-asc">Due Date (Earliest)</option>
              <option value="dueDate-desc">Due Date (Latest)</option>
              <option value="assignedDate-desc">Recently Assigned</option>
              <option value="popularity-desc">Most Popular</option>
              <option value="progress-desc">Highest Progress</option>
              <option value="progress-asc">Lowest Progress</option>
            </select>
            <ArrowUpDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilters({ category: tab.value as any })}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer',
                filters.category === tab.value
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                  : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
              )}
            >
              {tab.label}
            </button>
          ))}
          <span className="w-[1px] h-6 bg-surface-200 mx-2 self-center hidden sm:inline" />
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilters({ status: tab.value as any })}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer',
                filters.status === tab.value
                  ? 'bg-surface-800 text-white shadow-sm'
                  : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Extended Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-white rounded-2xl border border-surface-200/80 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-surface-450 mb-2">Due Date Window</label>
                  <select
                    value={filters.dueDate}
                    onChange={(e) => setFilters({ dueDate: e.target.value as any })}
                    className="px-3 py-2 rounded-xl bg-surface-50 border border-surface-200 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="all">Any Deadline</option>
                    <option value="this_week">Due This Week</option>
                    <option value="this_month">Due This Month</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    resetFilters();
                    setSearchInput('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-danger-600 hover:bg-danger-50 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-surface-200/60"
        >
          <div className="w-14 h-14 rounded-2xl bg-surface-50 flex items-center justify-center mb-4 border border-surface-100">
            <Search className="w-6 h-6 text-surface-300" />
          </div>
          <h3 className="text-base font-bold text-surface-800 mb-1">No courses matched</h3>
          <p className="text-xs text-surface-400 mb-5 font-semibold">Try adjusting your filters or search keywords.</p>
          <button
            onClick={() => {
              resetFilters();
              setSearchInput('');
            }}
            className="text-xs font-black uppercase tracking-wider text-primary-600 hover:text-primary-700 cursor-pointer"
          >
            Reset Filters
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

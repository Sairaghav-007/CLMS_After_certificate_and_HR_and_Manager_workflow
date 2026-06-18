import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Target,
  CheckCircle,
  Lock,
  FileText,
  Presentation,
  BookOpen,
  Video,
  Zap,
  FileUp,
  Award,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useCourseStore } from '@/shared/store';
import { CompletionStatus, CourseCategory, ModuleResourceType, QuestionType } from '@/shared/types';
import type { Course, Module } from '@/shared/types';
import { cn, formatDuration, formatMinutes, formatDate, getDueDateColor } from '@/shared/utils';
import { Skeleton } from '@/shared/components/Skeleton';
import { api } from '../api/client';

const resourceIcons = {
  [ModuleResourceType.VIDEO]: Video,
  [ModuleResourceType.PDF]: FileText,
  [ModuleResourceType.PPT]: Presentation,
  [ModuleResourceType.READING]: BookOpen,
  [ModuleResourceType.INTERACTIVE]: Zap,
  [ModuleResourceType.SCORM]: FileUp,
};

const categoryColors = {
  [CourseCategory.MANDATORY]: 'from-danger-500 to-red-600',
  [CourseCategory.ELECTIVE]: 'from-primary-500 to-blue-600',
  [CourseCategory.DEPARTMENT]: 'from-accent-500 to-purple-600',
};

function ModuleItem({
  module,
  courseId: _courseId,
  isExpanded,
  onToggle,
  onStartResource,
}: {
  module: Module;
  courseId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onStartResource: (moduleId: string, resourceId: string) => void;
}) {
  const resourceCount = module.resources.length;
  const completedCount = module.resources.filter((r) => r.isCompleted).length;

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-350 text-left',
      module.isLocked
        ? 'border-surface-200 bg-surface-50/50 opacity-75'
        : module.isCompleted
        ? 'border-success-200 bg-success-50/20'
        : 'border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm'
    )}>
      <button
        onClick={onToggle}
        disabled={module.isLocked}
        className={cn(
          'w-full flex items-center gap-4 p-4 text-left transition-colors cursor-pointer',
          module.isLocked && 'cursor-not-allowed'
        )}
        title={module.isLocked ? 'Complete previous modules to unlock.' : undefined}
      >
        {/* Module Order or Status */}
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold',
          module.isCompleted
            ? 'bg-success-100 text-success-600'
            : module.isLocked
            ? 'bg-surface-200 text-surface-400'
            : 'bg-primary-100 text-primary-600'
        )}>
          {module.isCompleted ? (
            <CheckCircle className="w-5 h-5" />
          ) : module.isLocked ? (
            <Lock className="w-5 h-5" />
          ) : (
            module.order
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-semibold text-sm leading-snug',
            module.isLocked ? 'text-surface-400' : 'text-surface-900'
          )}>
            {module.title}
          </h4>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-500 font-semibold">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatMinutes(module.duration)}
            </span>
            <span>{completedCount}/{resourceCount} resources</span>
          </div>
        </div>

        {/* Progress percent slider */}
        {!module.isLocked && (
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <div className="w-24 h-1.5 bg-surface-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-accent-500 rounded-full transition-all"
                style={{ width: `${module.completionPercentage}%` }}
              />
            </div>
            <span className="text-xs text-surface-500 font-bold w-8">{module.completionPercentage}%</span>
          </div>
        )}

        {!module.isLocked && (
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="flex-shrink-0">
            <ChevronDown className="w-4 h-4 text-surface-400" />
          </motion.div>
        )}
      </button>

      {/* Resources list inside module */}
      <AnimatePresence>
        {isExpanded && !module.isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {module.resources.map((resource) => {
                const Icon = resourceIcons[resource.type] || BookOpen;
                return (
                  <motion.div
                    key={resource.id}
                    whileHover={{ x: 4 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer group',
                      resource.isCompleted
                        ? 'bg-success-50/40 hover:bg-success-50/80 border border-success-100/50'
                        : 'bg-surface-50 hover:bg-surface-100 border border-transparent'
                    )}
                    onClick={() => onStartResource(module.id, resource.id)}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border',
                      resource.isCompleted 
                        ? 'bg-success-100 text-success-600 border-success-200/50' 
                        : 'bg-primary-50 text-primary-600 border-primary-100/50'
                    )}>
                      {resource.isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-bold truncate leading-none',
                        resource.isCompleted ? 'text-success-700' : 'text-surface-800'
                      )}>
                        {resource.title}
                      </p>
                      <p className="text-[10px] font-semibold text-surface-400 mt-1 uppercase tracking-wider">
                        {resource.type} • {formatMinutes(resource.duration)}
                      </p>
                    </div>
                    {resource.progress > 0 && resource.progress < 100 && (
                      <span className="text-[10px] text-primary-600 font-bold">{resource.progress}%</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CoursePreviewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Sync details from Springboot API
  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/employee/courses/${courseId}`)
      .then((res) => {
        const localCourses = useCourseStore.getState().courses;
        const localCourse = localCourses.find(c => c.id === String(courseId));

        const categoryMap: Record<string, CourseCategory> = {
          MANDATORY: CourseCategory.MANDATORY,
          COMPLIANCE: CourseCategory.MANDATORY,
          TECHNICAL: CourseCategory.ELECTIVE,
          ELECTIVE: CourseCategory.ELECTIVE,
          HR: CourseCategory.DEPARTMENT,
        };

        const mappedCategory = categoryMap[res.data.category?.toUpperCase()] || CourseCategory.ELECTIVE;
        
        // Map Modules and Sections
        let previousModuleCompleted = true;
        const mappedModules = (res.data.modules || []).map((m: any, mIdx: number) => {
          const existingM = localCourse?.modules?.find(lm => lm.id === String(m.id));

          const resources = (m.sections || []).map((s: any) => {
            const existingR = existingM?.resources?.find(lr => lr.id === String(s.id));
            const typeMap: Record<string, ModuleResourceType> = {
              VIDEO: ModuleResourceType.VIDEO,
              PDF: ModuleResourceType.PDF,
              PPT: ModuleResourceType.PPT,
              DOCUMENT: ModuleResourceType.READING,
              SCORM: ModuleResourceType.SCORM,
            };

            return {
              id: String(s.id),
              type: typeMap[s.materialType] || ModuleResourceType.READING,
              title: s.title,
              duration: 25, // default resource duration 25m
              url: s.materialUrl,
              isCompleted: s.isCompleted !== undefined ? s.isCompleted : (existingR?.isCompleted || false),
              progress: s.progress !== undefined ? s.progress : (existingR?.progress || 0),
              scormPackageUuid: s.scormPackageUuid,
              scormEntryPath: s.scormEntryPath,
              scormVersion: s.scormVersion,
            };
          });

          const completedResCount = resources.filter((r: any) => r.isCompleted).length;
          const completionPercentage = resources.length > 0
            ? Math.round((completedResCount / resources.length) * 100)
            : 0;

          const moduleCompleted = m.isCompleted !== undefined ? m.isCompleted : (completionPercentage === 100);
          const modulePercentage = m.completionPercentage !== undefined ? m.completionPercentage : completionPercentage;
          const isLocked = m.isLocked !== undefined ? m.isLocked : !previousModuleCompleted;

          previousModuleCompleted = moduleCompleted;

          return {
            id: String(m.id),
            title: m.title,
            description: `Learning track containing ${resources.length} sections.`,
            duration: resources.length * 25,
            order: m.moduleOrder || (mIdx + 1),
            isLocked,
            isCompleted: moduleCompleted,
            resources,
            completionPercentage: modulePercentage,
          };
        });

        const totalDurationHours = mappedModules.reduce((acc: number, m: any) => acc + m.duration, 0) / 60;
        const totalCompletedPercent = mappedModules.length > 0
          ? Math.round(mappedModules.reduce((sum: number, m: any) => sum + m.completionPercentage, 0) / mappedModules.length)
          : 0;

        const isAllCompleted = mappedModules.every((m: any) => m.isCompleted);

        const quizQuestions = (res.data.assessment?.questions || []).map((q: any) => {
          const typeMap: Record<string, QuestionType> = {
            mcq: QuestionType.MCQ,
            true_false: QuestionType.TRUE_FALSE,
            multiple_select: QuestionType.MULTIPLE_SELECT,
          };

          return {
            id: String(q.id),
            type: typeMap[q.type] || QuestionType.MCQ,
            text: q.text,
            options: (q.options || []).map((opt: any) => ({
              id: opt.id,
              text: opt.text,
            })),
            correctAnswers: q.correctAnswers || [],
            points: q.points || 5,
          };
        });

        const mappedCourse: Course = {
          id: String(res.data.id),
          title: res.data.title,
          description: res.data.description,
          thumbnail: res.data.thumbnail || "",
          category: mappedCategory,
          instructor: {
            id: "INS-DEFAULT",
            name: res.data.createdBy || "Corporate L&D Lead",
            title: "L&D Trainer",
            avatar: "",
            bio: "Acme corporate director for compliance policies and development training.",
          },
          duration: totalDurationHours || 3,
          totalModules: mappedModules.length,
          totalAssessments: 1,
          progress: res.data.progress !== undefined ? res.data.progress : totalCompletedPercent,
          status: res.data.status || (totalCompletedPercent >= 100 
            ? CompletionStatus.COMPLETED 
            : totalCompletedPercent > 0 
            ? CompletionStatus.IN_PROGRESS 
            : CompletionStatus.NOT_STARTED),
          dueDate: res.data.dueDate,
          assignedDate: "2026-05-15",
          lastUpdated: "2026-06-01",
          objectives: (res.data.objectives && res.data.objectives.length > 0) ? res.data.objectives : [
            `Analyze critical components of ${res.data.title}.`,
            "Learn operational constraints and quality regulations.",
            "Complete assessments to certify competency."
          ],
          learningOutcomes: (res.data.learningOutcomes && res.data.learningOutcomes.length > 0) ? res.data.learningOutcomes : [
            "Demonstrate functional and technical competency.",
            "Enforce security parameters in team workflows.",
            "Verify compliance standards are consistently met."
          ],
          completionCriteria: "Complete all sections and score 80% or above in final quiz.",
          passingPercentage: 80,
          modules: mappedModules,
          assessment: {
            id: `AST-${res.data.id}`,
            title: `${res.data.title} Final Quiz`,
            courseId: String(res.data.id),
            timeLimit: res.data.assessment?.timeLimit || 15,
            passingPercentage: res.data.assessment?.passingPercentage || 80,
            maxAttempts: res.data.assessment?.maxAttempts || 3,
            attemptsUsed: res.data.assessment?.attemptsUsed !== undefined ? res.data.assessment.attemptsUsed : (localCourse?.assessment?.attemptsUsed || 0),
            isLocked: !isAllCompleted,
            isPassed: res.data.assessment?.isPassed !== undefined ? res.data.assessment.isPassed : (localCourse?.assessment?.isPassed || false),
            shuffleQuestions: false,
            shuffleOptions: false,
            negativeMarking: false,
            negativeMarkValue: 0,
            questions: quizQuestions,
            lastScore: res.data.assessment?.lastScore !== undefined ? res.data.assessment.lastScore : localCourse?.assessment?.lastScore,
          },
          certificate: res.data.certificate ? {
            id: String(res.data.certificate.id),
            courseId: String(res.data.id),
            courseName: res.data.title,
            employeeName: res.data.certificate.employeeName,
            employeeId: res.data.certificate.employeeId,
            completionDate: res.data.certificate.issuedAt,
            certificateNumber: res.data.certificate.certificateNumber,
            qrCodeData: res.data.certificate.qrCodeData,
            verificationUrl: res.data.certificate.verificationUrl,
            instructorName: "Corporate L&D Lead",
            instructorSignature: "Corporate L&D Lead",
          } : (localCourse?.certificate || undefined),
          popularity: 85,
          department: "Engineering",
          startDate: res.data.startDate,
          endDate: res.data.endDate,
        };

        // Cache course detail state inside course store
        useCourseStore.setState((state) => {
          const hasCourse = state.courses.some(c => c.id === mappedCourse.id);
          const updatedCourses = hasCourse
            ? state.courses.map((c) => c.id === mappedCourse.id ? mappedCourse : c)
            : [...state.courses, mappedCourse];
          return { courses: updatedCourses };
        });

        setCourse(mappedCourse);

        // Auto expand first incomplete module
        const incompleteM = mappedModules.find((m: any) => !m.isCompleted && !m.isLocked);
        if (incompleteM) setExpandedModule(incompleteM.id);
        else if (mappedModules.length > 0) setExpandedModule(mappedModules[0].id);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load course materials.');
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleStartResource = (moduleId: string, resourceId: string) => {
    navigate(`/employee/courses/${courseId}/learn/${moduleId}/${resourceId}`);
  };

  const handleStartAssessment = () => {
    if (course?.assessment) {
      navigate(`/employee/courses/${courseId}/assessment`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8 text-left">
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-48 w-full rounded-2xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-3xl border border-surface-200">
        <AlertCircle className="w-12 h-12 text-danger-500 mb-4" />
        <h2 className="text-lg font-bold text-surface-800 mb-1">Course Not Found</h2>
        <p className="text-xs text-surface-450 font-semibold mb-6">{error || 'This course is unavailable.'}</p>
        <button onClick={() => navigate('/employee/courses')} className="text-xs font-black uppercase tracking-wider text-primary-600 hover:text-primary-700 cursor-pointer">
          Back to library
        </button>
      </div>
    );
  }

  const completedModules = course.modules.filter((m) => m.isCompleted).length;
  const allModulesCompleted = completedModules === course.modules.length;

  const categoryLabel = course.category === CourseCategory.MANDATORY ? 'Mandatory' : course.category === CourseCategory.ELECTIVE ? 'Elective' : 'Department';
  const statusLabel = course.progress >= 100 ? 'Completed' : course.progress > 0 ? 'In Progress' : 'Not Started';

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto text-left font-sans">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/employee/courses')}
        className="flex items-center gap-2 text-xs text-surface-500 hover:text-surface-700 mb-6 font-bold uppercase tracking-wider transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </motion.button>

      {/* Course Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative rounded-3xl overflow-hidden p-6 lg:p-8 mb-8 text-white shadow-xl bg-gradient-to-br',
          categoryColors[course.category] || 'from-primary-600 to-blue-600'
        )}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white backdrop-blur-sm border border-white/10">
              {categoryLabel}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/5">
              {statusLabel}
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black mb-3 tracking-tight leading-snug">{course.title}</h1>
          <p className="text-white/80 text-xs lg:text-sm leading-relaxed mb-5 font-medium">{course.description}</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-white/70 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-white/50" />
              {course.instructor.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-white/50" />
              {formatDuration(course.duration)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-white/50" />
              Updated {formatDate(course.lastUpdated)}
            </span>
            {course.startDate && course.endDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-white/50" />
                Active: {formatDate(course.startDate)} - {formatDate(course.endDate)}
              </span>
            )}
          </div>
        </div>

        {/* Progress Card overlay */}
        <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-white/85 font-semibold">Overall Course Progress</span>
            <span className="text-white font-black text-base leading-none">{course.progress}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <div className="flex items-center justify-between mt-2.5 text-[10px] text-white/70 font-semibold uppercase tracking-wider">
            <span>{completedModules}/{course.modules.length} modules completed</span>
            <span className={cn(getDueDateColor(course.dueDate).replace('text-', 'text-white/'))}>
              Due {formatDate(course.dueDate)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main: Modules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Objectives */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-surface-200/80 p-6 text-left"
          >
            <h2 className="text-md font-bold text-surface-900 flex items-center gap-2 mb-4">
              <Target className="w-4.5 h-4.5 text-primary-500" />
              Course Objectives
            </h2>
            <ul className="space-y-2.5">
              {course.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-3 text-xs font-semibold text-surface-600">
                  <CheckCircle className="w-4.5 h-4.5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Outcomes */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-surface-200/80 p-6 text-left"
          >
            <h2 className="text-md font-bold text-surface-900 flex items-center gap-2 mb-4">
              <Award className="w-4.5 h-4.5 text-accent-500" />
              Learning Outcomes
            </h2>
            <ul className="space-y-3">
              {course.learningOutcomes.map((outcome, i) => (
                <li key={i} className="flex items-start gap-3 text-xs font-semibold text-surface-600">
                  <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-accent-700 text-[10px] font-black">
                    {i + 1}
                  </div>
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Syllabus modules */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 text-left"
          >
            <h2 className="text-md font-bold text-surface-900 mb-4">Course Syllabus</h2>
            <div className="space-y-3">
              {course.modules.map((module) => (
                <ModuleItem
                  key={module.id}
                  module={module}
                  courseId={course.id}
                  isExpanded={expandedModule === module.id}
                  onToggle={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                  onStartResource={handleStartResource}
                />
              ))}

              {/* Quiz button */}
              {course.assessment && (
                <div className={cn(
                  'rounded-xl border p-4 transition-all text-left flex items-center justify-between',
                  allModulesCompleted
                    ? course.assessment.isPassed
                      ? 'border-success-200 bg-success-50/20'
                      : 'border-primary-200 bg-primary-50/20'
                    : 'border-surface-200 bg-surface-50/50 opacity-75'
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      allModulesCompleted
                        ? course.assessment.isPassed
                          ? 'bg-success-100 text-success-600'
                          : 'bg-primary-100 text-primary-600'
                        : 'bg-surface-200 text-surface-400'
                    )}>
                      {course.assessment.isPassed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : allModulesCompleted ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className={cn(
                        'font-bold text-sm leading-none mb-1.5',
                        !allModulesCompleted ? 'text-surface-400' : 'text-surface-900'
                      )}>
                        Final Assessment
                      </h4>
                      <p className="text-[10px] font-semibold text-surface-500">
                        {course.assessment.timeLimit} min • {course.assessment.passingPercentage}% passing score •{' '}
                        {course.assessment.attemptsUsed}/{course.assessment.maxAttempts} attempts used
                      </p>
                      {course.assessment.isPassed && course.assessment.lastScore !== undefined && (
                        <p className="text-[10px] text-success-600 font-bold mt-1.5 uppercase tracking-wider">
                          Passed with {course.assessment.lastScore}%
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {allModulesCompleted && !course.assessment.isPassed && (
                    <button
                      onClick={handleStartAssessment}
                      disabled={course.assessment.attemptsUsed >= course.assessment.maxAttempts}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm',
                        course.assessment.attemptsUsed >= course.assessment.maxAttempts
                          ? 'bg-surface-200 text-surface-400 cursor-not-allowed border border-surface-300'
                          : 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/10'
                      )}
                    >
                      {course.assessment.attemptsUsed > 0 ? 'Reattempt' : 'Start Assessment'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right sidebar details */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-6 text-left"
        >
          <div className="bg-white rounded-3xl border border-surface-200/80 p-6 sticky top-6 space-y-6">
            <div>
              <h3 className="font-bold text-surface-900 mb-4">Progress Overview</h3>
              <div className="space-y-3.5">
                {course.modules.map((module) => (
                  <div key={module.id} className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 border',
                      module.isCompleted
                        ? 'bg-success-100 text-success-600 border-success-200/50'
                        : module.isLocked
                        ? 'bg-surface-50 text-surface-300 border-surface-200/50'
                        : 'bg-primary-50 text-primary-600 border-primary-200/50'
                    )}>
                      {module.isCompleted ? '✓' : module.isLocked ? <Lock className="w-3 h-3" /> : module.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-bold truncate leading-none mb-1.5',
                        module.isLocked ? 'text-surface-400' : 'text-surface-700'
                      )}>
                        {module.title}
                      </p>
                      <div className="h-1 bg-surface-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            module.isCompleted ? 'bg-success-400' : 'bg-primary-400'
                          )}
                          style={{ width: `${module.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Criteria Info */}
            <div className="pt-6 border-t border-surface-100 space-y-3 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-surface-400 uppercase tracking-wider text-[10px] font-black">Completion Criteria</span>
                <span className="text-surface-800 text-right w-1/2">{course.completionCriteria}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400 uppercase tracking-wider text-[10px] font-black">Passing Score</span>
                <span className="text-surface-800">{course.passingPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400 uppercase tracking-wider text-[10px] font-black">Due Date</span>
                <span className={cn(getDueDateColor(course.dueDate))}>
                  {formatDate(course.dueDate)}
                </span>
              </div>
              {course.startDate && (
                <div className="flex justify-between">
                  <span className="text-surface-400 uppercase tracking-wider text-[10px] font-black">Start Date</span>
                  <span className="text-surface-800">{formatDate(course.startDate)}</span>
                </div>
              )}
              {course.endDate && (
                <div className="flex justify-between">
                  <span className="text-surface-400 uppercase tracking-wider text-[10px] font-black">End Date</span>
                  <span className="text-surface-800">{formatDate(course.endDate)}</span>
                </div>
              )}
            </div>

            {/* Instructor Card */}
            <div className="pt-6 border-t border-surface-100 text-left">
              <h4 className="text-xs font-black uppercase tracking-wider text-surface-400 mb-3">Course Instructor</h4>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-accent-300 flex items-center justify-center text-white font-black text-sm">
                  {course.instructor.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-surface-900 leading-none mb-1">{course.instructor.name}</p>
                  <p className="text-[10px] text-surface-450 font-semibold leading-none">{course.instructor.title}</p>
                </div>
              </div>
              <p className="text-[11px] text-surface-500 leading-relaxed font-semibold">{course.instructor.bio}</p>
            </div>

            {/* View Certificate */}
            {course.certificate && (
              <div className="pt-6 border-t border-surface-100">
                <button
                  onClick={() => navigate(`/employee/certificates`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  View Certificate
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

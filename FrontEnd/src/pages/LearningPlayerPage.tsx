import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Menu, 
  X, 
  ShieldCheck, 
  Lock,
  ArrowLeft,
  ChevronDown,
  CheckCircle,
  Circle,
  Zap,
  Layout,
  BookOpen
} from 'lucide-react';
import { useContentProtection } from '@/shared/hooks';
import { useCourseStore, useUIStore, useNotesStore } from '@/shared/store';
import { ModuleResourceType, CourseCategory, CompletionStatus } from '@/shared/types';
import { SecureVideoPlayer, type SecureVideoPlayerHandle } from '../features/learning-player/SecureVideoPlayer';
import { DocumentViewer } from '../features/learning-player/DocumentViewer';
import { NotesDrawer } from '../features/learning-player/NotesDrawer';
import { useNotes } from '../features/learning-player/hooks/useNotes';
import { cn, formatMinutes } from '@/shared/utils';
import { api } from '../api/client';

export function LearningPlayerPage() {
  const { courseId, moduleId, resourceId } = useParams<{ courseId: string; moduleId: string; resourceId: string }>();
  const navigate = useNavigate();
  const { updateResourceProgress, completeModule, unlockModule } = useCourseStore();
  const course = useCourseStore(state => state.courses.find(c => c.id === courseId));
  const { addToast } = useUIStore();
  const { isDrawerOpen, setDrawerOpen } = useNotesStore();
  const { notes } = useNotes(courseId || '');
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const videoPlayerRef = useRef<SecureVideoPlayerHandle>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Activate Content Protection (watermarking and screenshot blocks)
  useContentProtection();

  // Load course details if not present in Zustand cache (e.g. direct page refresh)
  useEffect(() => {
    if (courseId && (!course || !course.modules || course.modules.length === 0)) {
      setLoadingDetail(true);
      api.get(`/employee/courses/${courseId}`)
        .then((res) => {
          const localCourses = useCourseStore.getState().courses;
          const localCourse = localCourses.find(c => c.id === String(courseId));
          // Quick merge and parse
          const categoryMap: Record<string, CourseCategory> = {
            MANDATORY: CourseCategory.MANDATORY,
            COMPLIANCE: CourseCategory.MANDATORY,
            TECHNICAL: CourseCategory.ELECTIVE,
            ELECTIVE: CourseCategory.ELECTIVE,
            HR: CourseCategory.DEPARTMENT,
          };
          const mappedModules = (res.data.modules || []).map((m: any, mIdx: number) => {
            const existingM = localCourse?.modules?.find(lm => lm.id === String(m.id));
            const resources = (m.sections || []).map((s: any) => {
              const existingR = existingM?.resources?.find(lr => lr.id === String(s.id));
              const typeMap: Record<string, any> = {
                VIDEO: 'video',
                PDF: 'pdf',
                PPT: 'ppt',
                DOCUMENT: 'reading',
              };
              return {
                id: String(s.id),
                type: typeMap[s.materialType] || 'reading',
                title: s.title,
                duration: 25,
                url: s.materialUrl,
                isCompleted: existingR?.isCompleted || false,
                progress: existingR?.progress || 0,
              };
            });
            const completedCount = resources.filter((r: any) => r.isCompleted).length;
            const percentage = resources.length > 0 ? Math.round((completedCount / resources.length) * 100) : 0;
            return {
              id: String(m.id),
              title: m.title,
              description: `Module containing ${resources.length} sections.`,
              duration: resources.length * 25,
              order: m.moduleOrder || (mIdx + 1),
              isLocked: mIdx > 0 && !(localCourse?.modules?.[mIdx - 1]?.isCompleted),
              isCompleted: percentage === 100,
              resources,
              completionPercentage: percentage,
            };
          });

          const totalDurationHours = mappedModules.reduce((acc: number, m: any) => acc + m.duration, 0) / 60;
          const totalPercentage = mappedModules.length > 0
            ? Math.round(mappedModules.reduce((sum: number, m: any) => sum + m.completionPercentage, 0) / mappedModules.length)
            : 0;

          const isAllCompleted = mappedModules.every((m: any) => m.isCompleted);

          const mappedCourse = {
            id: String(res.data.id),
            title: res.data.title,
            description: res.data.description,
            thumbnail: "",
            category: categoryMap[res.data.category?.toUpperCase()] || CourseCategory.ELECTIVE,
            instructor: {
              id: "INS-DEFAULT",
              name: "Corporate Trainer",
              title: "L&D Trainer",
              avatar: "",
              bio: "Acme corporate director for compliance policies.",
            },
            duration: totalDurationHours || 3,
            totalModules: mappedModules.length,
            totalAssessments: 1,
            progress: totalPercentage,
            status: totalPercentage >= 100 ? CompletionStatus.COMPLETED : totalPercentage > 0 ? CompletionStatus.IN_PROGRESS : CompletionStatus.NOT_STARTED,
            dueDate: res.data.dueDate,
            assignedDate: "2026-05-15",
            lastUpdated: "2026-06-01",
            objectives: [
              `Analyze critical components of ${res.data.title}.`,
              "Learn operational constraints.",
              "Complete assessments."
            ],
            learningOutcomes: [
              "Demonstrate competency.",
              "Enforce compliance standards."
            ],
            completionCriteria: "Complete all sections and score 80% on final quiz.",
            passingPercentage: 80,
            modules: mappedModules,
            assessment: {
              id: `AST-${res.data.id}`,
              title: `${res.data.title} Final Quiz`,
              courseId: String(res.data.id),
              timeLimit: 15,
              passingPercentage: 80,
              maxAttempts: 3,
              attemptsUsed: localCourse?.assessment?.attemptsUsed || 0,
              isLocked: !isAllCompleted,
              isPassed: localCourse?.assessment?.isPassed || false,
              shuffleQuestions: false,
              shuffleOptions: false,
              negativeMarking: false,
              negativeMarkValue: 0,
              questions: [],
              lastScore: localCourse?.assessment?.lastScore,
            },
            certificate: localCourse?.certificate,
            popularity: 85,
            department: "Engineering",
          };

          useCourseStore.setState((state) => ({
            courses: state.courses.map((c) => c.id === mappedCourse.id ? mappedCourse : c)
          }));
        })
        .finally(() => setLoadingDetail(false));
    }
  }, [courseId, course]);

  // Locate active module and section
  const currentModule = useMemo(() => 
    course?.modules.find(m => m.id === moduleId), [course, moduleId]
  );
  
  const currentResource = useMemo(() => 
    currentModule?.resources.find(r => r.id === resourceId), [currentModule, resourceId]
  );

  // Re-route on locked syllabus access attempt
  useEffect(() => {
    if (course && currentModule?.isLocked) {
      addToast({ 
        title: 'Access Restricted', 
        message: 'Complete previous modules to unlock this content.', 
        type: 'warning' 
      });
      navigate(`/employee/courses/${courseId}`);
    }
  }, [course, currentModule, courseId, navigate, addToast]);

  const handleResourceComplete = () => {
    if (!course || !moduleId || !resourceId || currentResource?.isCompleted) return;

    if (courseId && moduleId && resourceId) {
      updateResourceProgress(courseId, moduleId, resourceId, 100);
      
      addToast({
        title: 'Section Finished',
        message: `Successfully completed: ${currentResource?.title}`,
        type: 'success'
      });
    }

    // Check module locks after update
    setTimeout(() => {
      const updatedCourse = useCourseStore.getState().courses.find(c => c.id === courseId);
      const updatedModule = updatedCourse?.modules.find(m => m.id === moduleId);
      const allDone = updatedModule?.resources.every(r => r.isCompleted);

      if (allDone) {
        if (courseId && moduleId) {
          completeModule(courseId, moduleId);
        }
        
        const nextIdx = updatedCourse!.modules.findIndex(m => m.id === moduleId) + 1;
        if (nextIdx < updatedCourse!.modules.length) {
          const nextModuleId = updatedCourse!.modules[nextIdx].id;
          if (courseId) {
            unlockModule(courseId, nextModuleId);
          }
          addToast({
            title: 'Module Complete!',
            message: `Next module "${updatedCourse!.modules[nextIdx].title}" is now unlocked.`,
            type: 'info'
          });
        } else {
          addToast({
            title: 'Syllabus Complete!',
            message: 'All modules completed. Final assessment is now unlocked!',
            type: 'success'
          });
        }
      }
    }, 100);
  };

  const handleProgress = (position: number, total: number) => {
    setCurrentTime(position);
    if (!courseId || !moduleId || !resourceId || isNaN(position) || isNaN(total) || total <= 0) return;
    
    const progress = Math.round((position / total) * 100);
    if (progress > (currentResource?.progress || 0)) {
      updateResourceProgress(courseId, moduleId, resourceId, progress);
    }
  };

  const goToResource = (mid: string, rid: string) => {
    navigate(`/employee/courses/${courseId}/learn/${mid}/${rid}`);
  };

  const handleSeek = (time: number) => {
    videoPlayerRef.current?.seekTo(time);
  };

  if (loadingDetail || !course || !currentResource) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-950 text-white">
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-surface-450 font-bold animate-pulse text-xs uppercase tracking-widest">Entering protected classroom...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface-950 text-white overflow-hidden text-left font-sans select-none">
      {/* Header */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-surface-900 border-b border-white/5 relative z-30">
        <div className="flex items-center gap-4">
           <Link to={`/employee/courses/${courseId}`} className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all">
              <ArrowLeft size={20} />
           </Link>
           <div className="h-6 w-px bg-white/10 hidden sm:block" />
           <div>
              <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{course.title}</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-0.5">{currentModule?.title}</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-3 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/5">
              <ShieldCheck size={14} className="text-success-400" />
              <span className="text-[10px] font-black text-white/80 uppercase tracking-wider">Enterprise Secure Mode Active</span>
           </div>
           
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white lg:hidden cursor-pointer"
           >
             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Player container */}
        <main className="flex-1 overflow-y-auto bg-surface-950 p-4 lg:p-8 flex flex-col justify-between">
           <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-between">
              {/* Resource Title header */}
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <span className="px-2 py-0.5 bg-primary-600/20 text-primary-400 border border-primary-500/20 rounded text-[9px] font-black uppercase tracking-wider">
                        {currentResource.type}
                     </span>
                     <h2 className="text-sm font-black text-white/90">{currentResource.title}</h2>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/40 font-bold uppercase tracking-wider">
                     <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {formatMinutes(currentResource.duration)}
                     </span>
                  </div>
              </div>

              {/* Secure Media viewports */}
              <div className="flex-1 flex items-center justify-center min-h-[350px] mb-6">
                 {currentResource.type === ModuleResourceType.VIDEO && (
                   <SecureVideoPlayer 
                    ref={videoPlayerRef}
                    url={currentResource.url || ''}
                    onProgress={handleProgress}
                    onComplete={handleResourceComplete}
                    lastPosition={currentResource.lastPosition}
                   />
                 )}
                 {(currentResource.type === ModuleResourceType.PDF || currentResource.type === ModuleResourceType.PPT) && (
                   <DocumentViewer 
                    type={currentResource.type === ModuleResourceType.PDF ? 'pdf' : 'ppt'}
                    url={currentResource.url}
                    totalPages={currentResource.totalPages || 8}
                    onPageChange={(curr, total) => handleProgress(curr, total)}
                    onComplete={handleResourceComplete}
                   />
                 )}
                 {currentResource.type === ModuleResourceType.READING && (
                    <div className="bg-white text-surface-900 rounded-3xl p-8 lg:p-12 shadow-2xl h-full w-full overflow-y-auto max-w-none flex flex-col justify-between border border-surface-200">
                       <div className="text-left">
                         <h1 className="text-xl font-black mb-4 tracking-tight border-b pb-4 border-surface-200">{currentResource.title}</h1>
                         <p className="text-sm leading-relaxed mb-6 font-medium text-surface-600">Please review and read this document thoroughly to complete this section of the course syllabus. This documentation details vital internal company instructions and policy.</p>
                         
                         <div className="h-[260px] bg-surface-50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-surface-300 p-6">
                            <BookOpen size={40} className="text-surface-300 mb-3" />
                            <p className="text-xs text-surface-450 font-bold uppercase tracking-wider">Acme Documentation Viewer Mock</p>
                            <p className="text-[11px] text-surface-400 mt-2 text-center max-w-sm font-semibold">Security policy protects this resource. Once read, click the Complete button below to unlock the subsequent syllabus items.</p>
                         </div>
                       </div>

                       <div className="mt-8 flex justify-end">
                         <button 
                           onClick={handleResourceComplete}
                           disabled={currentResource.isCompleted}
                           className={cn(
                             "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all cursor-pointer",
                             currentResource.isCompleted 
                               ? "bg-success-100 text-success-700 border border-success-200" 
                               : "bg-primary-600 text-white hover:bg-primary-500 shadow-primary-500/10"
                           )}
                         >
                            {currentResource.isCompleted ? '✓ Read Completed' : 'Mark as Read'}
                         </button>
                       </div>
                    </div>
                 )}
              </div>

              {/* Progress and notes action bar */}
              <div className="flex items-center justify-between py-3 border-t border-white/5 flex-shrink-0">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/50">
                           {course.progress}%
                        </div>
                        <div className="text-[9px] text-white/40 uppercase tracking-wider font-black">
                           Overall Progress
                        </div>
                     </div>
                     <div className="h-4 w-px bg-white/10" />
                     <div className="text-[9px] text-white/40 uppercase tracking-wider font-black">
                        Notes: {notes.length}
                     </div>
                  </div>

                  <button 
                    onClick={() => setDrawerOpen(!isDrawerOpen)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                      isDrawerOpen 
                        ? "bg-primary-600 text-white border-primary-500" 
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                     <Layout size={14} />
                     Notes Drawer
                  </button>
              </div>
           </div>
        </main>

        {/* Sidebar Syllabus tracker */}
        <aside className={cn(
          "fixed lg:relative z-40 top-0 right-0 h-full w-80 bg-surface-900 border-l border-white/5 transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:hidden",
          !sidebarOpen && "lg:w-0 lg:border-none"
        )}>
           <div className="h-full flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                 <h2 className="font-bold text-sm text-white/90">Course Syllabus</h2>
                 <span className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/60 font-black uppercase tracking-wider">
                    {course.modules.length} Modules
                 </span>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                 {course.modules.map((module) => (
                    <div key={module.id}>
                       <div className={cn(
                         "px-6 py-3 bg-white/[0.02] flex items-center justify-between border-b border-white/5",
                         module.isLocked && "opacity-50"
                       )}>
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest truncate">{module.title}</span>
                          {module.isLocked ? <Lock size={12} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
                       </div>
                       
                       <div className="py-1">
                          {module.resources.map((resource) => (
                             <button
                                key={resource.id}
                                disabled={module.isLocked}
                                onClick={() => goToResource(module.id, resource.id)}
                                className={cn(
                                  "w-full px-6 py-3 flex items-start gap-3 transition-all text-left",
                                  resource.id === resourceId 
                                    ? "bg-primary-600/10 border-l-2 border-primary-500" 
                                    : "hover:bg-white/[0.02] border-l-2 border-transparent",
                                  module.isLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                )}
                             >
                                <div className={cn(
                                  "w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center",
                                  resource.isCompleted ? "text-success-400" : "text-white/20"
                                )}>
                                   {resource.isCompleted ? (
                                      <CheckCircle size={14} className="fill-current bg-surface-900" />
                                   ) : (
                                      <Circle size={14} />
                                   )}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className={cn(
                                     "text-xs font-bold truncate leading-none mb-1.5",
                                     resource.id === resourceId ? "text-primary-400" : "text-white/70"
                                   )}>
                                      {resource.title}
                                   </p>
                                   <div className="flex items-center gap-2 text-[9px] text-white/30 font-bold uppercase tracking-wider leading-none">
                                      <span>{resource.type}</span>
                                      <span>•</span>
                                      <span>{formatMinutes(resource.duration)}</span>
                                   </div>
                                </div>
                             </button>
                          ))}
                       </div>
                    </div>
                 ))}

                 {/* Final Quiz Item */}
                 <div className="mt-4 border-t border-white/5">
                    <button
                      disabled={course.progress < 100}
                      onClick={() => navigate(`/employee/courses/${courseId}/assessment`)}
                      className={cn(
                        "w-full px-6 py-6 flex items-center gap-4 transition-all cursor-pointer",
                        course.progress === 100 ? "bg-amber-500/10 hover:bg-amber-500/20" : "opacity-35 cursor-not-allowed"
                      )}
                    >
                       <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0 border border-amber-500/30">
                          <Zap size={18} />
                       </div>
                       <div className="text-left flex-1 min-w-0">
                          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">Final Assessment</p>
                          <p className="text-[9px] text-white/40 mt-0.5 leading-none">Unlock after completing syllabus</p>
                       </div>
                       {course.progress < 100 && <Lock size={12} className="ml-auto text-white/20" />}
                    </button>
                 </div>
              </div>

              {/* Progress Summary bottom */}
              <div className="p-6 border-t border-white/10 bg-surface-950/50 flex-shrink-0 text-left">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Strategy</span>
                    <span className="text-[9px] font-black text-success-400 uppercase tracking-widest">{course.progress === 100 ? 'Course Done' : 'On Track'}</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-success-500 transition-all duration-1000" style={{ width: `${course.progress}%` }} />
                 </div>
              </div>
           </div>
        </aside>
      </div>

      {/* Notes Drawer */}
      <NotesDrawer 
        courseId={courseId || ''}
        moduleId={moduleId || ''}
        resourceId={resourceId || ''}
        courseName={course.title}
        moduleName={currentModule?.title || ''}
        currentTime={currentTime}
        onSeek={handleSeek}
      />

      {/* Security Toast Overlay */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
         <AnimatePresence>
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 0.8, y: 0 }}
               className="bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 flex items-center gap-3"
            >
               <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-danger-500"></span>
               </span>
               <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Secure Recording Detection Active</p>
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
}

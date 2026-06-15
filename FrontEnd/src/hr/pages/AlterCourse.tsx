import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import {
  Search,
  PowerOff,
  Eye,
  Layers,
  X,
  AlertTriangle,
  PlayCircle,
  FileText,
  Presentation,
  User as UserIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlterCourse() {
  const { courses, unpublishCourse, fetchCourses } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unpublishId, setUnpublishId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Filter: ALL Published
  const publishedCourses = useMemo(() => {
    return courses.filter(c => 
      c.status === 'PUBLISHED' && 
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  const handleUnpublish = () => {
    if (unpublishId) {
      unpublishCourse(unpublishId);
      toast.success('Course taken offline successfully.');
      setUnpublishId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={cn("text-3xl font-extrabold tracking-tight", isDark ? "text-white" : "text-surface-900")}>
            Management Hub
          </h1>
          <p className={cn("text-sm mt-1", isDark ? "text-surface-400" : "text-surface-500")}>
            Admin workspace to unpublish and inspect all live content.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input 
            type="text"
            placeholder="Search all published..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 pr-4 py-3 rounded-2xl border text-sm w-80 transition-all",
              isDark ? "bg-surface-900 border-surface-800 text-white" : "bg-white border-surface-200 shadow-sm"
            )}
          />
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {publishedCourses.map((course) => (
          <div 
            key={course.id} 
            className={cn(
              "rounded-3xl border transition-all overflow-hidden",
              isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200 shadow-sm",
              expandedId === course.id && (isDark ? "border-primary-500/30 ring-1 ring-primary-500/20" : "border-primary-500/20 ring-4 ring-primary-500/5")
            )}
          >
            {/* List Row */}
            <div className="p-4 flex items-center justify-between gap-4">
               <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 flex-shrink-0 shadow-inner">
                     <img src={course.thumbnail} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="min-w-0">
                     <h3 className="font-bold text-base truncate">{course.title}</h3>
                     <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5">
                           <UserIcon className="w-3 h-3 text-surface-400" />
                           <span className="text-[11px] text-surface-500 font-medium">{course.createdBy}</span>
                        </div>
                        <span className="text-surface-300">•</span>
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest leading-none">v{course.version}</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleExpand(course.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      expandedId === course.id 
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20" 
                        : isDark ? "bg-surface-800 text-surface-300 hover:bg-surface-700" : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                    )}
                  >
                    <Eye className="w-4 h-4" />
                    {expandedId === course.id ? "Close Content" : "View Content"}
                  </button>
                  <button 
                    onClick={() => setUnpublishId(course.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white shadow-lg shadow-red-500/20 flex items-center gap-2 hover:bg-red-700 transition-all"
                  >
                    <PowerOff className="w-4 h-4" />
                    Unpublish
                  </button>
               </div>
            </div>

            {/* Expanded Content Explorer */}
            <AnimatePresence>
               {expandedId === course.id && (
                 <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-950/20"
                 >
                    <div className="p-8 space-y-8">
                       <div className="flex flex-col md:flex-row gap-8 items-start">
                          <div className="flex-1">
                             <p className="text-[10px] font-black uppercase text-surface-400 tracking-widest mb-2 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Curriculum Overview
                             </p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {course.modules.map((module, mIdx) => (
                                  <div key={module.id} className={cn("p-5 rounded-2xl border", isDark ? "bg-surface-900 border-surface-800 shadow-xl shadow-black/20" : "bg-white border-surface-200 shadow-sm")}>
                                     <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center text-[10px] font-black">{mIdx + 1}</span>
                                        {module.title}
                                     </h4>
                                     <div className="space-y-2">
                                        {module.sessions.map(session => (
                                          <div key={session.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-50 dark:bg-surface-800/40 text-[11px] font-medium border border-surface-100 dark:border-surface-700/50">
                                             <div className="flex items-center gap-2">
                                                {session.type === 'Video' && <PlayCircle className="w-3 h-3 text-blue-500" />}
                                                {session.type === 'PDF' && <FileText className="w-3 h-3 text-red-500" />}
                                                {session.type === 'PPT' && <Presentation className="w-3 h-3 text-orange-500" />}
                                                <span className="truncate max-w-[120px]">{session.title}</span>
                                             </div>
                                             <span className="text-[9px] text-surface-400 font-bold uppercase">{Math.floor(session.duration/60)}m</span>
                                          </div>
                                        ))}
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                          
                          <div className={cn("w-full md:w-64 p-6 rounded-[2rem] border space-y-4", isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200")}>
                             <h5 className="text-[10px] font-black uppercase tracking-widest text-surface-400">Course Stats</h5>
                             <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                   <span className="text-xs text-surface-500">Duration</span>
                                   <span className="text-xs font-bold">{course.duration}h</span>
                                </div>
                                <div className="flex justify-between items-center">
                                   <span className="text-xs text-surface-500">Min. Score</span>
                                   <span className="text-xs font-bold">{course.passingScore}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                   <span className="text-xs text-surface-500">Edition</span>
                                   <span className="text-xs font-bold text-primary-500">v{course.version}</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
          </div>
        ))}

        {publishedCourses.length === 0 && (
           <div className={cn("py-20 text-center rounded-[2.5rem] border-2 border-dashed", isDark ? "bg-surface-900/50 border-surface-800" : "bg-surface-50 border-surface-200")}>
              <AlertTriangle className="w-12 h-12 text-surface-300 mx-auto mb-4" />
              <p className="text-surface-500 font-bold">No published courses found in the system library.</p>
           </div>
        )}
      </div>

      {/* Unpublish Confirmation Modal */}
      <AnimatePresence>
        {unpublishId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("w-full max-w-sm rounded-[2.5rem] p-10 text-center shadow-2xl relative border", isDark ? "bg-surface-900 border-surface-700" : "bg-white")}>
               <div className="w-18 h-18 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-inner"><PowerOff className="w-8 h-8" /></div>
               <h3 className="text-2xl font-black mb-2 tracking-tight">Unpublish This Course?</h3>
               <p className="text-sm text-surface-500 mb-10 leading-relaxed px-4">Learners will lose access to this course immediately. Proceed taking it offline?</p>
               <div className="flex flex-col gap-3">
                  <button onClick={handleUnpublish} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl shadow-red-500/30 hover:bg-red-700 transition-all">Take Offline Now</button>
                  <button onClick={() => setUnpublishId(null)} className={cn("w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest", isDark ? "text-surface-400" : "text-surface-500")}>Cancel</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


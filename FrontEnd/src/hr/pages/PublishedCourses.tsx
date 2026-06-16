import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import { 
  Search, 
  BookOpen,
  Calendar,
  Layers,
  User as AuthorIcon
} from 'lucide-react';

export default function PublishedCourses() {
  const { courses, fetchCourses } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCourses().finally(() => setLoading(false));
  }, [fetchCourses]);

  // Filter: ALL Published courses
  const publishedCourses = useMemo(() => {
    return courses.filter(c => 
      c.status === 'PUBLISHED' && 
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <span className="ml-3 font-semibold text-surface-500">Loading catalog...</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={cn("text-3xl font-extrabold tracking-tight", isDark ? "text-white" : "text-surface-900")}>
            Live Course Catalog
          </h1>
          <p className={cn("text-sm mt-1", isDark ? "text-surface-400" : "text-surface-500")}>
            Browse all courses that are currently live and accessible to learners.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input 
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 pr-4 py-2.5 rounded-xl border text-sm w-72 transition-all shadow-sm",
              isDark ? "bg-surface-900 border-surface-800 text-white" : "bg-white border-surface-200"
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedCourses.map((course) => (
          <div 
            key={course.id} 
            className={cn("rounded-2xl border overflow-hidden flex flex-col h-full", isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200 shadow-sm")}
          >
            <div className="aspect-video relative overflow-hidden group">
               <img src={course.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
               <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 rounded-lg bg-green-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                     Live
                  </span>
               </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
               <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest leading-none">{course.category}</span>
                  <div className="flex items-center gap-1.5 text-surface-400">
                     <AuthorIcon className="w-3 h-3" />
                     <span className="text-[10px] font-bold">{course.createdBy}</span>
                  </div>
               </div>
               <h3 className="text-lg font-bold mb-6 line-clamp-2">{course.title}</h3>
               
               <div className="mt-auto flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-800">
                  <div className="flex items-center gap-2">
                     <Calendar className="w-3.5 h-3.5 text-surface-400" />
                     <span className="text-[11px] text-surface-500 font-medium">
                        {new Date(course.publishedAt || course.createdAt).toLocaleDateString()}
                     </span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Layers className="w-3.5 h-3.5 text-surface-400" />
                     <span className="text-[11px] text-surface-500 font-medium">{course.modules.length} Modules</span>
                  </div>
               </div>
            </div>
          </div>
        ))}

        {publishedCourses.length === 0 && (
          <div className={cn(
            "col-span-full py-20 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center",
            isDark ? "bg-surface-900/50 border-surface-800" : "bg-surface-50 border-surface-200"
          )}>
            <BookOpen className="w-12 h-12 text-surface-300 mb-4" />
            <h4 className="text-lg font-bold">Catalog is Empty</h4>
            <p className="text-xs text-surface-500 mt-1">No courses have been published to the catalog yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}


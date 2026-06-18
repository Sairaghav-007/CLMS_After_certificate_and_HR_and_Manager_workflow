import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import {
  Search,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowUpRight,
  ClipboardList,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CourseStatus } from '@/hr/types/course';

const TABS = [
  { id: 'All', label: 'All queue' },
  { id: 'Review', label: 'Waiting for Manager' },
  { id: 'READY_TO_PUBLISH', label: 'Approved' },
];

const REVIEW_STATUSES: CourseStatus[] = [
  'PENDING_MANAGER_REVIEW',
  'ON_REVIEW',
  'REJECTED',
];

export default function ReviewCourses() {
  const { courses, fetchCourses } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();

    // SSE — real-time refresh when manager approves/rejects or HR submits
    const es = new EventSource('http://localhost:8080/api/hr/events');
    es.addEventListener('course_update', () => { fetchCourses(); });
    es.addEventListener('course_review', () => { fetchCourses(); });
    es.onerror = () => {}; // silent — non-blocking

    // Polling backup
    const interval = setInterval(() => {
      fetchCourses();
    }, 15000);

    return () => {
      es.close();
      clearInterval(interval);
    };
  }, [fetchCourses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const inScope = [...REVIEW_STATUSES, 'READY_TO_PUBLISH'].includes(c.status);
      if (!inScope) return false;

      let matchesTab = true;
      if (activeTab === 'Review') matchesTab = REVIEW_STATUSES.includes(c.status);
      else if (activeTab !== 'All') matchesTab = c.status === activeTab;

      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [courses, activeTab, searchQuery]);

  const stats = useMemo(() => {
    const map: Record<string, number> = {};
    map['All'] = courses.filter(c => [...REVIEW_STATUSES, 'READY_TO_PUBLISH'].includes(c.status)).length;
    map['Review'] = courses.filter(c => REVIEW_STATUSES.includes(c.status)).length;
    map['READY_TO_PUBLISH'] = courses.filter(c => c.status === 'READY_TO_PUBLISH').length;
    return map;
  }, [courses]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 lg:p-8 max-w-[1600px] mx-auto text-left space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={cn('text-3xl font-extrabold tracking-tight', isDark ? 'text-white' : 'text-surface-900')}>
            Manager Review Hub
          </h1>
          <p className={cn('text-sm mt-1', isDark ? 'text-surface-400' : 'text-surface-500')}>
            Track manager decisions and finalize approved courses for publication.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search queue…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'pl-10 pr-4 py-3 rounded-2xl border text-sm w-72 transition-all',
              isDark ? 'bg-surface-900 border-surface-800 text-white' : 'bg-white border-surface-200 shadow-sm'
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/20'
                : isDark
                ? 'bg-surface-900 text-surface-400 border border-surface-800'
                : 'bg-white text-surface-600 border border-surface-200'
            )}
          >
            {tab.label}
            <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black min-w-[20px] ml-1', activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-500')}>{stats[tab.id] || 0}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course) => (
            <div key={course.id} onClick={() => navigate(`/hr/review-courses/${course.id}`)} className={cn("group p-6 rounded-[2rem] border cursor-pointer transition-all hover:shadow-2xl hover:border-primary-500/30", isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200 shadow-sm")}>
                <div className="flex gap-4 mb-6">
                   <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-surface-100 dark:bg-surface-800 shadow-inner">
                      <img src={course.thumbnail} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                          <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border", 
                             course.status === 'READY_TO_PUBLISH' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                             course.status === 'REJECTED' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                             "bg-primary-500/10 text-primary-500 border-primary-500/20"
                          )}>
                              {course.status === 'READY_TO_PUBLISH' ? 'Approved' 
                               : course.status === 'PENDING_MANAGER_REVIEW' ? 'Awaiting Manager' 
                               : course.status === 'REJECTED' ? 'Need Changes'
                               : course.status}
                          </span>
                       </div>
                       <h3 className="font-bold text-base truncate pr-6 group-hover:text-primary-500 transition-colors">{course.title}</h3>
                    </div>
                 </div>

                 {course.status === 'REJECTED' && course.changeRequests.length > 0 && (
                   <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 mb-6 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                      <p className="text-[11px] text-red-600 line-clamp-2 leading-relaxed italic">{course.changeRequests[course.changeRequests.length-1].feedback}</p>
                   </div>
                 )}

                 <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-800">
                    <div className="flex items-center gap-2 text-surface-400">
                       <Clock className="w-3.5 h-3.5" />
                       <span className="text-[11px] font-bold">{new Date(course.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {course.status === 'REJECTED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/hr/course-editor/${course.id}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit &amp; Resubmit
                        </button>
                      )}
                      <button className={cn("p-2 rounded-xl transition-all", isDark ? "bg-surface-800 text-surface-400 group-hover:bg-primary-500 group-hover:text-white" : "bg-surface-50 text-surface-400 group-hover:bg-primary-600 group-hover:text-white shadow-sm")}>
                         <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                 </div>
            </div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCourses.length === 0 && (
         <div className="py-24 text-center">
            <ClipboardList className="w-12 h-12 text-surface-200 mx-auto mb-4" />
            <p className="text-surface-500 font-bold">No courses found in this category.</p>
         </div>
      )}
    </motion.div>
  );
}


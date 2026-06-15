import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseStore } from '@/hr/store/useCourseStore';
import CourseCreation from './CourseCreation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/hr/lib/utils';
import { useThemeStore } from '@/hr/store';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ArrowLeft,
  Send,
  Save,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Course } from '@/hr/types/course';

export default function CourseEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { courses, currentCourse, setCourse, resubmitForReview, updateCourseInStore } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      const foundCourse = courses.find((c) => c.id === courseId);
      if (foundCourse) {
        setCourse(foundCourse);
      } else {
        // Handle case where course isn't found
        toast.error("Course session expired or not found.");
        navigate('/hr/review-courses');
      }
      setLoading(false);
    }
  }, [courseId, courses, setCourse, navigate]);

  const handleResubmit = () => {
    if (courseId) {
      resubmitForReview(courseId);
      toast.success("Course resubmitted for review successfully.");
      navigate('/hr/review-courses');
    }
  };

  const handleSaveDraft = () => {
    if (courseId && currentCourse) {
      updateCourseInStore(courseId, currentCourse as Course);
      toast.success("Changes saved to Draft.");
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      <AnimatePresence>
        {currentCourse.status === 'REJECTED' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-2xl overflow-hidden border border-amber-500/20 bg-amber-500/5"
          >
            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-600 dark:text-red-500">Manager Feedback Received</h3>
                  <p className="text-xs text-surface-500 mt-0.5">Manager has requested specific improvements. Address them below to resubmit.</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleResubmit}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Resubmit for Review
                </button>
              </div>
            </div>
            
            {/* Feedback Summary */}
            <div className="px-4 pb-4">
               <div className={cn(
                 "p-3 rounded-xl border border-dashed",
                 isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200"
               )}>
                 <p className="text-[10px] font-black uppercase text-surface-400 tracking-widest mb-2">Manager Review Notes</p>
                 {currentCourse.changeRequests && currentCourse.changeRequests.length > 0 ? (
                   <div className="space-y-2">
                      {currentCourse.changeRequests.slice().reverse().map(req => (
                        <div key={req.id} className="flex items-start gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                           <div>
                             <p className="text-xs font-bold">{req.title}</p>
                             <p className="text-xs text-surface-500 mt-0.5">{req.feedback}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <p className="text-xs text-surface-500 italic">No detailed feedback provided.</p>
                 )}
               </div>
            </div>
          </motion.div>
        )}

        {currentCourse.parentId && currentCourse.status === 'DRAFT' && (
           <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: 'auto' }}
             className="rounded-2xl overflow-hidden border border-primary-500/20 bg-primary-500/5"
           >
             <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-sm font-bold text-primary-600">Altering Version {currentCourse.version}</h3>
                      <p className="text-xs text-surface-500 mt-0.5">You are editing a new draft. The currently published version remains live for employees.</p>
                   </div>
                </div>
                <button 
                  onClick={handleSaveDraft}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Draft Changes
                </button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="relative pt-4">
        <CourseCreation />
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  Calendar,
  X,
  ShieldCheck,
  History,
  FileText,
  PlayCircle,
  Presentation,
  User,
  Info,
  Layers,
  ArrowRight,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ChangePriority } from '@/hr/types/course';

export default function ReviewCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { courses, startReview, requestChanges, approveCourse, publishCourse, schedulePublishing } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const course = courses.find((c) => c.id === courseId);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [feedback, setFeedback] = useState({ title: '', text: '', priority: 'Medium' as ChangePriority });
  const [scheduleDate, setScheduleDate] = useState('');

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-surface-400 mb-4" />
        <h2 className="text-xl font-bold">Course not found</h2>
        <button onClick={() => navigate('/hr/review-courses')} className="mt-4 text-primary-500 font-bold text-sm">
          ← Back to review queue
        </button>
      </div>
    );
  }

  const handleStartReview = () => {
    startReview(course.id);
    toast.success('Manager review started.');
  };

  const handleRequestChanges = () => {
    if (!feedback.title || !feedback.text) {
      toast.error('Feedback title and comments are required.');
      return;
    }
    requestChanges(course.id, { title: feedback.title, feedback: feedback.text, priority: feedback.priority });
    setShowFeedbackModal(false);
    setFeedback({ title: '', text: '', priority: 'Medium' });
    toast.success('Feedback sent to HR.');
    navigate('/hr/review-courses');
  };

  const handleManagerOK = () => {
    approveCourse(course.id);
    toast.success('Manager say OK! Ready to publish.');
  };

  const handlePublishNow = () => {
    publishCourse(course.id);
    toast.success('Published successfully!');
    navigate('/hr/published-courses');
  };

  const handleSchedule = () => {
    if (!scheduleDate) {
      toast.error('Select publication date.');
      return;
    }
    schedulePublishing(course.id, scheduleDate);
    toast.success('Publishing scheduled.');
    navigate('/hr/review-courses');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate('/hr/review-courses')}
          className="flex items-center gap-2 text-surface-500 hover:text-primary-500 font-bold text-sm transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Review Queue
        </button>        <div className="flex items-center gap-3 flex-wrap">
          {/* Action Flow - No 'Start Review' button needed */}
          {(course.status === 'PENDING_MANAGER_REVIEW' || course.status === 'ON_REVIEW') && (
            <>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-6 py-2.5 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Manager Feedback (Not OK)
              </button>
              <button
                onClick={handleManagerOK}
                className="px-8 py-2.5 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Manager OK
              </button>
            </>
          )}

          {/* Publishing Controls - Show after OK */}
          {course.status === 'READY_TO_PUBLISH' && (
            <div className="flex items-center gap-3 p-1 rounded-2xl bg-primary-500/5 border border-primary-500/10">
               <div className="px-4 py-1 flex items-center gap-2 text-primary-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Manager Approved</span>
               </div>
               <div className="h-8 w-px bg-primary-500/20" />
               <button
                  onClick={() => setShowScheduleModal(true)}
                  className={cn(
                    'px-6 py-2.5 rounded-xl font-bold transition-all',
                    isDark ? 'bg-surface-800 text-surface-200 hover:bg-surface-700' : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                  )}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="px-8 py-2.5 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all"
                >
                  Publish Now
                </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Inspector */}
          <div className={cn('p-8 rounded-3xl border', isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200 shadow-sm')}>
             <div className="flex flex-col md:flex-row gap-8">
                <div className="w-32 h-32 rounded-3xl overflow-hidden bg-surface-100 dark:bg-surface-800 flex-shrink-0 shadow-inner">
                   <img src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest border border-primary-500/20">
                         {course.status === 'READY_TO_PUBLISH' ? 'Approved By Manager' : 'Awaiting Decision'}
                      </span>
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">v{course.version}</span>
                   </div>
                   <h1 className="text-3xl font-extrabold tracking-tight mb-2">{course.title}</h1>
                   <p className={cn('text-sm leading-relaxed', isDark ? 'text-surface-400' : 'text-surface-500')}>{course.description}</p>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-4 mt-10">
                {[
                  { label: 'Passing Score', value: `${course.passingScore}%`, icon: <CheckCircle2 className="w-4 h-4" /> },
                  { label: 'Estimated Time', value: `${course.duration}h`, icon: <Clock className="w-4 h-4" /> },
                  { label: 'Attempts', value: String(course.maxAttempts), icon: <History className="w-4 h-4" /> },
                ].map((item) => (
                  <div key={item.label} className={cn('p-4 rounded-2xl border', isDark ? 'bg-surface-800 border-surface-700' : 'bg-surface-50 border-surface-100')}>
                    <div className="flex items-center gap-2 text-surface-400 mb-1">
                       {item.icon}
                       <p className="text-[10px] uppercase font-black tracking-widest">{item.label}</p>
                    </div>
                    <p className="text-xl font-bold text-primary-500">{item.value}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Feedback Board */}
          {course.changeRequests.length > 0 && (
            <div className={cn("p-8 rounded-3xl border border-dashed", isDark ? "bg-red-500/5 border-red-500/20" : "bg-red-50/50 border-red-200")}>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-red-500">
                <MessageSquare className="w-5 h-5" />
                Manager Feedback Log
              </h3>
              <div className="space-y-4">
                {course.changeRequests.map((cr) => (
                  <div key={cr.id} className={cn('p-5 rounded-2xl', isDark ? 'bg-surface-800' : 'bg-white shadow-sm border border-surface-100')}>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-sm">{cr.title}</h5>
                      <span className={cn('text-[9px] font-black uppercase px-2 py-1 rounded-lg', 
                         cr.priority === 'High' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                      )}>{cr.priority} Priority</span>
                    </div>
                    <p className={cn('text-xs leading-relaxed', isDark ? 'text-surface-400' : 'text-surface-600')}>{cr.feedback}</p>
                    <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between text-[10px] text-surface-400">
                        <span className="font-bold uppercase tracking-wider">Manager Decision</span>
                        <span>{new Date(cr.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div className="space-y-4">
             <h3 className="text-xl font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-500 drop-shadow-sm" />
                Curriculum Overview
             </h3>
             <div className="space-y-4">
                {course.modules.map((module, mIdx) => (
                  <div key={module.id} className={cn('p-6 rounded-2xl border', isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200 shadow-sm')}>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-primary-500/30">
                        {mIdx + 1}
                      </span>
                      <h4 className="font-bold text-lg">{module.title}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 ml-1">
                      {module.sessions.map((session) => (
                        <div key={session.id} className={cn('flex items-center justify-between p-3.5 rounded-xl border transition-colors', isDark ? 'bg-surface-800/40 border-surface-700/50' : 'bg-surface-50 border-surface-200/50')}>
                          <div className="flex items-center gap-3">
                            {session.type === 'Video' && <PlayCircle className="w-4 h-4 text-blue-500" />}
                            {session.type === 'PDF' && <FileText className="w-4 h-4 text-red-500" />}
                            {session.type === 'PPT' && <Presentation className="w-4 h-4 text-orange-500" />}
                            <span className="text-xs font-bold truncate max-w-[150px]">{session.title}</span>
                          </div>
                          <span className="text-[10px] font-black text-surface-400 uppercase">{Math.floor(session.duration / 60)}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Manager Decision Panel */}
          <div className={cn('p-6 rounded-3xl border shadow-xl', isDark ? 'bg-surface-900 border-surface-800 shadow-black/20' : 'bg-white border-surface-200 shadow-surface-200/50')}>
             <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-surface-400 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Manager Review Panel
             </h4>
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                      <User className="w-6 h-6" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] text-surface-400 uppercase font-black tracking-widest leading-none mb-1">Author</p>
                      <p className="text-sm font-bold truncate">{course.createdBy}</p>
                      <p className="text-[11px] text-surface-500 truncate">{course.department}</p>
                   </div>
                </div>

                <div className="space-y-2 mt-4 p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700">
                    <p className="text-[10px] text-surface-400 uppercase font-black tracking-widest text-center">Status</p>
                    <div className="font-black text-center text-primary-500 text-lg uppercase tracking-tight">
                       {course.status === 'Ready To Publish' ? 'Manager OK' : course.status}
                    </div>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-surface-400 flex items-center gap-2">
                <History className="w-4 h-4" />
                Review Audit Trail
             </h4>
             <div className="space-y-0 relative border-l-2 border-surface-100 dark:border-surface-800 ml-3 pl-6">
                {course.auditLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="relative pb-8 last:pb-0">
                     <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-surface-100 dark:bg-surface-800 border-2 border-primary-500 group-hover:scale-125 transition-transform" />
                     <p className="text-xs font-black tracking-tight leading-none mb-1">{log.action}</p>
                     <p className="text-[10px] text-surface-400">{log.user} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                     {log.comment && (
                       <div className="mt-2 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 text-[10px] leading-relaxed text-surface-500 border border-surface-100 dark:border-surface-700">
                          "{log.comment}"
                       </div>
                     )}
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Manager Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={cn('w-full max-w-lg rounded-[2rem] p-10 shadow-2xl relative border', isDark ? 'bg-surface-900 border-surface-700' : 'bg-white')}>
              <button onClick={() => setShowFeedbackModal(false)} className="absolute top-6 right-6 p-2 rounded-xl text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800">
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-3xl font-extrabold mb-8 tracking-tighter">Manager Feedback</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-surface-400">Issue Title</label>
                  <input type="text" value={feedback.title} onChange={(e) => setFeedback({ ...feedback, title: e.target.value })} className={cn('w-full px-5 py-4 rounded-2xl border font-bold text-sm focus:ring-4 focus:ring-primary-500/10', isDark ? 'bg-surface-800 border-surface-700' : 'bg-surface-50 border-surface-200')} placeholder="e.g. Broken video link in Module 1" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-surface-400">What needs to change?</label>
                  <textarea value={feedback.text} onChange={(e) => setFeedback({ ...feedback, text: e.target.value })} rows={4} className={cn('w-full px-5 py-4 rounded-2xl border font-medium text-sm resize-none focus:ring-4 focus:ring-primary-500/10', isDark ? 'bg-surface-800 border-surface-700' : 'bg-surface-50 border-surface-200')} placeholder="Describe the problem for HR..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   {['Medium', 'High'].map(p => (
                     <button key={p} onClick={() => setFeedback({...feedback, priority: p as any})} className={cn('py-3.5 rounded-2xl text-xs font-black uppercase border transition-all', feedback.priority === p ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-500/30' : 'bg-surface-100 dark:bg-surface-800 border-transparent text-surface-500')}>
                        {p} Priority
                     </button>
                   ))}
                </div>
              </div>
              <div className="flex gap-4 mt-10">
                <button onClick={() => setShowFeedbackModal(false)} className={cn('flex-1 py-4 rounded-2xl font-black text-sm uppercase', isDark ? 'bg-surface-800 border-surface-700' : 'bg-surface-100')}>Cancel</button>
                <button onClick={handleRequestChanges} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl shadow-red-500/30">Send Feedback</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals (Publish/Schedule) */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={cn('w-full max-w-sm rounded-[2rem] p-10 text-center shadow-2xl', isDark ? 'bg-surface-900 border border-surface-700' : 'bg-white')}>
               <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10" /></div>
               <h3 className="text-2xl font-black tracking-tight mb-3 text-surface-900 dark:text-white">Publish Immediately?</h3>
               <p className="text-sm text-surface-500 mb-10 leading-relaxed font-medium">This course will be active for all assigned learners. Manager has already approved.</p>
               <div className="flex flex-col gap-3">
                  <button onClick={handlePublishNow} className="py-4 bg-primary-600 text-white rounded-2xl font-black text-sm uppercase shadow-2xl shadow-primary-500/40">Confirm & Go Live</button>
                  <button onClick={() => setShowPublishModal(false)} className={cn('py-4 rounded-2xl font-black text-sm uppercase', isDark ? 'text-surface-400' : 'text-surface-500')}>Cancel</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={cn('w-full max-w-md rounded-[2rem] p-10 shadow-2xl border', isDark ? 'bg-surface-900 border-surface-700' : 'bg-white')}>
              <h3 className="text-2xl font-black tracking-tight mb-8">Schedule Publication</h3>
              <div className="space-y-6">
                <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} className={cn('w-full px-5 py-4 rounded-2xl border font-bold text-sm', isDark ? 'bg-surface-800 border-surface-700' : 'bg-surface-50 border-surface-200')} />
                <div className={cn('p-4 rounded-2xl flex gap-3 text-xs font-bold leading-relaxed', isDark ? 'bg-primary-500/10 text-primary-400' : 'bg-primary-50 text-primary-700')}>
                  <Info className="w-5 h-5 flex-shrink-0" />
                  The course will go live automatically. Current Zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              </div>
              <div className="flex gap-4 mt-10">
                <button onClick={() => setShowScheduleModal(false)} className={cn('flex-1 py-4 rounded-2xl font-black text-sm uppercase', isDark ? 'bg-surface-800' : 'bg-surface-100')}>Cancel</button>
                <button onClick={handleSchedule} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm uppercase shadow-xl shadow-primary-500/30">Schedule</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


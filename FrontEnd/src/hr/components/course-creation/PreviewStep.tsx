import React, { useState } from 'react';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import {
  BookOpen,
  Clock,
  Target,
  BarChart,
  Layers,
  PlayCircle,
  FileText,
  Presentation,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  FileUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface PreviewStepProps {
  onBack: () => void;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ onBack }) => {
  const { currentCourse, submitForReview } = useCourseStore();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const totalSessions = currentCourse.modules?.reduce((acc, m) => acc + m.sessions.length, 0) || 0;
  const totalDurationSeconds = currentCourse.modules?.reduce(
    (acc, m) => acc + m.sessions.reduce((sAcc, s) => sAcc + s.duration, 0),
    0
  ) || 0;

  const hours = Math.floor(totalDurationSeconds / 3600);
  const minutes = Math.floor((totalDurationSeconds % 3600) / 60);

  const confirmSubmit = async () => {
    if (currentCourse.id) {
      await submitForReview(currentCourse.id);
      toast.success('Course submitted for review!');
      navigate('/hr/review-courses');
    }
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Course Overview Card */}
      <div
        className={cn(
          'rounded-3xl border overflow-hidden',
          isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200 shadow-xl shadow-surface-200/50'
        )}
      >
        <div className="relative aspect-[21/9]">
          <img
            src={
              currentCourse.thumbnail ||
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80'
            }
            className="w-full h-full object-cover"
            alt="Course Thumbnail"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-surface-950/20 to-transparent" />
          <div className="absolute bottom-6 left-8 right-8">
            <span className="bg-primary-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              {currentCourse.category || 'General'}
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2">{currentCourse.title || 'Untitled Course'}</h2>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={cn('p-4 rounded-2xl', isDark ? 'bg-surface-800' : 'bg-surface-50')}>
              <p className="text-xs text-surface-400 mb-1">Passing Score</p>
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4 text-primary-500" />
                <span className="font-bold">{currentCourse.passingScore}%</span>
              </div>
            </div>
            <div className={cn('p-4 rounded-2xl', isDark ? 'bg-surface-800' : 'bg-surface-50')}>
              <p className="text-xs text-surface-400 mb-1">Max Attempts</p>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-500" />
                <span className="font-bold">{currentCourse.maxAttempts} Attempts</span>
              </div>
            </div>
            <div className={cn('p-4 rounded-2xl', isDark ? 'bg-surface-800' : 'bg-surface-50')}>
              <p className="text-xs text-surface-400 mb-1">Total Duration</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                <span className="font-bold">
                  {hours > 0 ? `${hours}h ` : ''}
                  {minutes}m
                </span>
              </div>
            </div>
            <div className={cn('p-4 rounded-2xl', isDark ? 'bg-surface-800' : 'bg-surface-50')}>
              <p className="text-xs text-surface-400 mb-1">Total Content</p>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-500" />
                <span className="font-bold">{currentCourse.modules?.length} Modules · {totalSessions} Sessions</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">About this course</h3>
            <p className={cn('text-sm leading-relaxed', isDark ? 'text-surface-400' : 'text-surface-600')}>
              {currentCourse.description || 'No description provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* Curriculum Preview */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Course Curriculum</h3>
        <div className="space-y-4">
          {currentCourse.modules?.map((module, mIdx) => (
            <div
              key={module.id}
              className={cn(
                'rounded-2xl border p-6',
                isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200'
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-sm">
                  {mIdx + 1}
                </div>
                <div>
                  <h4 className="font-bold">{module.title}</h4>
                  <p className="text-xs text-surface-500">{module.sessions.length} sessions</p>
                </div>
              </div>

              <div className="space-y-2 ml-11">
                {module.sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl',
                      isDark ? 'bg-surface-800/50' : 'bg-surface-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {session.type === 'Video' && <PlayCircle className="w-4 h-4 text-blue-500" />}
                      {session.type === 'PDF' && <FileText className="w-4 h-4 text-red-500" />}
                      {session.type === 'PPT' && <Presentation className="w-4 h-4 text-orange-500" />}
                      {session.type === 'SCORM' && <FileUp className="w-4 h-4 text-purple-500" />}
                      <span className="text-sm font-medium">{session.title}</span>
                    </div>
                    <span className="text-xs text-surface-400">
                      {Math.floor(session.duration / 60)}m {session.duration % 60}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Card */}
      <div
        className={cn(
          'p-8 rounded-3xl border text-center space-y-6',
          isDark ? 'bg-surface-900 border-surface-800' : 'bg-surface-50 border-surface-200'
        )}
      >
        <div className="w-16 h-16 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto">
          <Send className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Ready to Submit?</h3>
          <p className={cn('text-sm mt-1', isDark ? 'text-surface-400' : 'text-surface-500')}>
            This course will be sent to the reviewer for approval.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onBack}
            className={cn(
              'w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all',
              isDark ? 'bg-surface-800 hover:bg-surface-700' : 'bg-white border border-surface-200 hover:bg-surface-50'
            )}
          >
            Go Back & Edit
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full sm:w-auto px-12 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all"
          >
            Submit for Review
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'w-full max-w-md rounded-3xl p-8 shadow-2xl relative',
                isDark ? 'bg-surface-900 border border-surface-800' : 'bg-white'
              )}
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl border border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-bold mb-2">Confirm Submission</h3>
              <p className={cn('text-sm mb-8', isDark ? 'text-surface-400' : 'text-surface-500')}>
                Are you sure you want to submit this course for review? The wizard will reset after submission.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-bold transition-all',
                    isDark ? 'bg-surface-800 hover:bg-surface-700' : 'bg-surface-100 hover:bg-surface-200'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


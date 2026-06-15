import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';

export function SubmitSuccessScreen() {
  const { dismissSubmitSuccess } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const handleCreateAnother = () => {
    dismissSubmitSuccess();
  };

  const handleGoToReview = () => {
    dismissSubmitSuccess();
    navigate('/hr/review-courses');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-[60vh] flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4 max-w-md"
      >
        <h2 className={cn("text-3xl font-extrabold tracking-tight", isDark ? "text-white" : "text-surface-900")}>
          Course Submitted!
        </h2>
        <p className={cn("text-sm leading-relaxed", isDark ? "text-surface-400" : "text-surface-500")}>
          ✓ Course submitted successfully for review. The reviewer will inspect your content and provide feedback shortly.
          <br /><br />
          <span className="font-semibold">Start creating your next course.</span>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center gap-4 mt-10"
      >
        <button
          onClick={handleCreateAnother}
          className={cn(
            "flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold transition-all border",
            isDark
              ? "bg-surface-800 text-surface-200 border-surface-700 hover:bg-surface-700"
              : "bg-white text-surface-700 border-surface-200 hover:bg-surface-50 shadow-sm"
          )}
        >
          <PlusCircle className="w-5 h-5" />
          Create Another Course
        </button>

        <button
          onClick={handleGoToReview}
          className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-xl shadow-primary-500/25 transition-all"
        >
          Go To Review Courses
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  );
}


import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import { Stepper } from '@/hr/components/course-creation/Stepper';
import { MetadataStep } from '@/hr/components/course-creation/MetadataStep';
import { CurriculumStep } from '@/hr/components/course-creation/CurriculumStep';
import { QuizStep } from '@/hr/components/course-creation/QuizStep';
import { PreviewStep } from '@/hr/components/course-creation/PreviewStep';
import { SubmitSuccessScreen } from '@/hr/components/course-creation/SubmitSuccessScreen';
import { Save, ChevronLeft, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const STEPS = [
  { title: 'Course Metadata', description: 'Basic information' },
  { title: 'Modules & Sessions', description: 'Course content' },
  { title: 'Quiz & Questions', description: 'Assessment questions' },
  { title: 'Course Preview', description: 'Review & Submit' },
];

export default function CourseCreation({ noPadding = false }: { noPadding?: boolean }) {
  const {
    currentStep,
    setCurrentStep,
    saveDraft,
    isSaving,
    lastSaved,
    showSubmitSuccess,
  } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft().then(() => {
        toast.success('Draft auto-saved', {
          id: 'auto-save',
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          },
        });
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [saveDraft, isDark]);

  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const nextStep = () => {
    if (currentStep === 0) {
      // Trigger hidden form submit in MetadataStep for validation
      document.getElementById('metadata-submit')?.click();
      return;
    }
    goToNextStep();
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // After submission — show Success Screen instead of the wizard
  if (showSubmitSuccess) {
    return <SubmitSuccessScreen />;
  }

  const lastContentStep = STEPS.length - 2; // index 2 = QuizStep (last before preview)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "space-y-8 pb-24",
        !noPadding && "p-4 lg:p-8 max-w-[1600px] mx-auto text-left"
      )}
    >
      <Toaster position="bottom-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={cn('text-3xl font-extrabold tracking-tight', isDark ? 'text-white' : 'text-surface-900')}>
            Create New Course
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('text-sm', isDark ? 'text-surface-400' : 'text-surface-500')}>
              {isSaving
                ? 'Saving draft...'
                : lastSaved
                ? `Draft saved ${new Date(lastSaved).toLocaleTimeString()}`
                : 'Not saved yet'}
            </span>
            {isSaving && (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Save className="w-3 h-3 text-primary-500" />
              </motion.div>
            )}
          </div>
        </div>

        <button
          onClick={() => saveDraft()}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
            isDark
              ? 'bg-surface-800 text-surface-200 hover:bg-surface-700'
              : 'bg-white text-surface-700 hover:bg-surface-50 border border-surface-200 shadow-sm'
          )}
        >
          <Save className="w-4 h-4" />
          Save Draft
        </button>
      </div>

      {/* Stepper */}
      <Stepper steps={STEPS} currentStep={currentStep} />

      {/* Step Content */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 0 && <MetadataStep onNext={goToNextStep} />}
            {currentStep === 1 && <CurriculumStep onNext={goToNextStep} onBack={prevStep} />}
            {currentStep === 2 && <QuizStep onNext={goToNextStep} onBack={prevStep} />}
            {currentStep === 3 && <PreviewStep onBack={prevStep} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed bottom nav — only show on steps 0, 1, 2 */}
      {currentStep < STEPS.length - 1 && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 border-t p-4 z-40 backdrop-blur-xl',
            isDark ? 'bg-surface-950/80 border-surface-800' : 'bg-white/80 border-surface-200 shadow-lg'
          )}
        >
          <div className="max-w-[1600px] mx-auto flex justify-between items-center px-4 lg:px-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-30',
                isDark
                  ? 'bg-surface-800 text-surface-200 hover:bg-surface-700'
                  : 'bg-white text-surface-700 hover:bg-surface-50 border border-surface-200 shadow-sm'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all"
            >
              {currentStep === lastContentStep ? 'Go to Preview' : 'Continue'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import {
  Plus, Trash2, HelpCircle, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Save, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/api/client';
import type { Question } from '@/hr/types/course';

interface QuizStepProps {
  onNext: () => void;
  onBack: () => void;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

const emptyQuestion = (): Question => ({
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  sectionId: null,
});

export const QuizStep: React.FC<QuizStepProps> = ({ onNext, onBack }) => {
  const { currentCourse } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [expandedIdx, setExpandedIdx] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const courseId = currentCourse.id;

  // Fetch existing questions from DB
  const fetchQuestions = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await api.get(`/hr/courses/${courseId}/questions`);
      if (res.data && res.data.length > 0) {
        setQuestions(res.data.map((q: any) => ({
          id: q.id,
          courseId: q.courseId,
          sectionId: q.sectionId,
          question: q.question || '',
          optionA: q.optionA || '',
          optionB: q.optionB || '',
          optionC: q.optionC || '',
          optionD: q.optionD || '',
          correctAnswer: (q.correctAnswer || 'A') as 'A' | 'B' | 'C' | 'D',
        })));
      }
    } catch (e) {
      // No existing questions — start fresh
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, emptyQuestion()]);
    setExpandedIdx(questions.length);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    if (expandedIdx >= questions.length - 1) setExpandedIdx(Math.max(0, expandedIdx - 1));
  };

  const updateQuestion = (idx: number, field: keyof Question, value: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const saveQuestions = async () => {
    if (!courseId) {
      toast.error('Please save the course first before adding questions.');
      return;
    }

    // Validate — every question must have text and options A+B
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1}: Question text is required.`);
        setExpandedIdx(i);
        return;
      }
      if (!q.optionA.trim() || !q.optionB.trim()) {
        toast.error(`Question ${i + 1}: At least options A and B are required.`);
        setExpandedIdx(i);
        return;
      }
    }

    setSaving(true);
    try {
      await api.post(`/hr/courses/${courseId}/questions`, questions);
      toast.success(`${questions.length} question(s) saved successfully!`);
      await fetchQuestions(); // Refresh from DB to get IDs
    } catch (err: any) {
      toast.error('Failed to save questions: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await saveQuestions();
    onNext();
  };

  const getOptionValue = (q: Question, label: 'A' | 'B' | 'C' | 'D') => {
    if (label === 'A') return q.optionA;
    if (label === 'B') return q.optionB;
    if (label === 'C') return q.optionC;
    if (label === 'D') return q.optionD;
    return '';
  };

  const optionField = (label: 'A' | 'B' | 'C' | 'D'): keyof Question => {
    return `option${label}` as keyof Question;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mr-3" />
        <span className="text-surface-500 font-semibold">Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Quiz Questions</h3>
          <p className={cn('text-sm mt-1', isDark ? 'text-surface-400' : 'text-surface-500')}>
            Add questions that employees will answer to assess their understanding.
          </p>
        </div>
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {!courseId && (
        <div className={cn(
          'p-4 rounded-2xl border flex items-center gap-3',
          isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
        )}>
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Save the course draft first before adding questions. Click "Save Draft" button above.
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        <AnimatePresence>
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className={cn(
                'rounded-2xl border overflow-hidden transition-all',
                isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-200 shadow-sm',
                expandedIdx === idx && (isDark ? 'border-primary-500/30 ring-1 ring-primary-500/20' : 'border-primary-300 ring-2 ring-primary-500/10')
              )}
            >
              {/* Question Header */}
              <button
                type="button"
                onClick={() => setExpandedIdx(expandedIdx === idx ? -1 : idx)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm',
                    expandedIdx === idx
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : isDark ? 'bg-surface-800 text-surface-400' : 'bg-surface-100 text-surface-600'
                  )}>
                    {idx + 1}
                  </div>
                  <span className={cn(
                    'text-sm font-semibold truncate',
                    q.question ? (isDark ? 'text-white' : 'text-surface-900') : 'text-surface-400 italic'
                  )}>
                    {q.question || 'Untitled question…'}
                  </span>
                  {q.correctAnswer && (
                    <span className="ml-1 px-2 py-0.5 rounded-lg bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-wider flex-shrink-0">
                      Ans: {q.correctAnswer}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedIdx === idx ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
                </div>
              </button>

              {/* Expanded Body */}
              <AnimatePresence>
                {expandedIdx === idx && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={cn('px-5 pb-6 space-y-5 border-t', isDark ? 'border-surface-800' : 'border-surface-100')}>
                      {/* Question Text */}
                      <div className="space-y-2 pt-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Question Text
                        </label>
                        <textarea
                          value={q.question}
                          onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                          placeholder="Enter your question here..."
                          rows={2}
                          className={cn(
                            'w-full px-4 py-3 rounded-xl border text-sm resize-none transition-all focus:ring-2 focus:ring-primary-500/20 outline-none',
                            isDark ? 'bg-surface-800 border-surface-700 text-white placeholder-surface-500' : 'bg-surface-50 border-surface-200 placeholder-surface-400'
                          )}
                        />
                      </div>

                      {/* Options Grid */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-400">
                          Answer Options
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {OPTION_LABELS.map((label) => (
                            <div key={label} className="relative">
                              <div className={cn(
                                'absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black transition-all',
                                q.correctAnswer === label
                                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                  : isDark ? 'bg-surface-700 text-surface-400' : 'bg-surface-200 text-surface-600'
                              )}>
                                {label}
                              </div>
                              <input
                                type="text"
                                value={getOptionValue(q, label)}
                                onChange={(e) => updateQuestion(idx, optionField(label), e.target.value)}
                                placeholder={`Option ${label}${label === 'C' || label === 'D' ? ' (optional)' : ' (required)'}`}
                                className={cn(
                                  'w-full pl-11 pr-3 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 outline-none',
                                  q.correctAnswer === label
                                    ? 'border-green-500/40 bg-green-500/5 focus:ring-green-500/20'
                                    : isDark
                                    ? 'bg-surface-800 border-surface-700 text-white placeholder-surface-500 focus:ring-primary-500/20'
                                    : 'bg-surface-50 border-surface-200 placeholder-surface-400 focus:ring-primary-500/20'
                                )}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Correct Answer Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          Correct Answer
                        </label>
                        <div className="flex gap-2">
                          {OPTION_LABELS.map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => updateQuestion(idx, 'correctAnswer', label)}
                              className={cn(
                                'flex-1 py-2.5 rounded-xl text-sm font-black transition-all border',
                                q.correctAnswer === label
                                  ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30'
                                  : isDark
                                  ? 'bg-surface-800 border-surface-700 text-surface-400 hover:bg-surface-700'
                                  : 'bg-surface-100 border-surface-200 text-surface-600 hover:bg-surface-200'
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {questions.length === 0 && (
          <div className={cn(
            'py-16 rounded-3xl border-2 border-dashed flex flex-col items-center text-center',
            isDark ? 'border-surface-800 bg-surface-900/50' : 'border-surface-200 bg-surface-50'
          )}>
            <HelpCircle className="w-12 h-12 text-surface-300 mb-3" />
            <h4 className="font-bold text-surface-600 dark:text-surface-400">No questions yet</h4>
            <p className="text-sm text-surface-500 mt-1 mb-4">Add quiz questions to assess employee understanding.</p>
            <button
              onClick={addQuestion}
              className="px-6 py-2 rounded-xl border border-primary-500 text-primary-500 font-bold hover:bg-primary-500 hover:text-white transition-all"
            >
              Add First Question
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      {questions.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <p className={cn('text-sm', isDark ? 'text-surface-400' : 'text-surface-500')}>
            {questions.length} question{questions.length !== 1 ? 's' : ''} total
          </p>
          <button
            onClick={saveQuestions}
            disabled={saving || !courseId}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all',
              saving || !courseId
                ? 'opacity-50 cursor-not-allowed bg-surface-300 text-surface-600'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20'
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Questions'}
          </button>
        </div>
      )}
    </div>
  );
};

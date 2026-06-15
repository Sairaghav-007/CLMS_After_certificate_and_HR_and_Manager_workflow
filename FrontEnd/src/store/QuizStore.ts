import { create } from 'zustand';
import type { QuizAttempt } from '@/shared/types';

interface QuizState {
  currentAttempt: QuizAttempt | null;
  currentQuestionIndex: number;
  timeRemaining: number;
  isSubmitting: boolean;
  startQuiz: (attempt: QuizAttempt) => void;
  answerQuestion: (questionId: string, answers: string[]) => void;
  flagQuestion: (questionId: string) => void;
  unflagQuestion: (questionId: string) => void;
  setCurrentQuestion: (index: number) => void;
  setTimeRemaining: (time: number) => void;
  setSubmitting: (submitting: boolean) => void;
  endQuiz: () => void;
}

export const useQuizStore = create<QuizState>()((set) => ({
  currentAttempt: null,
  currentQuestionIndex: 0,
  timeRemaining: 0,
  isSubmitting: false,

  startQuiz: (attempt) =>
    set({
      currentAttempt: attempt,
      currentQuestionIndex: 0,
      timeRemaining: 0,
      isSubmitting: false,
    }),

  answerQuestion: (questionId, answers) =>
    set((state) => ({
      currentAttempt: state.currentAttempt
        ? {
            ...state.currentAttempt,
            answers: { ...state.currentAttempt.answers, [questionId]: answers },
          }
        : null,
    })),

  flagQuestion: (questionId) =>
    set((state) => ({
      currentAttempt: state.currentAttempt
        ? {
            ...state.currentAttempt,
            flaggedQuestions: [...state.currentAttempt.flaggedQuestions, questionId],
          }
        : null,
    })),

  unflagQuestion: (questionId) =>
    set((state) => ({
      currentAttempt: state.currentAttempt
        ? {
            ...state.currentAttempt,
            flaggedQuestions: state.currentAttempt.flaggedQuestions.filter((id) => id !== questionId),
          }
        : null,
    })),

  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),
  endQuiz: () => set({ currentAttempt: null, currentQuestionIndex: 0, timeRemaining: 0 }),
}));

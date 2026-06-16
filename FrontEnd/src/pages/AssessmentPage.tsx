import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Award,
  Loader2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useCourseStore, useUIStore, useQuizStore, useAuthStore } from '@/shared/store';
import { useTimer, useContentProtection } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import { QuestionType, CourseCategory, CompletionStatus } from '@/shared/types';
import { api } from '../api/client';

export function AssessmentPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  // Protect page content from screenshots/context menu
  useContentProtection();

  const user = useAuthStore(state => state.user);
  const { courses, submitAssessmentPass } = useCourseStore();
  const { addToast } = useUIStore();
  const { 
    currentAttempt, 
    currentQuestionIndex, 
    startQuiz, 
    answerQuestion, 
    flagQuestion, 
    unflagQuestion, 
    setCurrentQuestion, 
    endQuiz 
  } = useQuizStore();

  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [scoreResult, setScoreResult] = useState<number | null>(null);
  const [isPassedResult, setIsPassedResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Retrieve course from cache
  const course = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const assessment = course?.assessment;

  // Fetch from API on refresh or if questions are empty
  useEffect(() => {
    if (!courseId) return;
    if (course && course.assessment && course.assessment.questions && course.assessment.questions.length > 0) return;
    api.get(`/employee/courses/${courseId}`)
      .then((res) => {
        const data = res.data;
        const categoryMap: Record<string, CourseCategory> = {
          MANDATORY: CourseCategory.MANDATORY, COMPLIANCE: CourseCategory.MANDATORY,
          TECHNICAL: CourseCategory.ELECTIVE,  ELECTIVE: CourseCategory.ELECTIVE,
          HR: CourseCategory.DEPARTMENT,       'DEPARTMENT-ORIENTED': CourseCategory.DEPARTMENT,
        };
        const questionResponses = (data.assessment?.questions || []).map((q: any) => ({
          id: String(q.id), type: q.type || 'mcq', text: q.text,
          options: q.options || [], correctAnswers: q.correctAnswers || [], points: q.points || 5,
        }));
        const mappedCourse = {
          id: String(data.id),
          title: data.title,
          description: data.description || '',
          thumbnail: data.thumbnail || '',
          category: categoryMap[data.category?.toUpperCase()?.replace(/ /g, '-')] || CourseCategory.ELECTIVE,
          instructor: { id: 'INS-DEFAULT', name: 'Corporate Trainer', title: 'L&D Trainer', avatar: '', bio: '' },
          duration: 3,
          totalModules: (data.modules || []).length,
          totalAssessments: 1,
          progress: data.progress || 100, // on assessment page assume content complete
          status: CompletionStatus.COMPLETED,
          dueDate: data.dueDate || '',
          assignedDate: '', lastUpdated: '',
          objectives: [], learningOutcomes: [],
          completionCriteria: 'Complete all sections and score 80% on final quiz.',
          passingPercentage: 80,
          modules: [],
          assessment: {
            id: `AST-${data.id}`,
            title: `${data.title} Final Quiz`,
            courseId: String(data.id),
            timeLimit: data.assessment?.timeLimit || 15,
            passingPercentage: data.assessment?.passingPercentage || 80,
            maxAttempts: data.maxAttempts || 3,
            attemptsUsed: data.assessment?.attemptsUsed || 0,
            isLocked: false,
            isPassed: data.assessment?.isPassed || false,
            shuffleQuestions: false, shuffleOptions: false,
            negativeMarking: false, negativeMarkValue: 0,
            questions: questionResponses,
            lastScore: data.assessment?.lastScore,
          },
          certificate: undefined,
          popularity: 85,
          department: data.department || '',
        };
        useCourseStore.setState((state) => ({
          courses: state.courses.some(c => c.id === mappedCourse.id)
            ? state.courses.map(c => c.id === mappedCourse.id ? mappedCourse : c)
            : [...state.courses, mappedCourse]
        }));
      })
      .catch((err) => console.error('Failed to load course for assessment:', err));
  }, [courseId, course]);

  // Verify completed syllabus locks before access
  useEffect(() => {
    if (course && course.progress < 100) {
      addToast({
        title: 'Quiz Locked',
        message: 'You must complete all course modules to access the final assessment.',
        type: 'warning'
      });
      navigate(`/employee/courses/${courseId}`);
    }
  }, [course, courseId, navigate, addToast]);

  const timeLimit = assessment?.timeLimit || 15; // default 15m

  // Timer expire handler
  const handleTimeExpiry = () => {
    addToast({
      title: 'Time Expired',
      message: 'The assessment time has limit has reached. Auto-submitting answers.',
      type: 'warning'
    });
    handleSubmitQuiz();
  };

  const { timeRemaining, formattedTime, start } = useTimer(timeLimit, handleTimeExpiry);

  const activeQuestion = useMemo(() => {
    if (!assessment?.questions || assessment.questions.length === 0) return null;
    return assessment.questions[currentQuestionIndex];
  }, [assessment, currentQuestionIndex]);

  const handleStart = () => {
    if (!assessment) return;
    
    // Check attempt limits
    if (assessment.attemptsUsed >= assessment.maxAttempts && !assessment.isPassed) {
      addToast({
        title: 'Attempts Exceeded',
        message: 'You have reached the maximum allowed attempts for this assessment.',
        type: 'error'
      });
      return;
    }

    const newAttempt = {
      id: `ATT-${Date.now()}`,
      assessmentId: assessment.id,
      startTime: new Date().toISOString(),
      answers: {},
      flaggedQuestions: [],
      totalQuestions: assessment.questions.length
    };

    startQuiz(newAttempt);
    setQuizStarted(true);
    start();
  };

  const handleAnswerSelect = (optionId: string) => {
    if (!activeQuestion || !currentAttempt) return;
    
    const currentAnswers = currentAttempt.answers[activeQuestion.id] || [];
    let newAnswers: string[] = [];

    if (activeQuestion.type === QuestionType.MULTIPLE_SELECT) {
      if (currentAnswers.includes(optionId)) {
        newAnswers = currentAnswers.filter(id => id !== optionId);
      } else {
        newAnswers = [...currentAnswers, optionId];
      }
    } else {
      // MCQ or True/False is single select
      newAnswers = [optionId];
    }

    answerQuestion(activeQuestion.id, newAnswers);
  };

  const toggleFlag = () => {
    if (!activeQuestion || !currentAttempt) return;
    const isFlagged = currentAttempt.flaggedQuestions.includes(activeQuestion.id);
    if (isFlagged) {
      unflagQuestion(activeQuestion.id);
    } else {
      flagQuestion(activeQuestion.id);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestion(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestionIndex + 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!assessment || !currentAttempt) return;
    setLoading(true);

    setTimeout(() => {
      // Calculate locally
      const questions = assessment.questions;
      let correctAnswersCount = 0;

      questions.forEach((q) => {
        const userAnswers = currentAttempt.answers[q.id] || [];
        const correctAnswers = q.correctAnswers || [];
        
        const isCorrect = userAnswers.length === correctAnswers.length &&
          userAnswers.every(ans => correctAnswers.includes(ans));

        if (isCorrect) correctAnswersCount++;
      });

      const score = Math.round((correctAnswersCount / questions.length) * 100);
      const isPassed = score >= assessment.passingPercentage;

      // Register pass/fail results in CourseStore
      const employeeName = user?.fullName || 'Employee Member';
      if (courseId) {
        submitAssessmentPass(courseId, score, employeeName);
      }

      setScoreResult(score);
      setIsPassedResult(isPassed);
      setQuizFinished(true);
      setLoading(false);
      endQuiz();

      if (isPassed) {
        addToast({
          title: 'Assessment Passed!',
          message: `Congratulations! You scored ${score}% and unlocked your certificate.`,
          type: 'success'
        });
      } else {
        addToast({
          title: 'Assessment Failed',
          message: `You scored ${score}%. The passing threshold is ${assessment.passingPercentage}%.`,
          type: 'error'
        });
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-950 text-white">
         <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
            <p className="text-surface-450 font-bold animate-pulse text-xs uppercase tracking-widest">Grading assessment papers securely...</p>
         </div>
      </div>
    );
  }

  if (!course || !assessment) {
    return (
      <div className="p-8 text-center min-h-[400px] flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
        <p className="text-sm text-surface-450 font-bold uppercase tracking-wider">Configuring secure assessment terminal...</p>
      </div>
    );
  }

  // Result display screens
  if (quizFinished) {
    return (
      <div className="min-h-[calc(h-screen-4rem)] flex items-center justify-center p-4 lg:p-8 select-none text-left">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white rounded-3xl border border-surface-200 shadow-xl overflow-hidden p-6 lg:p-10 flex flex-col items-center text-center"
        >
          {isPassedResult ? (
            <div className="w-16 h-16 rounded-2xl bg-success-50 flex items-center justify-center text-success-600 mb-6 border border-success-200/50">
              <CheckCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center text-danger-500 mb-6 border border-danger-200/50">
              <XCircle className="w-8 h-8" />
            </div>
          )}

          <h2 className="text-xl lg:text-2xl font-black text-surface-900 mb-2">
            {isPassedResult ? 'Assessment Completed!' : 'Threshold Not Reached'}
          </h2>
          <p className="text-xs text-surface-450 font-semibold max-w-sm mb-8 leading-relaxed">
            {isPassedResult 
              ? 'Excellent work! You have verified your proficiency and passed this learning module assessment.'
              : 'You did not achieve the required threshold score. Please review the course syllabus resources and attempt again.'
            }
          </p>

          {/* Score Circle widget */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                className="stroke-surface-100" 
                strokeWidth="10" 
                fill="transparent" 
              />
              <motion.circle 
                cx="80" 
                cy="80" 
                r="70" 
                className={isPassedResult ? "stroke-success-500" : "stroke-danger-500"}
                strokeWidth="10" 
                fill="transparent" 
                strokeDasharray={439.8}
                initial={{ strokeDashoffset: 439.8 }}
                animate={{ strokeDashoffset: 439.8 - (439.8 * (scoreResult || 0)) / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-surface-900">{scoreResult}%</span>
              <span className="text-[10px] text-surface-400 font-bold uppercase tracking-wider mt-1">Your Score</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 text-left border-y border-surface-100 py-5 mb-8 text-xs font-semibold">
            <div>
              <p className="text-surface-400 uppercase tracking-widest text-[9px] font-black mb-1">Passing Threshold</p>
              <p className="text-surface-800 text-sm font-bold">{assessment.passingPercentage}%</p>
            </div>
            <div>
              <p className="text-surface-400 uppercase tracking-widest text-[9px] font-black mb-1">Status</p>
              <p className={cn("text-sm font-black uppercase tracking-wider", isPassedResult ? "text-success-600" : "text-danger-600")}>
                {isPassedResult ? 'PASSED' : 'FAILED'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {isPassedResult ? (
              <button
                onClick={() => navigate('/employee/certificates')}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-amber-500/15 cursor-pointer"
              >
                <Award size={15} />
                View Certificate
              </button>
            ) : (
              assessment.attemptsUsed < assessment.maxAttempts && (
                <button
                  onClick={() => {
                    setQuizFinished(false);
                    setScoreResult(null);
                    setIsPassedResult(null);
                    handleStart();
                  }}
                  className="flex-1 px-5 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-primary-500/10 cursor-pointer"
                >
                  Retake Assessment
                </button>
              )
            )}
            <button
              onClick={() => navigate(`/employee/courses/${courseId}`)}
              className="flex-1 px-5 py-3.5 bg-surface-50 hover:bg-surface-100 border border-surface-200 text-surface-700 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Back to Course
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active quiz screen
  if (quizStarted && activeQuestion && currentAttempt) {
    const isQuestionFlagged = currentAttempt.flaggedQuestions.includes(activeQuestion.id);
    const selectedAnswers = currentAttempt.answers[activeQuestion.id] || [];

    return (
      <div className="h-screen flex flex-col bg-surface-950 text-white overflow-hidden text-left font-sans select-none">
        {/* Quiz Header */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-surface-900 border-b border-white/5 relative z-30">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse" />
            <div>
              <h1 className="text-sm font-bold truncate max-w-[180px] sm:max-w-md">{assessment.title}</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-0.5">Secure Exam Node</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm tracking-wider transition-colors",
              timeRemaining < 60 
                ? "bg-danger-500/10 border-danger-500/30 text-danger-400" 
                : timeRemaining < 180 
                ? "bg-warning-500/10 border-warning-500/30 text-warning-400"
                : "bg-white/5 border-white/10 text-white"
            )}>
              <Clock size={15} />
              <span>{formattedTime}</span>
            </div>

            <button 
              onClick={handleSubmitQuiz}
              className="px-4 py-2 bg-danger-600 hover:bg-danger-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-danger-500/10"
            >
              Submit Exam
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Quiz main panel */}
          <main className="flex-1 overflow-y-auto bg-surface-950 p-4 lg:p-8 flex flex-col justify-between">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between">
              
              {/* Question card */}
              <div className="flex-1 py-4">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-white/50 rounded text-[9px] font-black uppercase tracking-wider">
                      Question {currentQuestionIndex + 1} of {assessment.questions.length}
                    </span>
                    <h2 className="text-base font-bold text-white/95 mt-2.5 leading-snug">{activeQuestion.text}</h2>
                  </div>

                  <button
                    onClick={toggleFlag}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all cursor-pointer flex-shrink-0",
                      isQuestionFlagged
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    )}
                  >
                    <Flag size={16} />
                  </button>
                </div>

                {/* Multiple select helper */}
                {activeQuestion.type === QuestionType.MULTIPLE_SELECT && (
                  <div className="mb-4 flex items-center gap-2 text-primary-400 bg-primary-950/20 border border-primary-500/10 px-3.5 py-2 rounded-xl text-xs font-semibold">
                    <ShieldAlert size={14} />
                    <span>Multiple choices can be selected. Choose all that apply.</span>
                  </div>
                )}

                {/* Options selectors */}
                <div className="space-y-3 mt-6">
                  {activeQuestion.options.map((opt) => {
                    const isChecked = selectedAnswers.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswerSelect(opt.id)}
                        className={cn(
                          "w-full p-4 rounded-2xl border transition-all duration-200 text-left flex items-center gap-4 cursor-pointer",
                          isChecked
                            ? "bg-primary-600/15 border-primary-500 text-white ring-1 ring-primary-500/30"
                            : "bg-surface-900 border-white/5 hover:border-white/10 text-white/70 hover:text-white"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded flex items-center justify-center text-[10px] font-black border flex-shrink-0 transition-colors",
                          isChecked
                            ? "bg-primary-500 border-primary-400 text-white"
                            : "border-white/20 text-transparent"
                        )}>
                          ✓
                        </div>
                        <span className="text-xs font-semibold">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation button panel */}
              <div className="flex items-center justify-between py-4 border-t border-white/5 flex-shrink-0">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                    currentQuestionIndex === 0
                      ? "opacity-30 border-white/5 text-white/25 cursor-not-allowed"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  <ArrowLeft size={14} />
                  Prev
                </button>

                <div className="flex gap-2">
                  {currentQuestionIndex === assessment.questions.length - 1 ? (
                    <button
                      onClick={handleSubmitQuiz}
                      className="flex items-center gap-2 px-5 py-2.5 bg-success-600 hover:bg-success-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-success-500/10"
                    >
                      Finish Exam
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-primary-500/10"
                    >
                      Next
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>

            </div>
          </main>

          {/* Exam status overview sidebar */}
          <aside className="hidden md:flex flex-col w-72 bg-surface-900 border-l border-white/5 h-full">
            <div className="p-6 border-b border-white/5 flex-shrink-0">
              <h3 className="font-bold text-sm text-white/90">Exam Roadmap</h3>
              <p className="text-[10px] text-white/40 mt-1 uppercase font-semibold">Monitor progress and flagged questions</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-4 gap-3 content-start">
              {assessment.questions.map((q, idx) => {
                const isAnswered = (currentAttempt.answers[q.id] || []).length > 0;
                const isFlagged = currentAttempt.flaggedQuestions.includes(q.id);
                const isActive = idx === currentQuestionIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(idx)}
                    className={cn(
                      "aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-black transition-all cursor-pointer relative",
                      isActive
                        ? "bg-primary-600 border-primary-400 text-white ring-2 ring-primary-500/30 shadow-lg shadow-primary-500/10"
                        : isFlagged
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse"
                        : isAnswered
                        ? "bg-success-500/10 border-success-500/30 text-success-400"
                        : "bg-surface-950 border-white/5 text-white/30 hover:border-white/10 hover:text-white/60"
                    )}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sidebar legend stats */}
            <div className="p-6 border-t border-white/10 bg-surface-950/30 flex-shrink-0 space-y-3.5 text-xs text-white/60 font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase tracking-widest text-[9px] font-black">Completed</span>
                <span>{Object.keys(currentAttempt.answers).length} / {assessment.questions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 uppercase tracking-widest text-[9px] font-black">Flagged</span>
                <span className="text-amber-400">{currentAttempt.flaggedQuestions.length} questions</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Pre-quiz instructions panel
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 lg:p-8 select-none text-left">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-3xl border border-surface-200 shadow-xl overflow-hidden"
      >
        <div className="p-6 lg:p-10">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest leading-none mb-1">Learning Assessment</p>
              <h2 className="text-lg lg:text-xl font-black text-surface-900 leading-snug">{assessment.title}</h2>
            </div>
          </div>

          <p className="text-xs text-surface-500 font-semibold leading-relaxed mb-6">
            This is a secure enterprise assessment to verify your comprehension of the syllabus material. Please review the rules below before initializing the terminal connection.
          </p>

          {/* Assessment Specifications list */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3.5 text-xs font-semibold">
              <Clock className="w-4.5 h-4.5 text-surface-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-surface-800 leading-snug">Timed Duration</p>
                <p className="text-surface-450 mt-0.5">You have {timeLimit} minutes to complete all questions. The timer runs continuously once started.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 text-xs font-semibold">
              <CheckCircle className="w-4.5 h-4.5 text-surface-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-surface-800 leading-snug">Passing Score Required</p>
                <p className="text-surface-450 mt-0.5">Must achieve {assessment.passingPercentage}% score to pass. Passing unlocks your certificate.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 text-xs font-semibold">
              <ShieldAlert className="w-4.5 h-4.5 text-surface-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-surface-800 leading-snug">Enterprise Security Policy</p>
                <p className="text-surface-450 mt-0.5">DevTools keys, context menus, page printing, and screen copy operations are strictly disabled during exam mode.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 text-xs font-semibold">
              <AlertTriangle className="w-4.5 h-4.5 text-surface-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-surface-800 leading-snug">Attempts Allowed</p>
                <p className="text-surface-450 mt-0.5">Attempt limit: {assessment.maxAttempts}. Used attempts: {assessment.attemptsUsed} of {assessment.maxAttempts}.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 border-t border-surface-100 pt-6">
            <button
              onClick={() => navigate(`/employee/courses/${courseId}`)}
              className="px-5 py-3.5 bg-surface-50 hover:bg-surface-100 border border-surface-200 text-surface-700 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={assessment.attemptsUsed >= assessment.maxAttempts}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer",
                assessment.attemptsUsed >= assessment.maxAttempts
                  ? "bg-surface-200 border border-surface-300 text-surface-400 cursor-not-allowed shadow-none"
                  : "bg-primary-600 hover:bg-primary-700 shadow-primary-500/10"
              )}
            >
              <span>Initialize Exam Terminal</span>
              <ChevronRight size={14} />
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

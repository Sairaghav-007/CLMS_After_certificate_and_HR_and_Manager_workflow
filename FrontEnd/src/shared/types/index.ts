// ─── Enums ───────────────────────────────────────────────
export enum CourseCategory {
  MANDATORY = 'mandatory',
  ELECTIVE = 'elective',
  DEPARTMENT = 'department',
}

export enum CompletionStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum ModuleResourceType {
  VIDEO = 'video',
  PDF = 'pdf',
  PPT = 'ppt',
  READING = 'reading',
  INTERACTIVE = 'interactive',
}

export enum QuestionType {
  MCQ = 'mcq',
  MULTIPLE_SELECT = 'multiple_select',
  TRUE_FALSE = 'true_false',
}

export enum NotificationType {
  COURSE_ASSIGNED = 'course_assigned',
  DUE_DATE_REMINDER = 'due_date_reminder',
  QUIZ_UNLOCK = 'quiz_unlock',
  QUIZ_FAILURE = 'quiz_failure',
  QUIZ_SUCCESS = 'quiz_success',
  CERTIFICATE_GENERATED = 'certificate_generated',
}
 
export type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

// ─── Interfaces ──────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  avatar: string;
  role: string;
  joinDate: string;
  linkedinId: string;
  teamId: string;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
}

export interface ModuleResource {
  id: string;
  type: ModuleResourceType;
  title: string;
  duration: number; // minutes
  url: string;
  isCompleted: boolean;
  progress: number; // 0-100
  totalPages?: number;
  pagesViewed?: number[];
  watchedDuration?: number;
  totalDuration?: number;
  lastPosition?: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isLocked: boolean;
  isCompleted: boolean;
  resources: ModuleResource[];
  completionPercentage: number;
}

export interface Assessment {
  id: string;
  title: string;
  courseId: string;
  timeLimit: number; // minutes
  passingPercentage: number;
  maxAttempts: number;
  attemptsUsed: number;
  isLocked: boolean;
  isPassed: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  negativeMarking: boolean;
  negativeMarkValue: number;
  questions: Question[];
  lastScore?: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  correctAnswers: string[];
  points: number;
  explanation?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuizAttempt {
  id: string;
  assessmentId: string;
  startTime: string;
  endTime?: string;
  answers: Record<string, string[]>;
  flaggedQuestions: string[];
  score?: number;
  isPassed?: boolean;
  totalQuestions: number;
  correctAnswers?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: CourseCategory;
  instructor: Instructor;
  duration: number; // hours
  totalModules: number;
  totalAssessments: number;
  progress: number;
  status: CompletionStatus;
  dueDate: string;
  assignedDate: string;
  lastUpdated: string;
  objectives: string[];
  learningOutcomes: string[];
  completionCriteria: string;
  passingPercentage: number;
  modules: Module[];
  assessment?: Assessment;
  certificate?: Certificate;
  popularity: number;
  department: string;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  employeeName: string;
  employeeId: string;
  completionDate: string;
  certificateNumber: string;
  qrCodeData: string;
  verificationUrl: string;
  instructorName: string;
  instructorSignature: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  courseId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  assignedCourses: number;
  completedCourses: number;
  certificatesEarned: number;
  learningHours: number;
  mandatoryPending: number;
  upcomingDueDates: { courseTitle: string; dueDate: string }[];
  progressTrends: { month: string; hours: number; courses: number; week?: string; quarter?: string; year?: string }[];
  categoryDistribution: { category: string; count: number; color: string; hours: number }[];
}

// ─── Filter Types ────────────────────────────────────────

export interface CourseFilters {
  search: string;
  category: CourseCategory | 'all';
  status: CompletionStatus | 'all';
  dueDate: 'all' | 'this_week' | 'this_month';
  department: string;
  durationRange: [number, number] | null;
  completionRange: [number, number] | null;
  sortBy: 'dueDate' | 'assignedDate' | 'popularity' | 'progress';
  sortOrder: 'asc' | 'desc';
}

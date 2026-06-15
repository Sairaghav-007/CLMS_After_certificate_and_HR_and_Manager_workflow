// ============================================================
// CORE TYPES FOR MANAGER DASHBOARD - CORPORATE LMS
// ============================================================

// --- Employee & Team ---
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  joiningDate: string;
  team: string;
  group: string;
  avatar: string;
  assignedCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  overdueCourses: number;
  averageQuizScore: number;
  certificatesEarned: number;
  learningHours: number;
  status: 'Compliant' | 'Non-Compliant' | 'At Risk';
  linkedinUrl?: string;
}

export interface EmployeeCourseProgress {
  courseId: string;
  courseName: string;
  completionPercent: number;
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Not Started' | 'Overdue';
  quizScore?: number;
  passingScore: number;
}

// --- Dashboard KPIs ---
export interface DashboardKPI {
  totalTeamMembers: number;
  assignedCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  overdueEmployees: number;
  teamCompletionRate: number;
  averageQuizScore: number;
  certificatesEarned: number;
}

// --- Nudge / Reminders ---
export type NudgeMode = 'Reminder' | 'Alert';
export type NudgeChannel = 'Email' | 'In-App Notification';

export interface NudgeTemplate {
  id: string;
  name: string;
  message: string;
  mode: NudgeMode;
}

export interface NudgeRecord {
  id: string;
  employeeIds: string[];
  templateId: string;
  channel: NudgeChannel;
  mode: NudgeMode;
  sentAt: string;
  sentBy: string;
  message: string;
}

// --- Team Completion ---
export interface TeamCompletionMetrics {
  completionPercent: number;
  teamLearningHours: number;
  passPercentage: number;
  overdueEmployees: number;
}

export interface CompletionTrendData {
  period: string;
  completed: number;
  inProgress: number;
  overdue: number;
  notStarted: number;
}

// --- Course Compliance ---
export type ComplianceTab = 'Completed' | 'Not Completed' | 'In Progress' | 'Overdue';

export interface ComplianceMetrics {
  compliancePercent: number;
  pendingPercent: number;
  averageScore: number;
  dueDates: string[];
}

export interface ComplianceRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  courseName: string;
  status: ComplianceTab;
  score: number;
  dueDate: string;
  completedDate?: string;
}

// --- Review Courses ---
export type ReviewStatus = 'Submitted' | 'On Review' | 'Need Changes' | 'Ready To Publish';
export type ReviewPriority = 'Low' | 'Medium' | 'High';

export interface CourseReview {
  id: string;
  courseId: string;
  courseName: string;
  authorName: string;
  submittedDate: string;
  status: ReviewStatus;
  metadata: boolean;
  modules: number;
  sessions: number;
  videos: number;
  pdfs: number;
  ppts: number;
  passingScore: number;
  feedback?: ReviewFeedback;
}

export interface ReviewFeedback {
  changeTitle: string;
  comments: string;
  priority: ReviewPriority;
  sendVia: NudgeChannel;
}

// --- Reports ---
export type ReportFrequency = 'Daily' | 'Weekly' | 'Monthly';
export type ReportType = 'Compliance Report' | 'Team Report' | 'Employee Report' | 'Course Report';
export type ExportFormat = 'PDF' | 'CSV' | 'Excel';

export interface ScheduledReport {
  id: string;
  name: string;
  type: ReportType;
  frequency: ReportFrequency;
  format: ExportFormat;
  delivery: 'Email' | 'Download';
  lastGenerated?: string;
  nextScheduled?: string;
  createdAt: string;
}

// --- Trend Progress ---
export type TrendPeriod = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface TrendDataPoint {
  period: string;
  learningHours: number;
  coursesCompleted: number;
  averageScores: number;
  complianceTrend: number;
}

// --- Groups ---
export interface LearningGroup {
  id: string;
  name: string;
  description: string;
  department: string;
  managerName: string;
  createdDate: string;
  courses: GroupCourse[];
  employees: string[];
  status: 'Active' | 'Archived';
}

export interface GroupCourse {
  courseId: string;
  courseName: string;
  category: string;
  type: 'Mandatory' | 'Elective';
  dueDate: string;
  passingScore: number;
}

export interface GroupAnalytics {
  totalEmployees: number;
  completedEmployees: number;
  nonCompletedEmployees: number;
  inProgressEmployees: number;
  overdueEmployees: number;
  averageQuizScore: number;
  completionPercent: number;
  passPercent: number;
  failurePercent: number;
  compliancePercent: number;
  learningHours: number;
}

export interface GroupPassingScoreRecord {
  employeeId: string;
  employeeName: string;
  courseName: string;
  quizScore: number;
  requiredPassingScore: number;
  status: 'Passed' | 'Failed' | 'In Progress' | 'Not Attempted';
}

// --- Notifications ---
export type NotificationType = 'Course Reminder' | 'Compliance Alert' | 'Group Update' | 'Review Request';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// --- Settings ---
export interface ManagerSettings {
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  theme: 'dark' | 'light' | 'system';
  reportPreference: 'Daily' | 'Weekly';
  profile: {
    name: string;
    email: string;
    linkedin: string;
  };
}

// --- Audit Logs ---
export type AuditAction =
  | 'Reminder Sent'
  | 'Course Approved'
  | 'Changes Requested'
  | 'Group Created'
  | 'Group Edited'
  | 'Group Archived'
  | 'Group Deleted'
  | 'Employee Added'
  | 'Employee Removed'
  | 'Course Assigned'
  | 'Report Downloaded'
  | 'Report Scheduled'
  | 'Settings Updated'
  | 'Password Changed';

export interface AuditLog {
  id: string;
  action: AuditAction;
  user: string;
  timestamp: string;
  details?: string;
}

// --- Filter Types ---
export type FilterCategory = 'Individual' | 'Team' | 'Department' | 'Group';

export interface FilterState {
  category: FilterCategory;
  search: string;
  department?: string;
  team?: string;
  group?: string;
}

// --- Manager Profile ---
export interface ManagerProfile {
  name: string;
  email: string;
  linkedin: string;
  avatar: string;
  department: string;
  designation: string;
}


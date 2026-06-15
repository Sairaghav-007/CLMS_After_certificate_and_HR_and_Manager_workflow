export type CourseStatus = 
  | 'Draft' 
  | 'Submitted For Review' 
  | 'PENDING_MANAGER_REVIEW'
  | 'On Review' 
  | 'Need Changes' 
  | 'Ready To Publish' 
  | 'Scheduled' 
  | 'Published'
  | 'Unpublished';

export type CourseCategory = 'Mandatory' | 'Elective' | 'Department-Oriented';

export type SessionType = 'Video' | 'PDF' | 'PPT';

export type ChangePriority = 'Low' | 'Medium' | 'High';

export interface LearningObjective {
  id: string;
  text: string;
}

export interface Session {
  id: string;
  title: string;
  description?: string;
  type: SessionType;
  duration: number;
  order: number;
  videoUrl?: string;
  videoDescription?: string;
  learningObjectives?: LearningObjective[];
  pdfUrl?: string;
  pageCount?: number;
  pdfDescription?: string;
  pptUrl?: string;
  slideCount?: number;
  pptDescription?: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  sessions: Session[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  status?: CourseStatus;
  comment?: string;
}

export interface ChangeRequest {
  id: string;
  title: string;
  feedback: string;
  priority: ChangePriority;
  timestamp: string;
  resolved: boolean;
}

export interface CourseVersion {
  id: string;
  version: string;
  publishedAt: string;
  publishedBy: string;
  releaseNotes?: string;
}

export interface Notification {
  id: string;
  courseId: string;
  courseTitle: string;
  message: string;
  type: 'change_request' | 'approved' | 'published' | 'submitted';
  read: boolean;
  timestamp: string;
  linkTo: string;
}

export interface Course {
  id: string;
  parentId?: string;
  version: string;
  versionHistory?: CourseVersion[];
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  category: CourseCategory;
  duration: number;
  thumbnail?: string;
  modules: Module[];
  status: CourseStatus;
  createdBy: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  publishedAt?: string;
  scheduledAt?: string;
  unpublishedAt?: string;
  approvedBy?: string;
  changeRequests: ChangeRequest[];
  auditLogs: AuditLogEntry[];
}


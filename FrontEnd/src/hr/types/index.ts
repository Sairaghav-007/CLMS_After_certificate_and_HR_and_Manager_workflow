// ─── HR Dashboard Types ──────────────────────────────────

export interface HRUser {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  avatar: string;
  role: string;
  joinDate: string;
  linkedinId: string;
}

export interface HRNotification {
  id: string;
  title: string;
  message: string;
  type: 'course_submitted' | 'course_published' | 'clearance_pending' | 'schedule_updated';
  isRead: boolean;
  createdAt: string;
}

export interface KPICard {
  id: string;
  title: string;
  description: string;
  value: number;
  displayValue: string;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label: string;
  };
  icon: string;
  color: 'indigo' | 'amber' | 'blue' | 'emerald' | 'orange' | 'violet';
  highlight?: boolean;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  type: 'review' | 'publish' | 'edit' | 'schedule';
  timestamp: string;
  icon: string;
}

export type PendingActionPriority = 'high' | 'medium' | 'low';

export interface PendingAction {
  id: string;
  title: string;
  description: string;
  count: number;
  priority: PendingActionPriority;
  actionLabel: string;
  actionType: 'review' | 'approve' | 'view';
}

export type ThemeMode = 'light' | 'dark';


import type { HRUser, HRNotification, KPICard, RecentActivity, PendingAction } from '@/hr/types';

// ─── Mock HR User ────────────────────────────────────────

export const mockHRUser: HRUser = {
  id: 'hr-001',
  name: 'Sanjay V',
  email: 'sanjay@company.com',
  employeeId: 'EMP-HR-1001',
  department: 'Human Resources',
  avatar: '',
  role: 'HR Manager',
  joinDate: '2022-03-15',
  linkedinId: 'linkedin.com/in/sanjayv',
};

// ─── Mock Notifications ──────────────────────────────────

export const mockNotifications: HRNotification[] = [
  {
    id: 'notif-1',
    title: 'New Course Submitted',
    message: 'Course "Cyber Security Basics" has been submitted for review by the content team.',
    type: 'course_submitted',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Course Published',
    message: '"Leadership Essentials" has been published successfully and is now available to employees.',
    type: 'course_published',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Clearance Pending',
    message: '3 employee clearance requests are awaiting your approval for the Q2 training cycle.',
    type: 'clearance_pending',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'notif-4',
    title: 'Schedule Updated',
    message: 'Training schedule for "Data Privacy Compliance" has been updated to July 15, 2026.',
    type: 'schedule_updated',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'notif-5',
    title: 'New Course Submitted',
    message: '"Cloud Architecture Fundamentals" submitted for review by the engineering team.',
    type: 'course_submitted',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

// ─── Mock KPI Cards ──────────────────────────────────────

export const mockKPICards: KPICard[] = [
  {
    id: 'kpi-1',
    title: 'Total Courses',
    description: 'Total number of courses created',
    value: 128,
    displayValue: '128',
    trend: { value: 12, direction: 'up', label: 'from last month' },
    icon: 'BookOpen',
    color: 'indigo',
  },
  {
    id: 'kpi-2',
    title: 'Draft Modules',
    description: 'Modules saved but not submitted',
    value: 24,
    displayValue: '24',
    subtitle: 'Drafts',
    icon: 'FileEdit',
    color: 'amber',
  },
  {
    id: 'kpi-3',
    title: 'Under Review',
    description: 'Courses waiting for approval',
    value: 16,
    displayValue: '16',
    subtitle: 'Courses',
    icon: 'ClipboardCheck',
    color: 'blue',
  },
  {
    id: 'kpi-4',
    title: 'Published Courses',
    description: 'Courses visible to employees',
    value: 88,
    displayValue: '88',
    subtitle: 'Published',
    icon: 'BadgeCheck',
    color: 'emerald',
  },
  {
    id: 'kpi-5',
    title: 'Pending Clearances',
    description: 'Outstanding approval requests',
    value: 9,
    displayValue: '9',
    subtitle: 'Pending',
    icon: 'AlertTriangle',
    color: 'orange',
    highlight: true,
  },
  {
    id: 'kpi-6',
    title: 'Schedule Status',
    description: 'Upcoming learning schedules',
    value: 14,
    displayValue: '14',
    subtitle: 'Scheduled',
    trend: { value: 3, direction: 'up', label: 'Starting Today' },
    icon: 'CalendarClock',
    color: 'violet',
  },
];

// ─── Mock Recent Activities ──────────────────────────────

export const mockRecentActivities: RecentActivity[] = [
  {
    id: 'act-1',
    title: 'Course moved to review',
    description: '"Cyber Security Basics" has been submitted for review and is awaiting approval.',
    type: 'review',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    icon: 'ClipboardCheck',
  },
  {
    id: 'act-2',
    title: 'Course published',
    description: '"Leadership Essentials" has been published successfully and is now live.',
    type: 'publish',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
    icon: 'BadgeCheck',
  },
  {
    id: 'act-3',
    title: 'Module edits saved',
    description: 'Draft changes to "Data Privacy Compliance" Module 3 have been saved.',
    type: 'edit',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    icon: 'FileEdit',
  },
  {
    id: 'act-4',
    title: 'Schedule updated',
    description: 'Employee learning schedule for Q3 onboarding has been updated.',
    type: 'schedule',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    icon: 'CalendarClock',
  },
  {
    id: 'act-5',
    title: 'Course moved to review',
    description: '"Cloud Architecture Fundamentals" submitted for review by engineering team.',
    type: 'review',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    icon: 'ClipboardCheck',
  },
  {
    id: 'act-6',
    title: 'Course published',
    description: '"Agile Project Management" is now live and available to all departments.',
    type: 'publish',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    icon: 'BadgeCheck',
  },
  {
    id: 'act-7',
    title: 'Module edits saved',
    description: 'Updated quiz questions for "Financial Compliance 101" Module 5.',
    type: 'edit',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    icon: 'FileEdit',
  },
  {
    id: 'act-8',
    title: 'Schedule updated',
    description: 'New training slots added for "Diversity & Inclusion" workshop series.',
    type: 'schedule',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    icon: 'CalendarClock',
  },
];

// ─── Mock Pending Actions ────────────────────────────────

export const mockPendingActions: PendingAction[] = [
  {
    id: 'pa-1',
    title: 'Courses Awaiting Review',
    description: '9 courses have been submitted and are waiting for your review and approval.',
    count: 9,
    priority: 'high',
    actionLabel: 'Review',
    actionType: 'review',
  },
  {
    id: 'pa-2',
    title: 'Employee Clearances Pending',
    description: '4 employee clearance requests need your approval before proceeding.',
    count: 4,
    priority: 'high',
    actionLabel: 'Approve',
    actionType: 'approve',
  },
  {
    id: 'pa-3',
    title: 'Schedules Require Approval',
    description: '2 training schedules have been modified and require your sign-off.',
    count: 2,
    priority: 'medium',
    actionLabel: 'View Details',
    actionType: 'view',
  },
];


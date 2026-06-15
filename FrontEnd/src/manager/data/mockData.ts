import type {
  Employee, EmployeeCourseProgress, DashboardKPI, NudgeTemplate, NudgeRecord,
  CompletionTrendData, ComplianceRecord, CourseReview, ScheduledReport,
  TrendDataPoint, LearningGroup, GroupPassingScoreRecord, Notification,
  AuditLog, ManagerProfile, ManagerSettings
} from '../types';

// --- Manager Profile ---
export const mockManagerProfile: ManagerProfile = {
  name: 'Sarah Mitchell',
  email: 'sarah.mitchell@corporation.com',
  linkedin: 'linkedin.com/in/sarahmitchell',
  avatar: 'SM',
  department: 'Engineering',
  designation: 'Engineering Manager',
};

// --- Dashboard KPI ---
export const mockDashboardKPI: DashboardKPI = {
  totalTeamMembers: 48,
  assignedCourses: 156,
  completedCourses: 112,
  inProgressCourses: 28,
  overdueEmployees: 6,
  teamCompletionRate: 71.8,
  averageQuizScore: 82.4,
  certificatesEarned: 94,
};

// --- Employees ---
const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'Product', 'HR', 'Finance'];
const teams = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
const groups = ['New Hires 2026', 'Leadership Track', 'Compliance Group', 'Tech Upskill'];
const designations = ['Software Engineer', 'Senior Engineer', 'Designer', 'Product Manager', 'Analyst', 'Lead', 'Specialist'];

const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Mason', 'Mia', 'Ethan', 'Charlotte', 'Alexander', 'Amelia', 'Daniel', 'Harper', 'Matthew', 'Evelyn', 'Aiden', 'Abigail', 'Henry', 'Emily', 'Sebastian', 'Elizabeth', 'Jack', 'Sofia', 'Owen', 'Avery', 'Lucas', 'Ella', 'Ryan', 'Scarlett', 'Nathan', 'Grace', 'Caleb', 'Chloe', 'Dylan', 'Victoria', 'Luke', 'Riley', 'Andrew', 'Aria', 'Isaac', 'Lily', 'Gabriel', 'Aurora'];
const lastNames = ['Anderson', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Gonzalez', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper'];

export const mockEmployees: Employee[] = Array.from({ length: 48 }, (_, i) => {
  const statuses: Employee['status'][] = ['Compliant', 'Non-Compliant', 'At Risk'];
  const assigned = Math.floor(Math.random() * 6) + 2;
  const completed = Math.floor(Math.random() * (assigned + 1));
  const inProgress = Math.floor(Math.random() * (assigned - completed + 1));
  const overdue = assigned - completed - inProgress;
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[i % lastNames.length];
  return {
    id: `EMP-${String(1001 + i).padStart(4, '0')}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@corporation.com`,
    department: departments[i % departments.length],
    designation: designations[i % designations.length],
    joiningDate: `202${Math.floor(Math.random() * 4) + 3}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    team: teams[i % teams.length],
    group: groups[i % groups.length],
    avatar: `${firstName[0]}${lastName[0]}`,
    assignedCourses: assigned,
    completedCourses: completed,
    inProgressCourses: inProgress,
    overdueCourses: overdue,
    averageQuizScore: Math.floor(Math.random() * 40) + 60,
    certificatesEarned: completed,
    learningHours: Math.floor(Math.random() * 80) + 10,
    status: overdue > 1 ? 'Non-Compliant' : overdue === 1 ? 'At Risk' : statuses[Math.floor(Math.random() * 3)],
  };
});

// --- Employee Course Progress ---
const courseNames = [
  'Data Privacy & GDPR Compliance', 'Cybersecurity Fundamentals', 'Leadership Essentials',
  'Agile Project Management', 'Cloud Architecture Basics', 'Diversity & Inclusion Training',
  'Financial Literacy for Teams', 'Advanced React Patterns', 'Machine Learning 101',
  'Effective Communication', 'Time Management Mastery', 'Product Strategy',
];

export const getEmployeeCourses = (employeeId: string): EmployeeCourseProgress[] => {
  const emp = mockEmployees.find(e => e.id === employeeId);
  if (!emp) return [];
  const statuses: EmployeeCourseProgress['status'][] = ['Completed', 'In Progress', 'Not Started', 'Overdue'];
  return Array.from({ length: emp.assignedCourses }, (_, i) => ({
    courseId: `CRS-${String(100 + i).padStart(3, '0')}`,
    courseName: courseNames[i % courseNames.length],
    completionPercent: statuses[i % 4] === 'Completed' ? 100 : statuses[i % 4] === 'In Progress' ? Math.floor(Math.random() * 70) + 10 : 0,
    dueDate: `2026-${String(Math.floor(Math.random() * 6) + 6).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    status: i < emp.completedCourses ? 'Completed' : i < emp.completedCourses + emp.inProgressCourses ? 'In Progress' : i < emp.assignedCourses - emp.overdueCourses ? 'Not Started' : 'Overdue',
    quizScore: i < emp.completedCourses ? Math.floor(Math.random() * 30) + 70 : undefined,
    passingScore: 70,
  }));
};

// --- Nudge Templates ---
export const mockNudgeTemplates: NudgeTemplate[] = [
  { id: 'TPL-001', name: 'Due Reminder', message: 'Your course is due in 3 days. Please complete it before the deadline.', mode: 'Reminder' },
  { id: 'TPL-002', name: 'Compliance Alert', message: 'You have overdue mandatory training. Immediate action is required.', mode: 'Alert' },
  { id: 'TPL-003', name: 'Weekly Progress', message: 'Great progress this week! Keep up the momentum with your learning goals.', mode: 'Reminder' },
  { id: 'TPL-004', name: 'Certificate Available', message: 'Congratulations! Your certificate is ready for download.', mode: 'Reminder' },
  { id: 'TPL-005', name: 'Final Warning', message: 'This is a final reminder for your overdue courses. Please complete ASAP.', mode: 'Alert' },
];

export const mockNudgeHistory: NudgeRecord[] = Array.from({ length: 15 }, (_, i) => ({
  id: `NDG-${String(1000 + i).padStart(4, '0')}`,
  employeeIds: [mockEmployees[i % mockEmployees.length].id],
  templateId: mockNudgeTemplates[i % mockNudgeTemplates.length].id,
  channel: i % 2 === 0 ? 'Email' : 'In-App Notification',
  mode: i % 3 === 0 ? 'Alert' : 'Reminder',
  sentAt: `2026-06-${String(Math.max(1, 13 - i)).padStart(2, '0')}T${String(9 + (i % 8)).padStart(2, '0')}:${String(i * 4 % 60).padStart(2, '0')}:00Z`,
  sentBy: 'Sarah Mitchell',
  message: mockNudgeTemplates[i % mockNudgeTemplates.length].message,
}));

// --- Completion Trends ---
export const mockCompletionTrends: CompletionTrendData[] = [
  { period: 'Week 1', completed: 12, inProgress: 8, overdue: 3, notStarted: 5 },
  { period: 'Week 2', completed: 18, inProgress: 10, overdue: 2, notStarted: 4 },
  { period: 'Week 3', completed: 22, inProgress: 12, overdue: 4, notStarted: 3 },
  { period: 'Week 4', completed: 28, inProgress: 9, overdue: 2, notStarted: 2 },
  { period: 'Week 5', completed: 35, inProgress: 14, overdue: 3, notStarted: 1 },
  { period: 'Week 6', completed: 40, inProgress: 11, overdue: 1, notStarted: 2 },
  { period: 'Week 7', completed: 45, inProgress: 15, overdue: 3, notStarted: 1 },
  { period: 'Week 8', completed: 52, inProgress: 10, overdue: 2, notStarted: 1 },
  { period: 'Week 9', completed: 60, inProgress: 13, overdue: 4, notStarted: 2 },
  { period: 'Week 10', completed: 68, inProgress: 11, overdue: 2, notStarted: 1 },
  { period: 'Week 11', completed: 80, inProgress: 14, overdue: 3, notStarted: 1 },
  { period: 'Week 12', completed: 90, inProgress: 12, overdue: 2, notStarted: 0 },
];

// --- Compliance Records ---
export const mockComplianceRecords: ComplianceRecord[] = mockEmployees.flatMap(emp => {
  const courses = getEmployeeCourses(emp.id);
  return courses.map(c => ({
    employeeId: emp.id,
    employeeName: emp.name,
    department: emp.department,
    courseName: c.courseName,
    status: c.status === 'Not Started' ? 'Not Completed' as const : c.status as ComplianceRecord['status'],
    score: c.quizScore ?? 0,
    dueDate: c.dueDate,
    completedDate: c.status === 'Completed' ? `2026-05-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : undefined,
  }));
});

// --- Course Reviews ---
export const mockCourseReviews: CourseReview[] = [
  { id: 'REV-001', courseId: 'CRS-201', courseName: 'Advanced Cloud Security', authorName: 'Dr. Alan Foster', submittedDate: '2026-06-08', status: 'Submitted', metadata: true, modules: 8, sessions: 24, videos: 16, pdfs: 12, ppts: 8, passingScore: 75 },
  { id: 'REV-002', courseId: 'CRS-202', courseName: 'AI Ethics & Governance', authorName: 'Prof. Karen Liu', submittedDate: '2026-06-06', status: 'On Review', metadata: true, modules: 6, sessions: 18, videos: 12, pdfs: 8, ppts: 6, passingScore: 80 },
  { id: 'REV-003', courseId: 'CRS-203', courseName: 'Data Engineering Pipeline', authorName: 'Mark Johnson', submittedDate: '2026-06-04', status: 'Need Changes', metadata: true, modules: 10, sessions: 30, videos: 20, pdfs: 15, ppts: 10, passingScore: 70, feedback: { changeTitle: 'Update Module 3', comments: 'Module 3 needs updated references and better code examples.', priority: 'High', sendVia: 'Email' } },
  { id: 'REV-004', courseId: 'CRS-204', courseName: 'Leadership 360', authorName: 'Diana Ross', submittedDate: '2026-06-02', status: 'Ready To Publish', metadata: true, modules: 5, sessions: 15, videos: 10, pdfs: 5, ppts: 5, passingScore: 65 },
  { id: 'REV-005', courseId: 'CRS-205', courseName: 'Microservices Architecture', authorName: 'James Chen', submittedDate: '2026-06-10', status: 'Submitted', metadata: true, modules: 12, sessions: 36, videos: 24, pdfs: 18, ppts: 12, passingScore: 75 },
  { id: 'REV-006', courseId: 'CRS-206', courseName: 'UX Research Methods', authorName: 'Elena Vasquez', submittedDate: '2026-06-09', status: 'On Review', metadata: true, modules: 7, sessions: 21, videos: 14, pdfs: 10, ppts: 7, passingScore: 70 },
];

// --- Scheduled Reports ---
export const mockScheduledReports: ScheduledReport[] = [
  { id: 'RPT-001', name: 'Weekly Compliance Summary', type: 'Compliance Report', frequency: 'Weekly', format: 'PDF', delivery: 'Email', lastGenerated: '2026-06-09', nextScheduled: '2026-06-16', createdAt: '2026-01-15' },
  { id: 'RPT-002', name: 'Monthly Team Progress', type: 'Team Report', frequency: 'Monthly', format: 'Excel', delivery: 'Download', lastGenerated: '2026-06-01', nextScheduled: '2026-07-01', createdAt: '2026-02-01' },
  { id: 'RPT-003', name: 'Daily Active Learners', type: 'Employee Report', frequency: 'Daily', format: 'CSV', delivery: 'Email', lastGenerated: '2026-06-13', nextScheduled: '2026-06-14', createdAt: '2026-03-10' },
  { id: 'RPT-004', name: 'Course Effectiveness Report', type: 'Course Report', frequency: 'Monthly', format: 'PDF', delivery: 'Email', lastGenerated: '2026-06-01', nextScheduled: '2026-07-01', createdAt: '2026-04-05' },
];

// --- Trend Progress Data ---
export const mockTrendData: TrendDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
  period: `Week ${i + 1}`,
  learningHours: Math.floor(Math.random() * 100) + 150,
  coursesCompleted: Math.floor(Math.random() * 20) + 5 + i * 2,
  averageScores: Math.floor(Math.random() * 15) + 72,
  complianceTrend: Math.min(100, 60 + i * 3 + Math.floor(Math.random() * 5)),
}));

// --- Groups ---
export const mockGroups: LearningGroup[] = [
  {
    id: 'GRP-2026-0001', name: 'Q2 Compliance Cohort', description: 'Mandatory compliance training for Q2 2026',
    department: 'All', managerName: 'Sarah Mitchell', createdDate: '2026-04-01', status: 'Active',
    courses: [
      { courseId: 'CRS-100', courseName: 'Data Privacy & GDPR', category: 'Compliance', type: 'Mandatory', dueDate: '2026-06-30', passingScore: 80 },
      { courseId: 'CRS-101', courseName: 'Cybersecurity Awareness', category: 'Compliance', type: 'Mandatory', dueDate: '2026-06-30', passingScore: 75 },
    ],
    employees: mockEmployees.slice(0, 20).map(e => e.id),
  },
  {
    id: 'GRP-2026-0002', name: 'Engineering Upskill', description: 'Advanced technical training for engineering team',
    department: 'Engineering', managerName: 'Sarah Mitchell', createdDate: '2026-05-01', status: 'Active',
    courses: [
      { courseId: 'CRS-102', courseName: 'Advanced React Patterns', category: 'Technical', type: 'Elective', dueDate: '2026-07-31', passingScore: 70 },
      { courseId: 'CRS-103', courseName: 'Cloud Architecture', category: 'Technical', type: 'Elective', dueDate: '2026-07-31', passingScore: 70 },
      { courseId: 'CRS-104', courseName: 'System Design', category: 'Technical', type: 'Mandatory', dueDate: '2026-07-31', passingScore: 75 },
    ],
    employees: mockEmployees.filter(e => e.department === 'Engineering').map(e => e.id),
  },
  {
    id: 'GRP-2026-0003', name: 'Leadership Development', description: 'Leadership skills for potential managers',
    department: 'All', managerName: 'Sarah Mitchell', createdDate: '2026-03-15', status: 'Active',
    courses: [
      { courseId: 'CRS-105', courseName: 'Leadership Essentials', category: 'Leadership', type: 'Mandatory', dueDate: '2026-08-31', passingScore: 70 },
    ],
    employees: mockEmployees.slice(5, 15).map(e => e.id),
  },
  {
    id: 'GRP-2026-0004', name: 'Archived Training 2025', description: 'Previous year compliance training',
    department: 'All', managerName: 'Sarah Mitchell', createdDate: '2025-01-01', status: 'Archived',
    courses: [],
    employees: [],
  },
];

// --- Group Passing Scores ---
export const getGroupPassingScores = (groupId: string): GroupPassingScoreRecord[] => {
  const group = mockGroups.find(g => g.id === groupId);
  if (!group) return [];
  return group.employees.flatMap(empId => {
    const emp = mockEmployees.find(e => e.id === empId);
    if (!emp) return [];
    return group.courses.map(course => {
      const statuses: GroupPassingScoreRecord['status'][] = ['Passed', 'Failed', 'In Progress', 'Not Attempted'];
      const statusIdx = Math.floor(Math.random() * 4);
      const score = statusIdx === 0 ? course.passingScore + Math.floor(Math.random() * 25) : statusIdx === 1 ? Math.floor(Math.random() * course.passingScore) : 0;
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        courseName: course.courseName,
        quizScore: score,
        requiredPassingScore: course.passingScore,
        status: statuses[statusIdx],
      };
    });
  });
};

// --- Notifications ---
export const mockNotifications: Notification[] = [
  { id: 'NTF-001', type: 'Compliance Alert', title: 'Overdue Training Alert', message: '3 employees have overdue GDPR compliance training.', timestamp: '2026-06-13T10:30:00Z', read: false, actionUrl: '/manager/course-compliance' },
  { id: 'NTF-002', type: 'Review Request', title: 'Course Awaiting Review', message: 'Advanced Cloud Security has been submitted for review.', timestamp: '2026-06-13T09:15:00Z', read: false, actionUrl: '/manager/review-courses' },
  { id: 'NTF-003', type: 'Group Update', title: 'New Employees Added', message: '5 new employees were added to Q2 Compliance Cohort.', timestamp: '2026-06-12T16:45:00Z', read: false, actionUrl: '/manager/groups' },
  { id: 'NTF-004', type: 'Course Reminder', title: 'Deadline Approaching', message: 'Cybersecurity Fundamentals deadline is in 3 days.', timestamp: '2026-06-12T14:20:00Z', read: true, actionUrl: '/manager/nudge-employees' },
  { id: 'NTF-005', type: 'Compliance Alert', title: 'Compliance Rate Dropped', message: 'Team compliance rate dropped below 70%. Review required.', timestamp: '2026-06-11T11:00:00Z', read: true, actionUrl: '/manager/course-compliance' },
  { id: 'NTF-006', type: 'Review Request', title: 'Course Review Complete', message: 'Data Engineering Pipeline review has been completed.', timestamp: '2026-06-11T09:30:00Z', read: true, actionUrl: '/manager/review-courses' },
  { id: 'NTF-007', type: 'Group Update', title: 'Group Created', message: 'Engineering Upskill group has been created successfully.', timestamp: '2026-06-10T15:00:00Z', read: true, actionUrl: '/manager/groups' },
  { id: 'NTF-008', type: 'Course Reminder', title: 'Weekly Progress Update', message: 'Your team completed 12 courses this week.', timestamp: '2026-06-10T10:00:00Z', read: true, actionUrl: '/manager/trend-progress' },
  { id: 'NTF-009', type: 'Compliance Alert', title: 'New Mandatory Course', message: 'Anti-Harassment Training has been made mandatory.', timestamp: '2026-06-09T13:00:00Z', read: true, actionUrl: '/manager/course-compliance' },
  { id: 'NTF-010', type: 'Review Request', title: 'Feedback Required', message: 'AI Ethics course needs your feedback by end of week.', timestamp: '2026-06-09T09:00:00Z', read: true, actionUrl: '/manager/review-courses' },
];

// --- Audit Logs ---
export const mockAuditLogs: AuditLog[] = [
  { id: 'AUD-001', action: 'Reminder Sent', user: 'Sarah Mitchell', timestamp: '2026-06-13T10:30:00Z', details: 'Sent due reminder to 3 employees' },
  { id: 'AUD-002', action: 'Course Approved', user: 'Sarah Mitchell', timestamp: '2026-06-13T09:00:00Z', details: 'Approved Leadership 360 for publishing' },
  { id: 'AUD-003', action: 'Group Created', user: 'Sarah Mitchell', timestamp: '2026-06-12T16:00:00Z', details: 'Created Engineering Upskill group' },
  { id: 'AUD-004', action: 'Employee Added', user: 'Sarah Mitchell', timestamp: '2026-06-12T15:30:00Z', details: 'Added 5 employees to Q2 Compliance Cohort' },
  { id: 'AUD-005', action: 'Changes Requested', user: 'Sarah Mitchell', timestamp: '2026-06-12T14:00:00Z', details: 'Requested changes on Data Engineering Pipeline' },
  { id: 'AUD-006', action: 'Report Downloaded', user: 'Sarah Mitchell', timestamp: '2026-06-12T11:00:00Z', details: 'Downloaded Weekly Compliance Summary (PDF)' },
  { id: 'AUD-007', action: 'Course Assigned', user: 'Sarah Mitchell', timestamp: '2026-06-11T16:00:00Z', details: 'Assigned Cloud Architecture to Engineering team' },
  { id: 'AUD-008', action: 'Settings Updated', user: 'Sarah Mitchell', timestamp: '2026-06-11T10:00:00Z', details: 'Updated notification preferences' },
  { id: 'AUD-009', action: 'Reminder Sent', user: 'Sarah Mitchell', timestamp: '2026-06-10T09:00:00Z', details: 'Sent compliance alert to Marketing department' },
  { id: 'AUD-010', action: 'Report Scheduled', user: 'Sarah Mitchell', timestamp: '2026-06-09T14:00:00Z', details: 'Scheduled daily active learners report' },
];

// --- Settings ---
export const mockSettings: ManagerSettings = {
  notifications: { email: true, push: true, inApp: true },
  theme: 'light',
  reportPreference: 'Weekly',
  profile: { name: 'Sarah Mitchell', email: 'sarah.mitchell@corporation.com', linkedin: 'linkedin.com/in/sarahmitchell' },
};


import type { Course } from '@/hr/types/course';

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    version: 'v1.0',
    title: 'Cyber Security Fundamentals',
    description: 'Learn the basics of cyber security, threat detection, and safe browsing practices in a corporate environment.',
    passingScore: 80,
    maxAttempts: 3,
    category: 'Mandatory',
    duration: 5,
    status: 'Draft',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
    createdBy: 'Sanjay Kumar',
    department: 'Product Engineering',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changeRequests: [],
    auditLogs: [],
    modules: [
      {
        id: 'module-1',
        title: 'Introduction to Cyber Security',
        description: 'Overview of the cyber security landscape.',
        order: 1,
        sessions: [
          {
            id: 'session-1',
            title: 'What is Cyber Security?',
            type: 'Video',
            duration: 600,
            order: 1,
            videoDescription: 'Basics of cyber security.',
          },
          {
            id: 'session-2',
            title: 'Common Threats in 2026',
            type: 'PDF',
            duration: 300,
            order: 2,
            pdfDescription: 'A guide to modern threats.',
          }
        ]
      }
    ]
  }
];


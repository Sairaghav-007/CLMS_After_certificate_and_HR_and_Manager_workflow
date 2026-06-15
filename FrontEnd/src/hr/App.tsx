import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/hr/components/Sidebar';
import { Navbar } from '@/hr/components/Navbar';
import Dashboard from '@/hr/pages/Dashboard';
import Placeholder from '@/hr/pages/Placeholder';
import CourseCreation from '@/hr/pages/CourseCreation';
import CourseEditor from '@/hr/pages/CourseEditor';
import ReviewCourses from '@/hr/pages/ReviewCourses';
import ReviewCourseDetail from '@/hr/pages/ReviewCourseDetail';
import PublishedCourses from '@/hr/pages/PublishedCourses';
import AlterCourse from '@/hr/pages/AlterCourse';
import { useUIStore, useThemeStore } from '@/hr/store';
import { useCourseStore } from '@/hr/store/useCourseStore';
import type { Course } from '@/hr/types/course';
import { cn } from '@/hr/lib/utils';
import { useEffect } from 'react';

function App() {
  const { courses, publishCourse, addAuditLog } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Scheduled Publishing Engine
  useEffect(() => {
    const checkScheduled = () => {
      const now = new Date();
      courses.forEach((course: Course) => {
        if (course.status === 'Scheduled' && course.scheduledAt) {
          const scheduledTime = new Date(course.scheduledAt);
          if (now >= scheduledTime) {
            publishCourse(course.id);
            addAuditLog(course.id, 'Automatic Publishing', `Published via scheduler at ${now.toLocaleString()}`);
          }
        }
      });
    };

    const interval = setInterval(checkScheduled, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [courses, publishCourse, addAuditLog]);

  // Apply dark mode class to body for global theme persistence
  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <div className={cn(
      "flex h-screen overflow-hidden transition-colors duration-300",
      isDark ? "bg-surface-950" : "bg-surface-50"
    )}>
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 py-8 lg:px-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/course-creation" element={<CourseCreation />} />
              <Route path="/hr/course-editor/:courseId" element={<CourseEditor />} />
              <Route path="/review-courses" element={<ReviewCourses />} />
              <Route path="/review-courses/:courseId" element={<ReviewCourseDetail />} />
              <Route path="/published-courses" element={<PublishedCourses />} />
              <Route path="/alter-courses" element={<AlterCourse />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;


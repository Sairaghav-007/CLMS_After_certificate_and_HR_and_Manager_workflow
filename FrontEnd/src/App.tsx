import { useEffect } from "react";
import { useAuthStore } from "./store/AuthStore";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./pages/LoginPage";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { EmployeeCoursesPage } from "./pages/EmployeeCoursePage";
import { CoursePreviewPage } from "./pages/CoursePreviewPage";
import { LearningPlayerPage } from "./pages/LearningPlayerPage";
import { AssessmentPage } from "./pages/AssessmentPage";
import { CertificatesPage } from "./pages/CertificatesPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppLayout } from "./shared/components/Layout";

// Admin Page
import { AdminPage } from "./admin/pages/AdminPage";

// HR Pages
import HRDashboard from "./hr/pages/Dashboard";
import CourseCreation from "./hr/pages/CourseCreation";
import CourseEditor from "./hr/pages/CourseEditor";
import HRReviewCourses from "./hr/pages/ReviewCourses";
import ReviewCourseDetail from "./hr/pages/ReviewCourseDetail";
import PublishedCourses from "./hr/pages/PublishedCourses";
import AlterCourse from "./hr/pages/AlterCourse";

// Manager Pages
import ManagerDashboard from "./manager/pages/DashboardPage";
import DirectReportsPage from "./manager/pages/DirectReportsPage";
import NudgeEmployeesPage from "./manager/pages/NudgeEmployeesPage";
import TeamCompletionPage from "./manager/pages/TeamCompletionPage";
import CourseCompliancePage from "./manager/pages/CourseCompliancePage";
import ReviewCoursesPage from "./manager/pages/ReviewCoursesPage";
import ManagerCourseReviewPage from "./manager/pages/ManagerCourseReviewPage";
import ReportsPage from "./manager/pages/ReportsPage";
import TrendProgressPage from "./manager/pages/TrendProgressPage";
import GroupsPage from "./manager/pages/GroupsPage";
import NotificationsPage from "./manager/pages/NotificationsPage";
import SettingsPage from "./manager/pages/SettingsPage";

const queryClient = new QueryClient();

function DashboardRedirect() {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  switch (user.role) {
    case "ADMIN":
      return <Navigate to="/admin" replace />;
    case "HR":
      return <Navigate to="/hr" replace />;
    case "MANAGER":
      return <Navigate to="/manager" replace />;
    case "EMPLOYEE":
    default:
      return <Navigate to="/employee" replace />;
  }
}

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Employee Dashboard & Catalog routes inside layout wrapper */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route path="/employee/courses" element={<EmployeeCoursesPage />} />
            <Route path="/employee/courses/:courseId" element={<CoursePreviewPage />} />
            <Route path="/employee/certificates" element={<CertificatesPage />} />
          </Route>

          {/* Immersive Standalone Learning Classroom viewports */}
          <Route
            path="/employee/courses/:courseId/learn/:moduleId/:resourceId"
            element={
              <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                <LearningPlayerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/courses/:courseId/assessment"
            element={
              <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                <AssessmentPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* HR Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["HR"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/hr/course-creation" element={<CourseCreation />} />
            <Route path="/hr/course-editor/:courseId" element={<CourseEditor />} />
            <Route path="/hr/review-courses" element={<HRReviewCourses />} />
            <Route path="/hr/review-courses/:courseId" element={<ReviewCourseDetail />} />
            <Route path="/hr/published-courses" element={<PublishedCourses />} />
            <Route path="/hr/alter-courses" element={<AlterCourse />} />
          </Route>

          {/* Manager Routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["MANAGER"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/direct-reports" element={<DirectReportsPage />} />
            <Route path="/manager/nudge-employees" element={<NudgeEmployeesPage />} />
            <Route path="/manager/team-completion" element={<TeamCompletionPage />} />
            <Route path="/manager/course-compliance" element={<CourseCompliancePage />} />
            <Route path="/manager/review-courses" element={<ReviewCoursesPage />} />
            <Route path="/manager/reports" element={<ReportsPage />} />
            <Route path="/manager/trend-progress" element={<TrendProgressPage />} />
            <Route path="/manager/groups" element={<GroupsPage />} />
            <Route path="/manager/notifications" element={<NotificationsPage />} />
            <Route path="/manager/settings" element={<SettingsPage />} />
          </Route>

          {/* Standalone Manager Course Review — full viewport, no sidebar */}
          <Route
            path="/manager/review-courses/:courseId"
            element={
              <ProtectedRoute allowedRoles={["MANAGER"]}>
                <ManagerCourseReviewPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
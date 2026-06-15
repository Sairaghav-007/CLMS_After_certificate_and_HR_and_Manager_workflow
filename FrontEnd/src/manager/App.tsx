import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';

// Pages
import DashboardPage from './pages/DashboardPage';
import DirectReportsPage from './pages/DirectReportsPage';
import NudgeEmployeesPage from './pages/NudgeEmployeesPage';
import TeamCompletionPage from './pages/TeamCompletionPage';
import CourseCompliancePage from './pages/CourseCompliancePage';
import ReviewCoursesPage from './pages/ReviewCoursesPage';
import ReportsPage from './pages/ReportsPage';
import TrendProgressPage from './pages/TrendProgressPage';
import GroupsPage from './pages/GroupsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="/manager" element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="direct-reports" element={<DirectReportsPage />} />
            <Route path="nudge-employees" element={<NudgeEmployeesPage />} />
            <Route path="team-completion" element={<TeamCompletionPage />} />
            <Route path="course-compliance" element={<CourseCompliancePage />} />
            <Route path="review-courses" element={<ReviewCoursesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="trend-progress" element={<TrendProgressPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}


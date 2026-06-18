import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Bell, BellRing, CheckCircle2, ShieldCheck,
  BookOpen, BarChart3, TrendingUp, FolderKanban, Settings, ChevronLeft,
  ChevronRight, Sparkles
} from 'lucide-react';
import { useSidebarStore } from '../stores';

const menuItems = [
  { path: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/manager/direct-reports', label: 'Direct Reports', icon: Users },
  { path: '/manager/nudge-employees', label: 'Nudge Employees', icon: BellRing },
  { path: '/manager/team-completion', label: 'Team Completion', icon: CheckCircle2 },
  { path: '/manager/course-compliance', label: 'Course Compliance', icon: ShieldCheck },
  { path: '/manager/review-courses', label: 'Review Courses', icon: BookOpen },
  { path: '/manager/reports', label: 'Reports', icon: BarChart3 },
  { path: '/manager/trend-progress', label: 'Trend Progress', icon: TrendingUp },
  { path: '/manager/groups', label: 'Groups', icon: FolderKanban },
  { path: '/manager/notifications', label: 'Notifications', icon: Bell },
  { path: '/manager/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { collapsed, toggle } = useSidebarStore();
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: collapsed ? 88 : 280,
        x: 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-surface-200 m-4 rounded-[20px] shadow-sm"
    >
      {/* Logo */}
      <div className="flex items-center h-20 px-6 border-b border-surface-200">
        <motion.div
          className="flex items-center gap-3 overflow-hidden"
          animate={{ opacity: 1 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-accent-600 border border-primary-700/20 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-base font-bold text-surface-900 tracking-tight">
                  Manager Hub
                </h1>
                <p className="text-[10px] text-surface-500 font-bold uppercase tracking-wider -mt-0.5">
                  LMS Operations
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4, backgroundColor: isActive ? '' : 'rgba(0,0,0,0.02)' }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border border-primary-700 shadow-sm font-bold'
                    : 'text-surface-500 hover:text-surface-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-glow"
                    className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-primary-500 shadow-[0_0_12px_rgba(var(--color-primary-500),0.8)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-primary-700' : 'group-hover:text-primary-600'
                }`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-semibold whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-surface-200">
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.02)' }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[14px] text-surface-500 hover:text-surface-900 transition-all duration-200"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-bold uppercase tracking-wider"
              >
                Collapse Side
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}


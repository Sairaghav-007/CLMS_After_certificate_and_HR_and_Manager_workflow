import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sun, Moon, Bell, ChevronRight, Home,
  User, Mail, Link2 as Linkedin, LogOut, ExternalLink, X
} from 'lucide-react';
import { useThemeStore, useNotificationStore } from '../stores';
import { mockManagerProfile } from '../data/mockData';

const routeLabels: Record<string, string> = {
  '/manager/dashboard': 'Dashboard',
  '/manager/direct-reports': 'Direct Reports',
  '/manager/nudge-employees': 'Nudge Employees',
  '/manager/team-completion': 'Team Completion',
  '/manager/course-compliance': 'Course Compliance',
  '/manager/review-courses': 'Review Courses',
  '/manager/reports': 'Reports',
  '/manager/trend-progress': 'Trend Progress',
  '/manager/groups': 'Groups',
  '/manager/notifications': 'Notifications',
  '/manager/settings': 'Settings',
};

export default function Navbar() {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useThemeStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentLabel = routeLabels[location.pathname] || 'Dashboard';

  useEffect(() => {
    fetchNotifications().catch((err) => console.warn(err));
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  return (
    <header
      className="sticky top-0 z-30 pt-4 px-4 pointer-events-none"
    >
      <div 
        className="glass border border-surface-200/60 dark:border-surface-700/40 h-20 rounded-[20px] shadow-xl shadow-surface-900/5 dark:shadow-black/20 px-6 flex items-center justify-between pointer-events-auto"
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/manager/dashboard"
            className="flex items-center gap-2 text-surface-500 hover:text-primary-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider text-[10px] text-surface-500">Portal</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-surface-400" />
          <span className="font-bold text-surface-900 text-base tracking-tight">{currentLabel}</span>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Global Search..."
                  className="w-full h-11 pl-11 pr-8 rounded-[14px] bg-surface-100 border border-surface-200 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all font-medium"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {!searchOpen && (
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.02)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-[14px] flex items-center justify-center text-surface-500 hover:text-surface-900 transition-all"
            >
              <Search className="w-[20px] h-[20px]" />
            </motion.button>
          )}

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.02)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 rounded-[14px] flex items-center justify-center text-surface-500 hover:text-surface-900 transition-all"
          >
            <AnimatePresence mode="wait">
              {resolvedTheme === 'dark' ? (
                <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                  <Sun className="w-[20px] h-[20px]" />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                  <Moon className="w-[20px] h-[20px]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notifications */}
          <Link to="/manager/notifications">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.02)' }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 rounded-[14px] flex items-center justify-center text-surface-500 hover:text-surface-900 transition-all"
            >
              <Bell className="w-[20px] h-[20px]" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-danger-500 text-[10px] font-bold text-white flex items-center justify-center shadow-lg border-2 border-white"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>
          </Link>

          <div className="h-8 w-px bg-surface-200 mx-1" />

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 pl-2 pr-2 py-1.5 rounded-[14px] hover:bg-surface-100 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-700 to-accent-600 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                {mockManagerProfile.avatar}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-bold text-surface-900 leading-tight">
                  {mockManagerProfile.name}
                </p>
                <p className="text-[10px] text-surface-500 font-bold uppercase tracking-wider">
                  Admin
                </p>
              </div>
            </motion.button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-3 w-80 glass rounded-[24px] shadow-2xl shadow-surface-900/10 dark:shadow-black/40 overflow-hidden"
                >
                  {/* Profile Header */}
                  <div className="p-6 gradient-primary">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold text-white border border-white/30">
                        {mockManagerProfile.avatar}
                      </div>
                      <div>
                        <p className="text-base font-bold text-white">{mockManagerProfile.name}</p>
                        <p className="text-xs text-white/80 font-medium uppercase tracking-wider">{mockManagerProfile.designation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Items */}
                  <div className="p-3">
                    <div className="px-4 py-3 flex items-center gap-3 text-surface-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{mockManagerProfile.email}</span>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-3 text-surface-600">
                      <Linkedin className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{mockManagerProfile.linkedin}</span>
                    </div>
                    <div className="h-px bg-surface-200 my-2" />
                    <Link
                      to="/manager/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-[14px] text-surface-600 hover:bg-surface-100 transition-all group"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-bold">Profile Settings</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-danger-500 hover:bg-danger-50 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-bold">Sign Out Hub</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}


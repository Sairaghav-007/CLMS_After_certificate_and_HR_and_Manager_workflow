import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  ShieldCheck,
  Sparkles,
  Plus,
  Settings,
  Users,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  FolderKanban,
  Link2 as Linkedin,
  Loader2,
  Map
} from 'lucide-react';
import { useAuthStore, useUIStore, useNotificationStore } from '@/shared/store';
import { ToastContainer } from './Toast';
import { onForegroundMessage, initWebPush } from '../../firebase';
import { cn, formatDate } from '@/shared/utils';
import { api } from '../../api/client';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { sidebarOpen, setSidebarOpen, toggleSidebar, addToast } = useUIStore();
  const { notifications, fetchNotifications, markRead, markAllRead, unreadCount } = useNotificationStore();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const updateUser = useAuthStore((state) => state.updateUser);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editLinkedIn, setEditLinkedIn] = useState(user?.linkedinUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.fullName || '');
      setEditLinkedIn(user.linkedinUrl || '');
    }
  }, [user]);

  useEffect(() => {
    if (user && accessToken) {
      initWebPush().then((fcmToken) => {
        if (fcmToken) {
          api.post("/auth/fcm-token", { fcmToken })
            .catch((err) => console.warn("[FCM] Failed to register token on layout mount:", err));
        }
      }).catch((err) => console.warn("[FCM] initWebPush error on layout mount:", err));
    }
  }, [user, accessToken]);

  const toastedNotificationsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Reset first load and toasted set when user changes
  useEffect(() => {
    toastedNotificationsRef.current.clear();
    isFirstLoadRef.current = true;
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications().catch((err) => console.warn('[Layout] Failed to fetch notifications:', err));
    }
  }, [user, fetchNotifications]);

  // Poll notifications every 15 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchNotifications().catch((err) => console.warn('[Layout] Failed to fetch notifications in poll:', err));
    }, 15000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Toast trigger on notifications updates
  useEffect(() => {
    if (!user || notifications.length === 0) return;

    if (isFirstLoadRef.current) {
      // On first load, record existing notification IDs to avoid triggering toasts for past notifications
      notifications.forEach((notif) => {
        toastedNotificationsRef.current.add(String(notif.id));
      });
      isFirstLoadRef.current = false;
      return;
    }

    // Trigger toast for new unread notifications
    notifications.forEach((notif) => {
      const idStr = String(notif.id);
      if (!notif.isRead && !toastedNotificationsRef.current.has(idStr)) {
        toastedNotificationsRef.current.add(idStr);
        addToast({
          type: 'info',
          title: notif.title || 'New Notification',
          message: notif.message || '',
        });
      }
    });
  }, [notifications, user, addToast]);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[Layout] Foreground message received:', payload);
      if (payload.notification) {
        addToast({
          type: 'info',
          title: payload.notification.title || 'New Notification',
          message: payload.notification.body || '',
        });
      }
      fetchNotifications().catch((err) => console.warn('[Layout] Failed to refresh notifications:', err));
    });

    return () => {
      unsubscribe();
    };
  }, [addToast, fetchNotifications]);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
        ];
      case 'HR':
        return [
          { path: '/hr', label: 'HR Dashboard', icon: LayoutDashboard },
          { path: '/hr/course-creation', label: 'Course Creation', icon: Plus },
          { path: '/hr/review-courses', label: 'Review Courses', icon: BookOpen },
          { path: '/hr/published-courses', label: 'Published Courses', icon: CheckCircle2 },
          { path: '/hr/alter-courses', label: 'Alter Courses', icon: Settings },
        ];
      case 'MANAGER':
        return [
          { path: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/manager/direct-reports', label: 'Direct Reports', icon: Users },
          { path: '/manager/nudge-employees', label: 'Nudge Employees', icon: Bell },
          { path: '/manager/team-completion', label: 'Team Completion', icon: CheckCircle2 },
          { path: '/manager/course-compliance', label: 'Course Compliance', icon: ShieldCheck },
          { path: '/manager/review-courses', label: 'Review Courses', icon: BookOpen },
          { path: '/manager/reports', label: 'Reports', icon: BarChart3 },
          { path: '/manager/trend-progress', label: 'Trend Progress', icon: TrendingUp },
          { path: '/manager/groups', label: 'Groups', icon: FolderKanban },
        ];
      case 'EMPLOYEE':
      default:
        return [
          { path: '/employee', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/employee/courses', label: 'Course Library', icon: BookOpen },
          { path: '/employee/learning-paths', label: 'Learning Paths', icon: Map },
          { path: '/employee/certificates', label: 'Certificates', icon: Award },
        ];
    }
  };

  const navLinks = getNavLinks();

  const countUnread = unreadCount();

  return (
    <div className="h-screen bg-surface-50 flex overflow-hidden font-sans">
      {/* Toast Notifications container */}
      <ToastContainer />

      {/* Sidebar for Desktop */}
      <aside className={cn(
        "hidden lg:flex flex-col w-64 bg-white border-r border-surface-200 flex-shrink-0 transition-all duration-300 relative z-20",
        !sidebarOpen && "w-20"
      )}>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-surface-200 gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-700 to-accent-600 flex items-center justify-center shadow-lg shadow-primary-700/15 flex-shrink-0">
            <Sparkles size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-bold text-sm tracking-wide uppercase text-surface-800"
            >
              Enterprise LMS
            </motion.span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/employee' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all group relative",
                  isActive
                    ? "bg-primary-50 text-primary-700 border-l-4 border-primary-700 shadow-sm"
                    : "text-surface-600 hover:text-surface-900 hover:bg-surface-50"
                )}
              >
                <Icon size={18} className={cn("flex-shrink-0 transition-colors", isActive ? "text-primary-700" : "text-surface-400 group-hover:text-surface-700")} />
                {sidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {link.label}
                  </motion.span>
                )}
                {/* Active side indicator */}
                {isActive && !sidebarOpen && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-700 rounded-l-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer with session */}
        <div className="p-4 border-t border-surface-200">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-danger-500 hover:text-danger-600 hover:bg-danger-50 transition-all cursor-pointer",
              !sidebarOpen && "justify-center px-0"
            )}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-72 bg-white flex flex-col h-full z-50 p-5"
            >
              <div className="flex items-center justify-between pb-6 border-b border-surface-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-700 to-accent-600 flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-sm tracking-wide uppercase text-surface-800">Enterprise LMS</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-700"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 py-6 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path || (link.path !== '/employee' && location.pathname.startsWith(link.path));
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
                        isActive
                          ? "bg-primary-50 text-primary-700 border-l-4 border-primary-700"
                          : "text-surface-600 hover:text-surface-900 hover:bg-surface-50"
                      )}
                    >
                      <Icon size={18} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-6 border-t border-surface-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-danger-500 hover:text-danger-600 hover:bg-danger-50 transition-all cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-surface-200/80 flex items-center justify-between px-4 sm:px-8 relative z-30 select-none">
          {/* Left: Mobile Toggle & Welcome text */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setSidebarOpen(true);
                } else {
                  toggleSidebar();
                }
              }}
              className="p-2 rounded-xl text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block text-left">
              <h2 className="text-xs font-bold text-surface-800 leading-tight">Welcome, {user?.fullName || 'User'}</h2>
              <p className="text-[10px] text-surface-450 font-semibold uppercase tracking-wider mt-0.5">Dashboard</p>
            </div>
          </div>

          {/* Right: Notifications, Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-4">


            {/* Notifications Widget */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={cn(
                  "p-2 rounded-xl text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-all cursor-pointer relative",
                  notifOpen && "bg-surface-100 text-surface-900"
                )}
              >
                <Bell size={20} />
                {countUnread > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger-500 border border-white"></span>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border border-surface-200 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                  >
                    <div className="p-4 border-b border-surface-100 flex items-center justify-between bg-surface-50/50">
                      <span className="text-xs font-black uppercase tracking-wider text-surface-800">Notifications ({countUnread})</span>
                      {countUnread > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] text-primary-600 hover:text-primary-700 font-black uppercase tracking-wider cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-surface-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-surface-400">
                          <Bell className="w-8 h-8 mx-auto opacity-20 mb-2" />
                          <p className="text-xs font-semibold">All caught up!</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markRead(notif.id);
                              if (notif.courseId) navigate(`/employee/courses/${notif.courseId}`);
                              setNotifOpen(false);
                            }}
                            className={cn(
                              "p-4 transition-colors hover:bg-surface-50/60 cursor-pointer flex gap-3 relative",
                              !notif.isRead && "bg-primary-50/20"
                            )}
                          >
                            {!notif.isRead && (
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full absolute top-5 right-4" />
                            )}
                            <div className="flex-1 pr-3">
                              <p className="text-xs font-bold text-surface-800 leading-tight mb-1">{notif.title}</p>
                              <p className="text-[11px] text-surface-500 leading-relaxed font-semibold">{notif.message}</p>
                              <p className="text-[9px] text-surface-400 mt-1.5 font-bold uppercase tracking-wider">{formatDate(notif.createdAt)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-surface-200" />

            {/* Profile Dropdown Widget */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-100 transition-all cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-primary-500/10">
                  {user?.fullName?.charAt(0) || 'E'}
                </div>
                <div className="hidden sm:block max-w-[100px]">
                  <p className="text-xs font-bold text-surface-800 truncate leading-none mb-0.5">{user?.fullName || 'Employee'}</p>
                  <p className="text-[9px] text-surface-400 font-semibold truncate leading-none">Internal user</p>
                </div>
                <ChevronDown size={14} className="text-surface-400 hidden sm:block" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2.5 w-64 bg-white border border-surface-200 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                  >
                    {/* Profile Summary info */}
                    <div className="p-4 border-b border-surface-100 bg-surface-50/50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center font-black text-sm">
                        {user?.fullName?.charAt(0) || 'E'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-surface-900 leading-tight truncate">{user?.fullName || 'Employee'}</p>
                        <p className="text-[10px] text-surface-450 font-semibold truncate mt-0.5">{user?.email || 'employee@company.com'}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-0.5">
                      <div className="px-3.5 py-2 text-[10px] text-surface-450 font-bold uppercase tracking-wider">Session Info</div>
                      <button
                        onClick={() => {
                          setEditName(user?.fullName || '');
                          setEditLinkedIn(user?.linkedinUrl || '');
                          setDrawerOpen(true);
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-surface-700 hover:bg-surface-50 transition-colors text-left cursor-pointer"
                      >
                        <User size={16} className="text-primary-500" />
                        <span>Edit Profile</span>
                      </button>
                      <div className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-surface-600">
                        <ShieldCheck size={16} className="text-success-500" />
                        <span>Corporate Account</span>
                      </div>
                    </div>

                    <div className="p-2 border-t border-surface-100 bg-surface-50/30">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-danger-600 hover:bg-danger-50 transition-colors cursor-pointer"
                      >
                        <LogOut size={16} />
                        <span>Sign Out Session</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Screen Content */}
        <main className="flex-1 overflow-y-auto bg-surface-50/60 relative">
          <Outlet />
        </main>
      </div>

      {/* Profile Edit Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white shadow-2xl h-full z-50 p-6 flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-surface-200">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary-600" />
                    <span className="font-bold text-base text-surface-900">Edit Profile Details</span>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-705 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="py-6 space-y-5">
                  {/* Name field */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-surface-500 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-surface-400"
                      placeholder="Your Full Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email field (Read-only) */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-surface-400 mb-1.5">
                      Email Address (Read-only)
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-surface-200 bg-surface-100 px-4 py-3 text-sm font-semibold outline-none text-surface-500 cursor-not-allowed"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>

                  {/* LinkedIn URL field */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-surface-500 mb-1.5">
                      LinkedIn URL
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-surface-400">
                        <Linkedin size={16} />
                      </div>
                      <input
                        type="url"
                        className="w-full rounded-xl border border-surface-200 bg-surface-50 pl-11 pr-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-surface-400"
                        placeholder="https://linkedin.com/in/username"
                        value={editLinkedIn}
                        onChange={(e) => setEditLinkedIn(e.target.value)}
                      />
                    </div>
                  </div>

                  {profileMsg && (
                    <div className={cn(
                      "rounded-xl px-4 py-3 text-xs font-semibold animate-slide-up",
                      profileMsg.includes('successfully') 
                        ? "border border-success-200 bg-success-50 text-success-700"
                        : "border border-danger-200 bg-danger-50 text-danger-700"
                    )}>
                      {profileMsg}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-surface-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-3 border border-surface-250 hover:border-surface-350 text-surface-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center animate-pulse-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!editName.trim()) {
                      setProfileMsg('Full Name is required.');
                      return;
                    }
                    setIsSaving(true);
                    setProfileMsg('');
                    try {
                      const res = await api.put('/auth/profile', {
                        fullName: editName,
                        linkedinUrl: editLinkedIn
                      });
                      updateUser({
                        fullName: res.data.fullName,
                        linkedinUrl: res.data.linkedinUrl
                      });
                      setProfileMsg('Profile updated successfully!');
                      setTimeout(() => {
                        setDrawerOpen(false);
                        setProfileMsg('');
                      }, 1200);
                    } catch (err) {
                      console.error(err);
                      setProfileMsg('Failed to update profile details.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-primary-500/10"
                >
                  {isSaving && <Loader2 className="animate-spin" size={14} />}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

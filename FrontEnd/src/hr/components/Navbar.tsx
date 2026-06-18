import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Menu,
  Sun,
  Moon,
  ChevronRight,
  Home,
  User,
  Settings,
  LogOut,
  Link as LinkIcon,
  Check,
  Eye,
  MessageSquare,
  ClipboardList,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { cn } from '@/hr/lib/utils';
import { useUIStore, useThemeStore, useUserStore } from '@/hr/store';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { setSidebarOpen } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useUserStore();
  const { notifications, markNotificationRead } = useCourseStore();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = (notif: any) => {
    markNotificationRead(notif.id);
    setShowNotifications(false);
    navigate(notif.linkTo);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'change_request': return <MessageSquare className="w-4 h-4 text-danger-500" />;
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-success-500" />;
      case 'submitted': return <ClipboardList className="w-4 h-4 text-primary-500" />;
      case 'published': return <Send className="w-4 h-4 text-primary-500" />;
      default: return <Bell className="w-4 h-4 text-surface-400" />;
    }
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'SV';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-8 h-[72px]',
        'backdrop-blur-xl border-b shadow-sm flex-shrink-0 transition-colors duration-300',
        isDark ? 'bg-surface-900/80 border-surface-700/50' : 'bg-white/80 border-surface-200'
      )}
    >
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-surface-500">
        <Menu className="w-5 h-5" />
      </button>

      <nav className="flex items-center gap-1.5 text-sm">
        <button className="flex items-center gap-1.5 text-surface-400 hover:text-primary-500 font-medium">
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-surface-300" />
        <span className={cn('font-semibold', isDark ? 'text-white' : 'text-surface-900')}>HR Dashboard</span>
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className={cn('p-2.5 rounded-xl', isDark ? 'text-amber-400' : 'text-surface-600')}>
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                  'absolute right-0 mt-3 w-80 rounded-2xl border shadow-2xl overflow-hidden',
                  isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-100'
                )}
              >
                <div className="p-4 border-b dark:border-surface-800 flex items-center justify-between">
                   <h4 className="font-bold text-sm">Notifications</h4>
                   <span className="text-[10px] bg-danger-500/10 text-danger-500 px-2 py-0.5 rounded-full font-bold">
                     {unreadCount} New
                   </span>
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                   {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotifClick(n)}
                          className={cn(
                            "p-4 border-b dark:border-surface-800/50 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-all",
                            !n.read && (isDark ? "bg-primary-500/5" : "bg-primary-50/30")
                          )}
                        >
                           <div className="flex gap-3">
                              <div className="mt-1">{getIcon(n.type)}</div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs font-bold truncate">{n.courseTitle}</p>
                                 <p className="text-[11px] text-surface-500 mt-0.5 line-clamp-2">{n.message}</p>
                                 <p className="text-[9px] text-surface-400 mt-1 uppercase font-bold tracking-tighter">
                                   {new Date(n.timestamp).toLocaleTimeString()}
                                 </p>
                              </div>
                              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5" />}
                           </div>
                        </div>
                      ))
                   ) : (
                      <div className="p-10 text-center text-xs text-surface-400 italic">No notifications yet</div>
                   )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-700 to-primary-500 flex items-center justify-center text-white font-bold text-sm shadow-xl shadow-primary-700/20">
            {initials}
          </button>
          
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                  'absolute right-0 mt-3 w-64 rounded-2xl border shadow-2xl overflow-hidden p-2',
                  isDark ? 'bg-surface-900 border-surface-800' : 'bg-white border-surface-100'
                )}
              >
                 <div className="p-3 border-b dark:border-surface-800 mb-2">
                    <p className="font-bold text-sm text-surface-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-surface-500 truncate">{user?.email}</p>
                 </div>
                 <button className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center gap-2">
                    <User className="w-4 h-4" /> Profile
                 </button>
                 <button className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Settings
                 </button>
                 <div className="border-t dark:border-surface-800 my-2" />
                 <button className="w-full text-left px-3 py-2 rounded-xl text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}


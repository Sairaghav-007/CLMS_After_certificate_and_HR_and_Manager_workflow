import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  Users,
  BarChart3,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User,
  GraduationCap
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useUIStore, useAuthStore } from '@/shared/store';
import { cn } from '@/shared/utils';
import { ToastContainer } from '@/shared/components/Toast';

const adminNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
];

export function AdminLayout() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout / switch role
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <>
            {/* Mobile overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'fixed lg:relative z-50 flex flex-col w-[280px] h-full',
                'bg-gradient-to-b from-surface-900 via-surface-900 to-surface-950',
                'border-r border-surface-800/50 shadow-2xl'
              )}
            >
              {/* Logo */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-800/50">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 shadow-lg shadow-accent-500/25">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">CLMS</h1>
                  <p className="text-[11px] text-accent-400 tracking-wider uppercase font-semibold">Admin Panel</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-auto lg:hidden p-1 rounded-lg hover:bg-surface-800 text-surface-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {adminNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-accent-600/20 to-primary-600/20 text-white shadow-sm border border-accent-500/20'
                          : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* User / Logout */}
              <div className="px-3 py-4 border-t border-surface-800/50">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.fullName || 'Administrator'}</p>
                    <p className="text-xs text-accent-400 font-semibold truncate">{user?.role || 'Admin'}</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-3 bg-white border-b border-surface-200 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block text-xs font-semibold px-3 py-1 bg-accent-50 text-accent-600 border border-accent-100 rounded-full uppercase tracking-wider">
              Management Portal
            </div>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center text-white font-semibold text-sm">
                A
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-surface-200 z-50 overflow-hidden py-1"
                >
                  <div className="px-4 py-3 border-b border-surface-100">
                    <p className="font-semibold text-surface-900 text-sm">{user?.fullName}</p>
                    <p className="text-xs text-surface-500">{user?.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Switch Role (Sign Out)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-surface-50">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

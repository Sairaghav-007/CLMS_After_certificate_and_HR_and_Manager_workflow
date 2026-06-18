import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PlusSquare,
  ClipboardCheck,
  BookOpen,
  FileEdit,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/hr/lib/utils';
import { useUIStore, useThemeStore } from '@/hr/store';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/course-creation', icon: PlusSquare, label: 'Course Creation' },
  { path: '/review-courses', icon: ClipboardCheck, label: 'Review Courses' },
  { path: '/published-courses', icon: BookOpen, label: 'Published Courses' },
  { path: '/alter-courses', icon: FileEdit, label: 'Alter Published Courses' },
];

export function Sidebar() {
  const { sidebarExpanded, sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  const sidebarWidth = sidebarExpanded ? 260 : 80;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
          x: 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed lg:relative z-50 flex flex-col h-full',
          'bg-white',
          'border-r border-surface-200 shadow-sm',
          'transition-transform duration-300',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-200 min-h-[72px]">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-700 to-accent-600 shadow-lg shadow-primary-700/15 flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-lg font-bold text-surface-800 tracking-tight">CLMS</h1>
                <p className="text-[11px] text-surface-400 tracking-wider uppercase">HR Portal</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 rounded-lg hover:bg-surface-100 text-surface-400 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  sidebarExpanded ? 'px-4' : 'px-0 justify-center',
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-700 shadow-sm'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip when collapsed */}
                {!sidebarExpanded && (
                  <div className="absolute left-full ml-2 px-3 py-1.5 bg-surface-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle (Desktop only) */}
        <div className="hidden lg:flex px-3 py-2 border-t border-surface-200">
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex items-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-surface-500 hover:text-surface-800 hover:bg-surface-50 transition-all duration-200',
              sidebarExpanded ? 'px-4' : 'px-0 justify-center'
            )}
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarExpanded ? (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-surface-200">
          <AnimatePresence>
            {sidebarExpanded ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-surface-500 text-center tracking-wider uppercase"
              >
                CLMS HR Portal v1.0
              </motion.p>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[9px] text-surface-500 text-center tracking-wider"
              >
                v1.0
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}


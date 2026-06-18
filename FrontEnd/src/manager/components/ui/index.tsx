import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

// --- KPI Card ---
interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  change?: { value: number; label: string };
  delay?: number;
}

export function KPICard({ title, value, icon: Icon, gradient, change, delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass-card rounded-card p-5 cursor-default group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5 text-black" />
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            change.value >= 0
              ? 'text-black bg-accent-50 dark:bg-accent-900/30'
              : 'text-black bg-danger-50 dark:bg-danger-900/30'
          }`}>
            {change.value >= 0 ? '+' : ''}{change.value}%
          </span>
        )}
      </div>
      <div className="flex flex-col mt-2">
        <p className="text-[32px] font-bold text-surface-900 dark:text-black tracking-tight leading-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs text-surface-500 dark:text-black font-bold uppercase tracking-wider">{title}</p>
        {change && (
          <p className="text-[10px] text-surface-400 dark:text-black mt-0.5">{change.label}</p>
        )}
      </div>

      <div className="mt-4 h-1 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: change ? `${Math.min(95, Math.abs(change.value) + 50)}%` : '65%' }}
          className={`h-full ${gradient}`}
        />
      </div>
    </motion.div>
  );
}

// --- Page Header ---
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
    >
      <div>
        <h1 className="text-[32px] font-bold text-surface-900 dark:text-black tracking-tight leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-surface-500 dark:text-black mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </motion.div>
  );
}

// --- Filter Bar ---
interface FilterBarProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  categories?: string[];
  extra?: ReactNode;
}

export function FilterBar({
  category, onCategoryChange, search, onSearchChange,
  searchPlaceholder = 'Search...', categories = ['Individual', 'Team', 'Department', 'Group'],
  extra
}: FilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      {categories && categories.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-btn">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                category === cat
                  ? 'bg-white border-primary-500 text-black shadow-sm'
                  : 'bg-white border-surface-200 text-black/60 hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 relative">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-10 pl-10 pr-4 rounded-btn bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-900 dark:text-black placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      {extra}
    </motion.div>
  );
}

// --- Status Badge ---
interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  Compliant: 'bg-accent-50 text-black dark:bg-accent-900/30 dark:text-black',
  'Non-Compliant': 'bg-danger-50 text-black dark:bg-danger-900/30 dark:text-black',
  'At Risk': 'bg-warning-50 text-black dark:bg-warning-900/30 dark:text-black',
  Completed: 'bg-accent-50 text-black dark:bg-accent-900/30 dark:text-black',
  'In Progress': 'bg-primary-50 text-black dark:bg-primary-900/30 dark:text-black',
  'Not Started': 'bg-surface-100 text-black dark:bg-surface-800 dark:text-black',
  Overdue: 'bg-danger-50 text-black dark:bg-danger-900/30 dark:text-black',
  'Not Completed': 'bg-warning-50 text-black dark:bg-warning-900/30 dark:text-black',
  Passed: 'bg-accent-50 text-black dark:bg-accent-900/30 dark:text-black',
  Failed: 'bg-danger-50 text-black dark:bg-danger-900/30 dark:text-black',
  'Not Attempted': 'bg-surface-100 text-black dark:bg-surface-800 dark:text-black',
  Active: 'bg-accent-50 text-black dark:bg-accent-900/30 dark:text-black',
  Archived: 'bg-surface-100 text-black dark:bg-surface-800 dark:text-black',
  Submitted: 'bg-primary-50 text-black dark:bg-primary-900/30 dark:text-black',
  'On Review': 'bg-warning-50 text-black dark:bg-warning-900/30 dark:text-black',
  'Need Changes': 'bg-danger-50 text-black dark:bg-danger-900/30 dark:text-black',
  'Ready To Publish': 'bg-accent-50 text-black dark:bg-accent-900/30 dark:text-black',
  Low: 'bg-surface-100 text-black dark:bg-surface-800 dark:text-black',
  Medium: 'bg-warning-50 text-black dark:bg-warning-900/30 dark:text-black',
  High: 'bg-danger-50 text-black dark:bg-danger-900/30 dark:text-black',
  Reminder: 'bg-primary-50 text-black dark:bg-primary-900/30 dark:text-black',
  Alert: 'bg-danger-50 text-black dark:bg-danger-900/30 dark:text-black',
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold ${
      size === 'sm' ? 'text-[10px]' : 'text-xs'
    } ${statusStyles[status] || 'bg-surface-100 text-surface-500'}`}>
      {status}
    </span>
  );
}

// --- Progress Bar ---
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, color = 'bg-primary-500', size = 'sm', showLabel = true }: ProgressBarProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden ${
        size === 'sm' ? 'h-1.5' : 'h-2.5'
      }`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] font-semibold text-surface-500 dark:text-black w-8 text-right">
          {percent}%
        </span>
      )}
    </div>
  );
}

// --- Export Button ---
interface ExportButtonProps {
  onExport: (format: string) => void;
}

export function ExportButton({ onExport }: ExportButtonProps) {
  return (
    <div className="flex items-center gap-1">
      {['PDF', 'CSV', 'Excel'].map((fmt) => (
        <motion.button
          key={fmt}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onExport(fmt)}
          className="px-4 py-2 text-xs font-bold rounded-btn bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-black hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-900"
        >
          {fmt}
        </motion.button>
      ))}
    </div>
  );
}

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-900/40 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative ${sizeClasses[size]} w-full glass-card rounded-modal shadow-2xl overflow-hidden max-h-[85vh] flex flex-col`}
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-bold text-surface-900 dark:text-black">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Drawer ---
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-900/40 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl glass-card rounded-l-modal border-l border-surface-200 dark:border-surface-700 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-bold text-surface-900 dark:text-black">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Tabs ---
interface TabsProps {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-btn w-fit">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`relative px-4 py-2 rounded-btn text-xs font-bold transition-all duration-200 ${
            active === tab
              ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-surface-500 dark:text-black hover:text-surface-700'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// --- Empty State ---
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-400" />
      </div>
      <h3 className="text-base font-semibold text-surface-700 dark:text-black mb-1">{title}</h3>
      <p className="text-sm text-surface-500 dark:text-black max-w-sm">{subtitle}</p>
    </div>
  );
}


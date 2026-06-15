import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CheckCircle2, 
  Award, 
  Clock, 
  Plus, 
  Search, 
  Building2, 
  AlertTriangle, 
  TrendingUp, 
  Send, 
  X,
  BookOpen,
  Edit2,
  Trash2,
  FolderKanban,
  GraduationCap,
  ShieldCheck,
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { useUIStore } from '@/shared/store';
import { formatDate } from '@/shared/utils';
import { userApi, learningPathApi, courseApi } from '@/admin/services/adminApi';

// Types
interface Account {
  uniqueId: string;
  email: string;
  password?: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  role: string;
  joiningYear: number;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  duration: number; // hours
  department: string;
}

interface CourseAssign {
  id: string;
  title: string;
  category: 'Mandatory' | 'Departmental' | 'Elective';
  duration: number; // hours
}

// Static violations (frontend-only, no backend needed yet)
const staticViolations = [
  { id: 'V1', employeeName: 'Charlie Brown', type: 'TabSwitch', detail: 'User switched tabs during protected course viewing', time: new Date(Date.now() - 3600000).toISOString() },
  { id: 'V2', employeeName: 'Alice Johnson', type: 'PrintScreen', detail: 'User attempted to capture a screenshot of assessment', time: new Date(Date.now() - 14400000).toISOString() },
  { id: 'V3', employeeName: 'Bob Smith', type: 'DevTools', detail: 'User attempted to open developer tools', time: new Date(Date.now() - 86400000).toISOString() },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'paths' | 'courses'>('overview');

  // Data States — populated from backend
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<CourseAssign[]>([]);
  const [violations] = useState(staticViolations);

  // Loading states
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingPaths, setLoadingPaths]  = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Filters & Search
  const [accountSearch, setAccountSearch] = useState('');
  const [pathSearch, setPathSearch] = useState('');
  const [courseCategoryFilter, setCourseCategoryFilter] = useState<'All' | 'Mandatory' | 'Departmental' | 'Elective'>('All');

  // Modal Control States
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPathModal, setShowPathModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Edit target states
  const [editAccountTarget, setEditAccountTarget] = useState<Account | null>(null);
  const [editPathTarget, setEditPathTarget] = useState<LearningPath | null>(null);

  // Detail View State (Retrieve Learning Path)
  const [selectedPathDetails, setSelectedPathDetails] = useState<LearningPath | null>(null);

  const addToast = useUIStore((s) => s.addToast);

  // ─── Fetch All Data from Backend ──────────────────────────────────
  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const data = await userApi.getAll();
      setAccounts(data);
    } catch {
      addToast({ type: 'error', title: 'API Error', message: 'Could not load accounts. Is the backend running?' });
    } finally {
      setLoadingAccounts(false);
    }
  }, [addToast]);

  const fetchPaths = useCallback(async () => {
    setLoadingPaths(true);
    try {
      const data = await learningPathApi.getAll();
      setPaths(data);
    } catch {
      addToast({ type: 'error', title: 'API Error', message: 'Could not load learning paths.' });
    } finally {
      setLoadingPaths(false);
    }
  }, [addToast]);

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const data = await courseApi.getAll();
      setCourses(data);
    } catch {
      addToast({ type: 'error', title: 'API Error', message: 'Could not load courses.' });
    } finally {
      setLoadingCourses(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAccounts();
    fetchPaths();
    fetchCourses();
  }, [fetchAccounts, fetchPaths, fetchCourses]);

  // Form States
  const [accountForm, setAccountForm] = useState({
    uniqueId: '',
    email: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    role: 'Employee',
    joiningYear: new Date().getFullYear(),
  });

  const [pathForm, setPathForm] = useState({
    name: '',
    description: '',
    duration: 10,
    department: 'Engineering',
  });

  const [courseForm, setCourseForm] = useState({
    title: '',
    category: 'Mandatory' as CourseAssign['category'],
    duration: 8,
  });

  // --- ACCOUNT CRUD HANDLERS ---
  const handleOpenCreateAccount = () => {
    setEditAccountTarget(null);
    setAccountForm({
      uniqueId: '',
      email: '',
      password: '',
      firstName: '',
      middleName: '',
      lastName: '',
      role: 'Employee',
      joiningYear: new Date().getFullYear(),
    });
    setShowAccountModal(true);
  };

  const handleOpenEditAccount = (acc: Account) => {
    setEditAccountTarget(acc);
    setAccountForm({
      uniqueId: acc.uniqueId,
      email: acc.email,
      password: acc.password || '',
      firstName: acc.firstName,
      middleName: acc.middleName || '',
      lastName: acc.lastName || '',
      role: acc.role,
      joiningYear: acc.joiningYear,
    });
    setShowAccountModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.email || !accountForm.firstName || !accountForm.role) {
      addToast({ type: 'error', title: 'Missing Fields', message: 'Please provide email, first name, and role.' });
      return;
    }
    try {
      if (editAccountTarget) {
        await userApi.update(editAccountTarget.uniqueId, accountForm);
        addToast({ type: 'success', title: 'Account Updated', message: `Successfully updated ${accountForm.firstName}'s account.` });
      } else {
        await userApi.create(accountForm);
        addToast({ type: 'success', title: 'Account Created', message: `Successfully created ${accountForm.role} account for ${accountForm.firstName}.` });
      }
      setShowAccountModal(false);
      fetchAccounts();
    } catch {
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not save account. Please try again.' });
    }
  };

  const handleRemoveAccount = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove account for ${name}?`)) {
      try {
        await userApi.remove(id);
        addToast({ type: 'success', title: 'Account Removed', message: `Successfully removed account for ${name}.` });
        fetchAccounts();
      } catch {
        addToast({ type: 'error', title: 'Delete Failed', message: 'Could not remove account. Please try again.' });
      }
    }
  };

  // --- LEARNING PATH CRUD HANDLERS ---
  const handleOpenCreatePath = () => {
    setEditPathTarget(null);
    setPathForm({ name: '', description: '', duration: 15, department: 'Engineering' });
    setShowPathModal(true);
  };

  const handleOpenEditPath = (path: LearningPath) => {
    setEditPathTarget(path);
    setPathForm({ name: path.name, description: path.description, duration: path.duration, department: path.department });
    setShowPathModal(true);
  };

  const handleSavePath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pathForm.name || !pathForm.description) {
      addToast({ type: 'error', title: 'Missing Fields', message: 'Please provide path name and description.' });
      return;
    }
    try {
      const payload = { ...pathForm, duration: Number(pathForm.duration) };
      if (editPathTarget) {
        await learningPathApi.update(editPathTarget.id, payload);
        addToast({ type: 'success', title: 'Path Updated', message: `Learning path "${pathForm.name}" updated successfully.` });
      } else {
        await learningPathApi.create(payload);
        addToast({ type: 'success', title: 'Path Added', message: `Learning path "${pathForm.name}" created successfully.` });
      }
      setShowPathModal(false);
      fetchPaths();
    } catch {
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not save learning path. Please try again.' });
    }
  };

  const handleRemovePath = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete learning path "${name}"?`)) {
      try {
        await learningPathApi.remove(id);
        if (selectedPathDetails?.id === id) setSelectedPathDetails(null);
        addToast({ type: 'success', title: 'Path Deleted', message: `Learning path "${name}" was deleted.` });
        fetchPaths();
      } catch {
        addToast({ type: 'error', title: 'Delete Failed', message: 'Could not delete learning path. Please try again.' });
      }
    }
  };

  const handleRetrievePath = (path: LearningPath) => {
    // Retrieve Path (Branch 3: Retrieve learning path details)
    setSelectedPathDetails(path);
  };

  // --- COURSE ASSIGNMENT HANDLERS ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    addToast({ type: 'error', title: 'Action Disabled', message: 'Course creation is now restricted to HR portal.' });
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete course "${name}"? This will also delete all progress, questions, and certificates for this course.`)) {
      try {
        await courseApi.remove(id);
        addToast({ type: 'success', title: 'Course Deleted', message: `Course "${name}" was deleted.` });
        fetchCourses();
      } catch {
        addToast({ type: 'error', title: 'Delete Failed', message: 'Could not delete course. Please try again.' });
      }
    }
  };

  // Filter lists
  const filteredAccounts = accounts.filter(a => {
    const fullName = `${a.firstName || ''} ${a.middleName || ''} ${a.lastName || ''}`.toLowerCase();
    const searchLower = accountSearch.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (a.email && a.email.toLowerCase().includes(searchLower)) ||
      (a.role && a.role.toLowerCase().includes(searchLower)) ||
      String(a.joiningYear).includes(searchLower)
    );
  });

  const filteredPaths = paths.filter(p => 
    p.name.toLowerCase().includes(pathSearch.toLowerCase()) ||
    p.department.toLowerCase().includes(pathSearch.toLowerCase())
  );

  const filteredCourses = courseCategoryFilter === 'All' 
    ? courses 
    : courses.filter(c => c.category === courseCategoryFilter);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-200 pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-surface-900 tracking-tight">System Controls</h1>
          <p className="text-surface-500 font-medium">Manage employees, define learning pathways, and assign category courses.</p>
        </div>

        {/* Tab Switchers */}
        <div className="flex bg-surface-100 p-1.5 rounded-2xl border border-surface-200 text-xs font-bold gap-1 self-start md:self-auto overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'accounts', label: 'Accounts Manager', icon: Users },
            { id: 'paths', label: 'Learning Paths', icon: FolderKanban },
            { id: 'courses', label: 'Courses Database', icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap',
                activeTab === tab.id 
                  ? 'bg-white text-accent-700 shadow-sm border border-surface-200' 
                  : 'text-surface-500 hover:text-surface-800'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Registered Users', value: accounts.length, change: 'Manager, HR, and Employee', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
              { title: 'Training Paths', value: paths.length, change: 'Active programs', icon: FolderKanban, color: 'text-violet-500', bg: 'bg-violet-50' },
              { title: 'Total Courses', value: courses.length, change: 'Mandatory / Elective', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50' },
              { title: 'Compliance Alerts', value: violations.length, change: 'Requires intervention', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-surface-200 shadow-sm flex items-center gap-5">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', stat.bg, stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-2xl font-black text-surface-900 mt-1 leading-none">{stat.value}</h3>
                  <p className="text-[11px] text-surface-500 font-semibold mt-1.5">{stat.change}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Details split */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-white rounded-3xl border border-surface-200 p-6 space-y-6">
              <h3 className="text-lg font-black text-surface-900">Recent System Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-surface-50 rounded-2xl border border-surface-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800">New employee credentials authorized</p>
                    <p className="text-xs text-surface-400 mt-1 font-semibold">Active accounts: {accounts.filter(a => a.role === 'Employee').length} Employees, {accounts.filter(a => a.role === 'HR Manager').length} HR Admins.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-surface-50 rounded-2xl border border-surface-100">
                  <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800">Learning paths updated</p>
                    <p className="text-xs text-surface-400 mt-1 font-semibold">Core curriculum structured across {paths.length} separate department paths.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Violation warnings log */}
            <div className="bg-white rounded-3xl border border-surface-200 p-6 space-y-6">
              <h3 className="text-lg font-black text-surface-900 flex items-center gap-2">
                <AlertTriangle className="text-rose-500" size={20} />
                Compliance Auditing
              </h3>
              <div className="space-y-4">
                {violations.map((v) => (
                  <div key={v.id} className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-surface-950">{v.employeeName}</span>
                      <span className="text-[8px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">{v.type}</span>
                    </div>
                    <p className="text-xs text-surface-600 font-semibold mb-2">{v.detail}</p>
                    <span className="text-[10px] text-surface-400 font-medium">{formatDate(v.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ACCOUNTS TAB (CREATE/EDIT/REMOVE MANAGER, HR, EMPLOYEE) --- */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-3xl border border-surface-200 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-black text-surface-900">Manage Accounts (Managers, HR, Employees)</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none w-full sm:w-56 transition-all"
                />
              </div>
              <button
                onClick={handleOpenCreateAccount}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent-600 text-white rounded-xl font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus size={14} />
                Create Account
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 text-xs font-black text-surface-400 uppercase tracking-wider">
                  <th className="pb-3 pl-4">Full Name / Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Joining Year</th>
                  <th className="pb-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 text-sm">
                {loadingAccounts ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-surface-400">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm font-semibold">Loading accounts from backend...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-surface-400 text-sm font-semibold">
                      No accounts found. Create one using the button above.
                    </td>
                  </tr>
                ) : filteredAccounts.map((acc) => (
                  <tr key={acc.uniqueId} className="hover:bg-surface-50/50 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="font-bold text-surface-900">
                        {`${acc.firstName || ''} ${acc.middleName ? acc.middleName + ' ' : ''}${acc.lastName || ''}`}
                      </div>
                      <div className="text-xs text-surface-400 font-semibold">{acc.email}</div>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        'text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider',
                        acc.role === 'Administrator' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        acc.role === 'HR Manager' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        acc.role === 'Department Manager' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-slate-50 text-slate-700 border border-slate-100'
                      )}>
                        {acc.role}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-surface-600">{acc.joiningYear}</td>
                    <td className="py-4 pr-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEditAccount(acc)}
                        className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors inline-flex cursor-pointer"
                        title="Edit Account"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleRemoveAccount(acc.uniqueId, `${acc.firstName || ''} ${acc.lastName || ''}`)}
                        className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-600 transition-colors inline-flex cursor-pointer"
                        title="Remove Account"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- LEARNING PATHS TAB (ADD, EDIT, DELETE, RETRIEVE LEARNING PATH) --- */}
      {activeTab === 'paths' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Paths Catalog List (Add, Edit, Delete) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-surface-200 p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-black text-surface-900">Learning Path Directory</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Search paths..."
                    value={pathSearch}
                    onChange={(e) => setPathSearch(e.target.value)}
                    className="pl-9 pr-4 py-2.5 rounded-xl border border-surface-200 text-xs focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none w-full sm:w-48 transition-all"
                  />
                </div>
                <button
                  onClick={handleOpenCreatePath}
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent-600 text-white rounded-xl font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus size={14} />
                  Add Path
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {loadingPaths ? (
                <div className="flex items-center justify-center gap-2 text-surface-400 py-10">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm font-semibold">Loading paths from backend...</span>
                </div>
              ) : filteredPaths.length === 0 ? (
                <div className="text-center text-surface-400 text-sm font-semibold py-10">
                  No learning paths yet. Click "Add Path" to create one.
                </div>
              ) : filteredPaths.map((path) => (
                <div 
                  key={path.id}
                  className={cn(
                    'p-5 border rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all',
                    selectedPathDetails?.id === path.id 
                      ? 'border-accent-400 bg-accent-50/20 shadow-md shadow-accent-500/5' 
                      : 'border-surface-200 hover:border-surface-300 bg-surface-50/30'
                  )}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-surface-900 truncate">{path.name}</h4>
                      <span className="text-[9px] px-2 py-0.5 bg-white text-surface-500 border border-surface-200 font-black rounded uppercase tracking-wider">
                        {path.department}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 line-clamp-2 leading-relaxed">{path.description}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-surface-400 font-semibold">
                      <Clock size={12} />
                      Estimated study time: {path.duration} hours
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => handleRetrievePath(path)}
                      className="px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-bold text-surface-600 hover:bg-white transition-all cursor-pointer"
                    >
                      Retrieve Details
                    </button>
                    <button
                      onClick={() => handleOpenEditPath(path)}
                      className="p-2 rounded-lg border border-surface-200 text-surface-500 hover:text-accent-600 hover:border-accent-100 hover:bg-white transition-all cursor-pointer"
                      title="Edit Path"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleRemovePath(path.id, path.name)}
                      className="p-2 rounded-lg border border-surface-200 text-surface-500 hover:text-danger-600 hover:border-danger-100 hover:bg-white transition-all cursor-pointer"
                      title="Delete Path"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details / Retrieve Panel (Retrieve learning path) */}
          <div className="bg-white rounded-3xl border border-surface-200 p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
            {selectedPathDetails ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-black text-surface-900">Learning Path Details</h3>
                  <button 
                    onClick={() => setSelectedPathDetails(null)}
                    className="p-1 rounded-lg hover:bg-surface-50 text-surface-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-black text-accent-600 bg-accent-50 px-2 py-0.5 rounded border border-accent-100">
                      ID: {selectedPathDetails.id}
                    </span>
                    <h4 className="text-lg font-black text-surface-950 mt-2">{selectedPathDetails.name}</h4>
                  </div>

                  <p className="text-xs text-surface-500 leading-relaxed font-medium">
                    {selectedPathDetails.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-surface-100 py-4">
                    <div>
                      <p className="text-[10px] text-surface-400 uppercase font-black tracking-wider">Department</p>
                      <p className="text-xs font-bold text-surface-700 mt-1">{selectedPathDetails.department}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-surface-400 uppercase font-black tracking-wider">Duration</p>
                      <p className="text-xs font-bold text-surface-700 mt-1">{selectedPathDetails.duration} Hours</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-surface-800 mb-2">Curriculum Breakdown</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg text-xs font-bold border border-surface-200">
                        <span>1. Setup & Orientation</span>
                        <span className="text-surface-400 font-semibold">2 hours</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg text-xs font-bold border border-surface-200">
                        <span>2. Technical Fundamentals</span>
                        <span className="text-surface-400 font-semibold">20 hours</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg text-xs font-bold border border-surface-200">
                        <span>3. Practical Assessment</span>
                        <span className="text-surface-400 font-semibold">10 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
                <FolderKanban size={48} className="text-surface-200 mb-3" />
                <h4 className="text-sm font-bold text-surface-700">No details loaded</h4>
                <p className="text-xs text-surface-400 mt-1 max-w-[200px]">Click the "Retrieve Details" button on any path to review curriculum modules.</p>
              </div>
            )}
            
            <div className="border-t border-surface-150 pt-4 mt-6 flex justify-between items-center text-[10px] font-bold text-surface-400">
              <span>Path Manager v1.0</span>
              <span className="text-accent-500">Compliance Audited</span>
            </div>
          </div>
        </div>
      )}

      {/* --- COURSES TAB (MANDATORY, DEPARTMENTAL, ELECTIVE VIEW AND ASSIGNMENT) --- */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-3xl border border-surface-200 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-surface-900">Course Database</h3>
              <p className="text-xs text-surface-400 mt-1 font-semibold">Structure courses under Mandatory, Departmental, or Elective modules.</p>
            </div>
            
            <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
              {/* Filter */}
              <div className="flex bg-surface-100 p-1 border border-surface-200 rounded-xl text-xs font-bold">
                {['All', 'Mandatory', 'Departmental', 'Elective'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCourseCategoryFilter(cat as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap',
                      courseCategoryFilter === cat 
                        ? 'bg-white text-surface-800 shadow-sm border border-surface-200' 
                        : 'text-surface-500 hover:text-surface-800'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowCourseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-xl font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus size={14} />
                Create Course
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingCourses ? (
              <div className="col-span-3 flex items-center justify-center gap-2 text-surface-400 py-12">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm font-semibold">Loading courses from backend...</span>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="col-span-3 text-center text-surface-400 text-sm font-semibold py-12">
                No courses found. Click "Create Course" to add one.
              </div>
            ) : filteredCourses.map((course) => (
              <div key={course.id} className="p-5 border border-surface-200 bg-surface-50/20 hover:bg-surface-50/50 rounded-2xl flex flex-col justify-between transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn(
                      'text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider',
                      course.category === 'Mandatory' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                      course.category === 'Departmental' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      'bg-purple-50 text-purple-600 border border-purple-100'
                    )}>
                      {course.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-surface-400">ID: {course.id}</span>
                      <button 
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        className="p-1 rounded hover:bg-rose-50 text-surface-400 hover:text-rose-600 transition-all cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-surface-900 leading-snug line-clamp-2">{course.title}</h4>
                </div>

                <div className="flex items-center justify-between border-t border-surface-100 pt-4 mt-6 text-xs font-semibold text-surface-500">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {course.duration} hours
                  </span>
                  <button 
                    onClick={() => {
                      addToast({
                        type: 'success',
                        title: 'Sync Complete',
                        message: `Successfully synchronized parameters for "${course.title}".`
                      });
                    }}
                    className="text-xs font-bold text-accent-600 hover:text-accent-700 cursor-pointer"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ACCOUNT MODAL (CREATE & EDIT) --- */}
      <AnimatePresence>
        {showAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-surface-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between">
                <h4 className="text-lg font-black text-surface-900">
                  {editAccountTarget ? 'Edit Account' : 'Create Account'}
                </h4>
                <button 
                  onClick={() => setShowAccountModal(false)}
                  className="p-1 rounded-lg hover:bg-surface-50 text-surface-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAccount} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane"
                      value={accountForm.firstName}
                      onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smith"
                      value={accountForm.lastName}
                      onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Middle Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Marie"
                    value={accountForm.middleName}
                    onChange={(e) => setAccountForm({ ...accountForm, middleName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jane.smith@acmecorp.com"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required={!editAccountTarget}
                    placeholder={editAccountTarget ? "Leave blank to keep current password" : "Enter account password"}
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Select Role</label>
                    <select
                      value={accountForm.role}
                      onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                    >
                      <option value="Employee">Employee</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="Department Manager">Department Manager</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Joining Year</label>
                    <input
                      type="number"
                      required
                      min={1900}
                      max={2100}
                      value={accountForm.joiningYear}
                      onChange={(e) => setAccountForm({ ...accountForm, joiningYear: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent-600 hover:bg-accent-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-accent-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-4"
                >
                  <Send size={16} />
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- LEARNING PATH MODAL (ADD & EDIT) --- */}
      <AnimatePresence>
        {showPathModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-surface-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between">
                <h4 className="text-lg font-black text-surface-900">
                  {editPathTarget ? 'Edit Learning Path' : 'Add New Learning Path'}
                </h4>
                <button 
                  onClick={() => setShowPathModal(false)}
                  className="p-1 rounded-lg hover:bg-surface-50 text-surface-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePath} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Path Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Executive Path"
                    value={pathForm.name}
                    onChange={(e) => setPathForm({ ...pathForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Description</label>
                  <textarea
                    required
                    placeholder="Provide curriculum path goals..."
                    rows={3}
                    value={pathForm.description}
                    onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Duration (Hrs)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={pathForm.duration}
                      onChange={(e) => setPathForm({ ...pathForm, duration: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Department</label>
                    <select
                      value={pathForm.department}
                      onChange={(e) => setPathForm({ ...pathForm, department: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="All">All Departments</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent-600 hover:bg-accent-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-accent-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-4"
                >
                  <Send size={16} />
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CREATE COURSE MODAL --- */}
      <AnimatePresence>
        {showCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-surface-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between">
                <h4 className="text-lg font-black text-surface-900 flex items-center gap-2">
                  <Plus size={18} className="text-accent-600" />
                  Create New Course
                </h4>
                <button 
                  onClick={() => setShowCourseModal(false)}
                  className="p-1 rounded-lg hover:bg-surface-50 text-surface-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOC-2 Compliance Training"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Select Category</label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                    >
                      <option value="Mandatory">Mandatory Course</option>
                      <option value="Departmental">Departmental Course</option>
                      <option value="Elective">Elective Course</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Duration (Hrs)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent-600 hover:bg-accent-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-accent-500/15 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer mt-4"
                >
                  <Plus size={16} />
                  Create Course
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Simple cn helper for classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

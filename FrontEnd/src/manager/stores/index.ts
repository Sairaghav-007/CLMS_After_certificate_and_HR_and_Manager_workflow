import { create } from 'zustand';
import type { FilterState, ManagerSettings, Notification, AuditLog, NudgeRecord, CourseReview, LearningGroup } from '../types';
import { mockSettings, mockNotifications, mockAuditLogs, mockNudgeHistory, mockCourseReviews, mockGroups } from '../data/mockData';

// --- Theme Store ---
interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: (theme) => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme, resolvedTheme: resolved });
  },
}));

// --- Sidebar Store ---
interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (val: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
  setCollapsed: (val) => set({ collapsed: val }),
}));

// --- Filter Store ---
interface FilterStore {
  filters: FilterState;
  setFilter: (f: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = { category: 'Individual', search: '' };

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,
  setFilter: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));

// --- Notification Store ---
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter(n => !n.read).length,
  markRead: (id) => set((s) => {
    const updated = s.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    return { notifications: updated, unreadCount: updated.filter(n => !n.read).length };
  }),
  markAllRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
}));

// --- Settings Store ---
interface SettingsStore {
  settings: ManagerSettings;
  updateSettings: (s: Partial<ManagerSettings>) => void;
  updateNotificationPref: (key: keyof ManagerSettings['notifications'], val: boolean) => void;
  updateProfile: (p: Partial<ManagerSettings['profile']>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: mockSettings,
  updateSettings: (newS) => set((s) => ({ settings: { ...s.settings, ...newS } })),
  updateNotificationPref: (key, val) => set((s) => ({
    settings: { ...s.settings, notifications: { ...s.settings.notifications, [key]: val } }
  })),
  updateProfile: (p) => set((s) => ({
    settings: { ...s.settings, profile: { ...s.settings.profile, ...p } }
  })),
}));

// --- Audit Store ---
interface AuditStore {
  logs: AuditLog[];
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

export const useAuditStore = create<AuditStore>((set) => ({
  logs: mockAuditLogs,
  addLog: (log) => set((s) => ({
    logs: [{
      ...log,
      id: `AUD-${String(s.logs.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
    }, ...s.logs],
  })),
}));

// --- Nudge Store ---
interface NudgeStore {
  history: NudgeRecord[];
  addNudge: (nudge: Omit<NudgeRecord, 'id' | 'sentAt'>) => void;
}

export const useNudgeStore = create<NudgeStore>((set) => ({
  history: mockNudgeHistory,
  addNudge: (nudge) => set((s) => ({
    history: [{
      ...nudge,
      id: `NDG-${String(s.history.length + 1000).padStart(4, '0')}`,
      sentAt: new Date().toISOString(),
    }, ...s.history],
  })),
}));

// --- Review Store ---
interface ReviewStore {
  reviews: CourseReview[];
  updateStatus: (id: string, status: CourseReview['status'], feedback?: CourseReview['feedback']) => void;
}

export const useReviewStore = create<ReviewStore>((set) => ({
  reviews: mockCourseReviews,
  updateStatus: (id, status, feedback) => set((s) => ({
    reviews: s.reviews.map(r =>
      r.id === id ? { ...r, status, feedback: feedback || r.feedback } : r
    ),
  })),
}));

// --- Group Store ---
interface GroupStore {
  groups: LearningGroup[];
  addGroup: (group: LearningGroup) => void;
  updateGroup: (id: string, data: Partial<LearningGroup>) => void;
  deleteGroup: (id: string) => void;
  archiveGroup: (id: string) => void;
  duplicateGroup: (id: string) => void;
}

export const useGroupStore = create<GroupStore>((set) => ({
  groups: mockGroups,
  addGroup: (group) => set((s) => ({ groups: [group, ...s.groups] })),
  updateGroup: (id, data) => set((s) => ({
    groups: s.groups.map(g => g.id === id ? { ...g, ...data } : g),
  })),
  deleteGroup: (id) => set((s) => ({
    groups: s.groups.filter(g => g.id !== id),
  })),
  archiveGroup: (id) => set((s) => ({
    groups: s.groups.map(g => g.id === id ? { ...g, status: 'Archived' as const } : g),
  })),
  duplicateGroup: (id) => set((s) => {
    const original = s.groups.find(g => g.id === id);
    if (!original) return s;
    const newGroup: LearningGroup = {
      ...original,
      id: `GRP-2026-${String(s.groups.length + 1).padStart(4, '0')}`,
      name: `${original.name} (Copy)`,
      createdDate: new Date().toISOString().split('T')[0],
    };
    return { groups: [newGroup, ...s.groups] };
  }),
}));


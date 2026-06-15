import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HRUser, HRNotification, ThemeMode } from '@/hr/types';

// ─── Theme Store ─────────────────────────────────────────

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        document.body.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark', newTheme === 'dark');
        set({ theme: newTheme });
      },
    }),
    { name: 'clms-hr-theme' }
  )
);

// ─── UI Store ────────────────────────────────────────────

interface UIState {
  sidebarExpanded: boolean;
  sidebarOpen: boolean;
  isLoading: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarExpanded: true,
  sidebarOpen: true,
  isLoading: true,
  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// ─── User Store ──────────────────────────────────────────

interface UserState {
  user: HRUser | null;
  isAuthenticated: boolean;
  setUser: (user: HRUser) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'clms-hr-user' }
  )
);

// ─── Notification Store ──────────────────────────────────

interface NotificationState {
  notifications: HRNotification[];
  setNotifications: (notifications: HRNotification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (notification: HRNotification) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
}));


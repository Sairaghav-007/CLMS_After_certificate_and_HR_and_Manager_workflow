import { create } from 'zustand';
import { type Notification, NotificationType } from '@/shared/types';
import { api } from '../api/client';
import { useAuthStore } from './AuthStore';

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ notifications: [] });
      return;
    }

    set({ loading: true });
    try {
      if (user.role === 'EMPLOYEE') {
        const response = await api.get('/employee/notifications');
        const formatted: Notification[] = response.data.map((n: any) => {
          let mappedType = NotificationType.COURSE_ASSIGNED;
          if (n.type === 'nudge' || n.type === 'due_date_reminder') {
            mappedType = NotificationType.DUE_DATE_REMINDER;
          } else if (n.type === 'quiz_failure' || n.type === 'course_removed') {
            mappedType = NotificationType.QUIZ_FAILURE;
          } else if (n.type === 'quiz_success') {
            mappedType = NotificationType.QUIZ_SUCCESS;
          } else if (n.type === 'certificate_generated') {
            mappedType = NotificationType.CERTIFICATE_GENERATED;
          }
          return {
            id: String(n.id),
            type: mappedType,
            title: n.title || 'Notification',
            message: n.message || '',
            courseId: n.courseId ? String(n.courseId) : undefined,
            isRead: !!n.isRead,
            createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
          };
        });
        set({ notifications: formatted, loading: false });
      } else if (user.role === 'HR') {
        const response = await api.get('/hr/notifications');
        const formatted: Notification[] = response.data.map((n: any) => ({
          id: String(n.id),
          type: n.type === 'approved' ? NotificationType.CERTIFICATE_GENERATED : NotificationType.COURSE_ASSIGNED,
          title: n.type === 'approved' ? 'Course Approved' 
               : n.type === 'change_request' ? 'Changes Requested' 
               : n.type === 'submitted' ? 'Manager Started Review' 
               : 'HR Notification',
          message: n.message || '',
          courseId: n.courseId ? String(n.courseId) : undefined,
          isRead: !!n.read,
          createdAt: n.timestamp ? new Date(n.timestamp).toISOString() : new Date().toISOString(),
        }));
        set({ notifications: formatted, loading: false });
      } else if (user.role === 'MANAGER') {
        const response = await api.get('/manager/notifications');
        const formatted: Notification[] = response.data.map((n: any) => ({
          id: String(n.id),
          type: n.type === 'approved' ? NotificationType.CERTIFICATE_GENERATED : NotificationType.COURSE_ASSIGNED,
          title: n.type === 'approved' ? 'Course Approved' 
               : n.type === 'change_request' ? 'Changes Requested' 
               : n.type === 'submitted' ? 'Course Review Request' 
               : 'Manager Notification',
          message: n.message || '',
          courseId: n.courseId ? String(n.courseId) : undefined,
          isRead: !!n.read,
          createdAt: n.timestamp ? new Date(n.timestamp).toISOString() : new Date().toISOString(),
        }));
        set({ notifications: formatted, loading: false });
      } else {
        set({ notifications: [], loading: false });
      }
    } catch (err) {
      console.error('[NotificationStore] Failed to fetch notifications:', err);
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      if (user.role === 'EMPLOYEE') {
        await api.post(`/employee/notifications/${id}/read`);
      } else if (user.role === 'HR') {
        await api.post(`/hr/notifications/${id}/read`);
      } else if (user.role === 'MANAGER') {
        await api.post(`/manager/notifications/${id}/read`);
      }

      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      }));
    } catch (err) {
      console.error('[NotificationStore] Failed to mark notification as read:', err);
    }
  },

  markAllRead: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      if (user.role === 'EMPLOYEE') {
        await api.post('/employee/notifications/read-all');
      } else if (user.role === 'HR') {
        const unread = get().notifications.filter((n) => !n.isRead);
        await Promise.all(unread.map((n) => api.post(`/hr/notifications/${n.id}/read`)));
      } else if (user.role === 'MANAGER') {
        await api.post('/manager/notifications/read-all');
      }

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
    } catch (err) {
      console.error('[NotificationStore] Failed to mark all notifications as read:', err);
    }
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
}));

import { create } from 'zustand';
import { type Notification, NotificationType } from '@/shared/types';

interface NotificationState {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (notification: Notification) => void;
  unreadCount: () => number;
}

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: NotificationType.COURSE_ASSIGNED,
    title: 'New Mandatory Course Assigned',
    message: 'You have been assigned: Cybersecurity Essentials for Developers. Complete it before the deadline.',
    courseId: '1',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-2',
    type: NotificationType.DUE_DATE_REMINDER,
    title: 'Course Deadline Approaching',
    message: 'Your course: Agile Project Management Mastery is due in 3 days.',
    courseId: '2',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: mockNotifications,
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

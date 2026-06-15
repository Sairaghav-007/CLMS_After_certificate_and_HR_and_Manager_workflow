import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course, CourseStatus, Module, Session, ChangeRequest, Notification } from '@/hr/types/course';
import { v4 as uuidv4 } from 'uuid';

// ── helpers ──────────────────────────────────────────────────────────────────
const ts = () => new Date().toISOString();
const auditEntry = (user: string, action: string, status?: CourseStatus, comment?: string) => ({
  id: uuidv4(), timestamp: ts(), user, action, status, comment,
});

function freshCourse(): Partial<Course> {
  return {
    id: uuidv4(),
    version: 'v1.0',
    title: '',
    description: '',
    passingScore: 70,
    maxAttempts: 3,
    category: 'Mandatory',
    duration: 0,
    modules: [],
    status: 'Draft',
    createdBy: 'Sanjay Kumar',
    department: 'Product Engineering',
    changeRequests: [],
    auditLogs: [],
    createdAt: ts(),
    updatedAt: ts(),
  };
}

// ── State interface ───────────────────────────────────────────────────────────
interface CourseState {
  courses: Course[];
  currentCourse: Partial<Course>;
  currentStep: number;
  lastSaved: string | null;
  isSaving: boolean;
  showSubmitSuccess: boolean;
  notifications: Notification[];

  // Creation
  setCurrentStep: (step: number) => void;
  updateMetadata: (metadata: Partial<Course>) => void;
  addModule: (module?: Partial<Module>) => void;
  updateModule: (moduleId: string, module: Partial<Module>) => void;
  deleteModule: (moduleId: string) => void;
  reorderModules: (modules: Module[]) => void;
  addSession: (moduleId: string, session?: Partial<Session>) => void;
  updateSession: (moduleId: string, sessionId: string, session: Partial<Session>) => void;
  deleteSession: (moduleId: string, sessionId: string) => void;
  reorderSessions: (moduleId: string, sessions: Session[]) => void;

  // Workflow transitions — strict FSM
  submitForReview: (courseId: string) => void;
  startReview: (courseId: string) => void;
  requestChanges: (courseId: string, req: Omit<ChangeRequest, 'id' | 'timestamp' | 'resolved'>) => void;
  approveCourse: (courseId: string) => void;
  publishCourse: (courseId: string) => void;
  schedulePublishing: (courseId: string, date: string) => void;
  resubmitForReview: (courseId: string) => void;
  unpublishCourse: (courseId: string) => void;

  // Versioning
  alterPublishedCourse: (courseId: string) => string;
  updateCourseInStore: (courseId: string, data: Partial<Course>) => void;

  // Helpers
  saveDraft: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  resetCourse: () => void;
  setCourse: (course: Course | Partial<Course>) => void;
  addAuditLog: (courseId: string, action: string, comment?: string) => void;
  markNotificationRead: (notifId: string) => void;
  dismissSubmitSuccess: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      courses: [],
      currentCourse: freshCourse(),
      currentStep: 0,
      lastSaved: null,
      isSaving: false,
      showSubmitSuccess: false,
      notifications: [],

      // ── Basic CRUD ──────────────────────────────────────────────────────────
      setCurrentStep: (step) => set({ currentStep: step }),

      updateMetadata: (metadata) =>
        set((s) => ({ currentCourse: { ...s.currentCourse, ...metadata, updatedAt: ts() } })),

      addModule: (module = {}) =>
        set((s) => {
          const newMod: Module = {
            id: uuidv4(),
            title: '',
            description: '',
            order: (s.currentCourse.modules?.length ?? 0) + 1,
            sessions: [],
            ...module,
          };
          return { currentCourse: { ...s.currentCourse, modules: [...(s.currentCourse.modules ?? []), newMod] } };
        }),

      updateModule: (moduleId, upd) =>
        set((s) => ({
          currentCourse: {
            ...s.currentCourse,
            modules: s.currentCourse.modules?.map((m) => (m.id === moduleId ? { ...m, ...upd } : m)),
          },
        })),

      deleteModule: (moduleId) =>
        set((s) => ({
          currentCourse: {
            ...s.currentCourse,
            modules: s.currentCourse.modules?.filter((m) => m.id !== moduleId),
          },
        })),

      reorderModules: (modules) => set((s) => ({ currentCourse: { ...s.currentCourse, modules } })),

      addSession: (moduleId, session = {}) =>
        set((s) => ({
          currentCourse: {
            ...s.currentCourse,
            modules: s.currentCourse.modules?.map((m) => {
              if (m.id !== moduleId) return m;
              const newSess: Session = {
                id: uuidv4(),
                title: '',
                type: 'Video',
                duration: 0,
                order: (m.sessions?.length ?? 0) + 1,
                ...session,
              };
              return { ...m, sessions: [...m.sessions, newSess] };
            }),
          },
        })),

      updateSession: (moduleId, sessionId, upd) =>
        set((s) => ({
          currentCourse: {
            ...s.currentCourse,
            modules: s.currentCourse.modules?.map((m) => {
              if (m.id !== moduleId) return m;
              return { ...m, sessions: m.sessions.map((s) => (s.id === sessionId ? { ...s, ...upd } : s)) };
            }),
          },
        })),

      deleteSession: (moduleId, sessionId) =>
        set((s) => ({
          currentCourse: {
            ...s.currentCourse,
            modules: s.currentCourse.modules?.map((m) => {
              if (m.id !== moduleId) return m;
              return { ...m, sessions: m.sessions.filter((s) => s.id !== sessionId) };
            }),
          },
        })),

      reorderSessions: (moduleId, sessions) =>
        set((s) => ({
          currentCourse: {
            ...s.currentCourse,
            modules: s.currentCourse.modules?.map((m) => (m.id === moduleId ? { ...m, sessions } : m)),
          },
        })),

      // ── Workflow FSM ────────────────────────────────────────────────────────
      submitForReview: async (courseId) => {
        try {
          const { api } = await import('@/api/client');
          const s = get();
          const idx = s.courses.findIndex((c) => c.id === courseId);
          const base = idx > -1 ? s.courses[idx] : (s.currentCourse as Course);
          
          const updated = {
            ...base,
            status: 'PENDING_MANAGER_REVIEW' as CourseStatus,
          };

          await api.post('/hr/courses', updated);
          await s.fetchCourses();

          set({
            currentCourse: freshCourse(),
            currentStep: 0,
            lastSaved: null,
            showSubmitSuccess: false,
          });
        } catch (error) {
          console.error("Failed to submit course for review:", error);
        }
      },

      startReview: async (courseId) => {
        try {
          const { api } = await import('@/api/client');
          await api.post(`/manager/reviews/${courseId}/approve`);
          await get().fetchCourses();
        } catch (error) {
          console.error("Failed to start review:", error);
        }
      },

      requestChanges: async (courseId, req) => {
        try {
          const { api } = await import('@/api/client');
          await api.post(`/manager/reviews/${courseId}/reject`, {
            changeTitle: req.title,
            comments: req.feedback,
            priority: req.priority,
          });
          await get().fetchCourses();
        } catch (error) {
          console.error("Failed to request changes:", error);
        }
      },

      resubmitForReview: async (courseId) => {
        try {
          const { api } = await import('@/api/client');
          const s = get();
          const base = s.courses.find((c) => c.id === courseId);
          if (base) {
            const updated = {
              ...base,
              status: 'PENDING_MANAGER_REVIEW' as CourseStatus,
            };
            await api.post('/hr/courses', updated);
            await s.fetchCourses();
          }
        } catch (error) {
          console.error("Failed to resubmit course:", error);
        }
      },

      approveCourse: async (courseId) => {
        try {
          const { api } = await import('@/api/client');
          await api.post(`/manager/reviews/${courseId}/approve`);
          await get().fetchCourses();
        } catch (error) {
          console.error("Failed to approve course:", error);
        }
      },

      publishCourse: async (courseId) => {
        try {
          const { api } = await import('@/api/client');
          const s = get();
          const base = s.courses.find((c) => c.id === courseId);
          if (base) {
            const updated = {
              ...base,
              status: 'Published' as CourseStatus,
            };
            await api.post('/hr/courses', updated);
            await s.fetchCourses();
          }
        } catch (error) {
          console.error("Failed to publish course:", error);
        }
      },

      schedulePublishing: async (courseId, date) => {
        try {
          const { api } = await import('@/api/client');
          const s = get();
          const base = s.courses.find((c) => c.id === courseId);
          if (base) {
            const updated = {
              ...base,
              status: 'Scheduled' as CourseStatus,
              scheduledAt: date,
            };
            await api.post('/hr/courses', updated);
            await s.fetchCourses();
          }
        } catch (error) {
          console.error("Failed to schedule publishing:", error);
        }
      },

      unpublishCourse: async (courseId) => {
        try {
          const { api } = await import('@/api/client');
          const s = get();
          const base = s.courses.find((c) => c.id === courseId);
          if (base) {
            const updated = {
              ...base,
              status: 'Unpublished' as CourseStatus,
            };
            await api.post('/hr/courses', updated);
            await s.fetchCourses();
          }
        } catch (error) {
          console.error("Failed to unpublish course:", error);
        }
      },

      // ── Versioning ──────────────────────────────────────────────────────────
      alterPublishedCourse: (courseId) => {
        const s = get();
        const original = s.courses.find((c) => c.id === courseId)!;
        const major = parseFloat(original.version.replace('v', ''));
        const newVer = `v${(major + 0.1).toFixed(1)}`;
        const draft: Course = {
          ...original,
          id: uuidv4(),
          parentId: original.id,
          version: newVer,
          status: 'Draft',
          createdAt: ts(),
          updatedAt: ts(),
          publishedAt: undefined,
          scheduledAt: undefined,
          changeRequests: [],
          auditLogs: [auditEntry('Sanjay Kumar', `Started editing — new draft ${newVer}`, 'Draft')],
        };
        set({ currentCourse: draft });
        return draft.id;
      },

      updateCourseInStore: (courseId, data) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId ? { ...c, ...data, updatedAt: ts() } : c
          ),
        })),

      // ── Helpers ─────────────────────────────────────────────────────────────
      saveDraft: async () => {
        set({ isSaving: true });
        try {
          const { api } = await import('@/api/client');
          const current = get().currentCourse;
          const response = await api.post('/hr/courses', {
            ...current,
            status: current.status || 'Draft'
          });
          if (response.data && response.data.id) {
            set({ currentCourse: { ...current, id: response.data.id, status: response.data.status } });
          }
          set({ lastSaved: ts() });
        } catch (error) {
          console.error("Failed to save draft course:", error);
        } finally {
          set({ isSaving: false });
        }
      },

      fetchCourses: async () => {
        try {
          const { api } = await import('@/api/client');
          const response = await api.get('/hr/courses');
          
          const mappedCourses: Course[] = response.data.map((c: any) => ({
            id: c.id,
            version: c.version || 'v1.0',
            title: c.title,
            description: c.description || '',
            passingScore: c.passingScore || 70,
            maxAttempts: c.maxAttempts || 3,
            category: c.category || 'Mandatory',
            duration: c.duration || 0,
            status: c.status || 'Draft',
            createdBy: c.createdBy || 'HR Specialist',
            department: c.department || 'Engineering',
            thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
            modules: (c.modules || []).map((m: any) => ({
              id: m.id,
              title: m.title,
              description: m.description || '',
              order: m.order,
              sessions: (m.sessions || []).map((s: any) => ({
                id: s.id,
                title: s.title,
                type: s.type || 'Video',
                duration: s.duration || 120,
                order: s.order,
                videoUrl: s.videoUrl,
                pdfUrl: s.pdfUrl,
                pptUrl: s.pptUrl,
              })),
            })),
            changeRequests: c.changeRequests || [],
            auditLogs: c.auditLogs || [],
            createdAt: c.createdAt || ts(),
            updatedAt: c.updatedAt || ts(),
          }));

          set({ courses: mappedCourses });
        } catch (error) {
          console.error("Failed to fetch courses:", error);
        }
      },

      resetCourse: () => set({ currentCourse: freshCourse(), currentStep: 0, lastSaved: null }),

      setCourse: (course) => set({ currentCourse: course }),

      addAuditLog: (courseId, action, comment) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, auditLogs: [...c.auditLogs, auditEntry('System', action, undefined, comment)] }
              : c
          ),
        })),

      markNotificationRead: (notifId) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
        })),

      dismissSubmitSuccess: () => set({ showSubmitSuccess: false }),
    }),
    { name: 'clms-v2-courses' }
  )
);


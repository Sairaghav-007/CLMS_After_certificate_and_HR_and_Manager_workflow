import { create } from 'zustand';
import type { Course, CourseFilters } from '@/shared/types';
import { CompletionStatus } from '@/shared/types';
import { api } from '../api/client';

interface CourseState {
  courses: Course[];
  filters: CourseFilters;
  selectedCourseId: string | null;
  setCourses: (courses: Course[]) => void;
  setFilters: (filters: Partial<CourseFilters>) => void;
  resetFilters: () => void;
  setSelectedCourse: (id: string | null) => void;
  updateCourseProgress: (courseId: string, progress: number) => void;
  completeModule: (courseId: string, moduleId: string) => void;
  unlockModule: (courseId: string, moduleId: string) => void;
  updateResourceProgress: (courseId: string, moduleId: string, resourceId: string, progress: number) => void;
  submitAssessmentPass: (courseId: string, score: number, employeeName: string) => Promise<void>;
  getFilteredCourses: () => Course[];
}

const defaultFilters: CourseFilters = {
  search: '',
  category: 'all',
  status: 'all',
  dueDate: 'all',
  department: '',
  durationRange: null,
  completionRange: null,
  sortBy: 'dueDate',
  sortOrder: 'asc',
};

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  filters: defaultFilters,
  selectedCourseId: null,

  setCourses: (courses) => {
    set({ courses });
  },

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  setSelectedCourse: (id) => set({ selectedCourseId: id }),

  updateCourseProgress: (courseId, progress) =>
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              progress,
              status: progress >= 100 ? CompletionStatus.COMPLETED : progress > 0 ? CompletionStatus.IN_PROGRESS : c.status,
            }
          : c
      ),
    })),

  completeModule: (courseId, moduleId) =>
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              modules: c.modules.map((m) =>
                m.id === moduleId ? { ...m, isCompleted: true, completionPercentage: 100 } : m
              ),
            }
          : c
      ),
    })),

  unlockModule: (courseId, moduleId) =>
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              modules: c.modules.map((m) => (m.id === moduleId ? { ...m, isLocked: false } : m)),
            }
          : c
      ),
    })),

  updateResourceProgress: (courseId, moduleId, resourceId, progress) => {
    // 1. Update local Zustand state for instant UI updates
    set((state) => {
      const updatedCourses = state.courses.map((c) => {
        if (c.id !== courseId) return c;

        const updatedModules = c.modules.map((m) => {
          if (m.id !== moduleId) return m;

          const updatedResources = m.resources.map((r) => {
            if (r.id !== resourceId) return r;
            return {
              ...r,
              progress,
              isCompleted: progress >= 100 || r.isCompleted,
            };
          });

          const completedResources = updatedResources.filter((r) => r.isCompleted).length;
          const completionPercentage = updatedResources.length > 0
            ? Math.round((completedResources / updatedResources.length) * 100)
            : 0;

          return {
            ...m,
            resources: updatedResources,
            isCompleted: completionPercentage === 100,
            completionPercentage,
          };
        });

        const totalModules = updatedModules.length;
        const overallProgress = totalModules > 0
          ? Math.round(updatedModules.reduce((sum, m) => sum + m.completionPercentage, 0) / totalModules)
          : 0;

        const isAllModulesCompleted = updatedModules.every((m) => m.isCompleted);

        return {
          ...c,
          modules: updatedModules,
          progress: overallProgress,
          status: overallProgress >= 100 ? CompletionStatus.COMPLETED : overallProgress > 0 ? CompletionStatus.IN_PROGRESS : c.status,
          assessment: c.assessment ? {
            ...c.assessment,
            isLocked: !isAllModulesCompleted,
          } : undefined,
        };
      });

      return { courses: updatedCourses };
    });

    // 2. Persist progress in the PostgreSQL database in the background
    const cleanCourseId = courseId.replace("AST-", "");
    const cleanModuleId = moduleId.replace("MOD-", "");
    const cleanResourceId = resourceId.replace("RES-", "");

    api.post(`/employee/courses/${cleanCourseId}/progress`, {
      moduleId: Number(cleanModuleId) || 0,
      sectionId: Number(cleanResourceId),
      progress
    }).catch(err => console.error("Failed to sync progress to database", err));
  },

  submitAssessmentPass: async (courseId, score, employeeName) => {
    const cleanCourseId = courseId.replace("AST-", "");
    try {
      const response = await api.post(`/employee/courses/${cleanCourseId}/assessment`, {
        score,
        employeeName
      });
      
      const data = response.data;
      
      set((state) => ({
        courses: state.courses.map((c) => {
          if (c.id !== courseId) return c;
          return {
            ...c,
            assessment: c.assessment ? {
              ...c.assessment,
              isPassed: data.isPassed,
              attemptsUsed: data.attemptsUsed,
              lastScore: data.score,
            } : undefined,
            certificate: data.certificate ? {
              id: String(data.certificate.id),
              courseId: String(data.certificate.courseId),
              courseName: data.certificate.courseName,
              employeeName: data.certificate.employeeName,
              employeeId: data.certificate.employeeId,
              completionDate: data.certificate.issuedAt,
              certificateNumber: data.certificate.certificateNumber,
              qrCodeData: data.certificate.qrCodeData,
              verificationUrl: data.certificate.verificationUrl,
              instructorName: c.instructor.name,
              instructorSignature: c.instructor.name,
            } : c.certificate,
          };
        })
      }));
    } catch (err) {
      console.error("Failed to submit assessment to database", err);
    }
  },

  getFilteredCourses: () => {
    const { courses, filters } = get();
    let filtered = [...courses];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.instructor.name.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search)
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter((c) => c.category === filters.category);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    if (filters.dueDate !== 'all') {
      const now = new Date();
      if (filters.dueDate === 'this_week') {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);
        filtered = filtered.filter((c) => {
          const due = new Date(c.dueDate);
          return due >= now && due <= weekEnd;
        });
      } else if (filters.dueDate === 'this_month') {
        const monthEnd = new Date(now);
        monthEnd.setMonth(now.getMonth() + 1);
        filtered = filtered.filter((c) => {
          const due = new Date(c.dueDate);
          return due >= now && due <= monthEnd;
        });
      }
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'assignedDate':
          comparison = new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
          break;
        case 'popularity':
          comparison = b.popularity - a.popularity;
          break;
        case 'progress':
          comparison = b.progress - a.progress;
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  },
}));

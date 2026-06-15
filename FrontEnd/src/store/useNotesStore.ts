import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LearningNote } from '@/features/learning-player/types';

interface NotesState {
  notes: LearningNote[];
  isDrawerOpen: boolean;
  searchQuery: string;
  sortBy: 'latest' | 'oldest';
  filterModuleId: string | null;
  
  setDrawerOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'latest' | 'oldest') => void;
  setFilterModuleId: (moduleId: string | null) => void;
  
  addNote: (note: LearningNote) => void;
  updateNote: (id: string, updates: Partial<LearningNote>) => void;
  deleteNote: (id: string) => void;
  setNotes: (notes: LearningNote[]) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      isDrawerOpen: false,
      searchQuery: '',
      sortBy: 'latest',
      filterModuleId: null,

      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setFilterModuleId: (moduleId) => set({ filterModuleId: moduleId }),

      addNote: (note) => set((state) => ({ 
        notes: [note, ...state.notes] 
      })),
      
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n))
      })),

      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id)
      })),

      setNotes: (notes) => set({ notes }),
    }),
    {
      name: 'learning-notes-storage',
    }
  )
);

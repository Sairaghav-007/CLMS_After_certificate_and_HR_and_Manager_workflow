import { useNotesStore } from '@/shared/store';
import type { LearningNote } from '../types';

export function useNotes(courseId: string) {
  const notes = useNotesStore(state => state.notes).filter(n => n.courseId === courseId);
  const addNote = useNotesStore(state => state.addNote);
  const updateNote = useNotesStore(state => state.updateNote);
  const deleteNote = useNotesStore(state => state.deleteNote);

  return {
    notes,
    isLoading: false,
    createNote: (note: LearningNote) => addNote(note),
    updateNote: ({ id, updates }: { id: string; updates: Partial<LearningNote> }) => updateNote(id, updates),
    deleteNote: ({ id }: { id: string; courseId: string }) => deleteNote(id),
    isCreating: false,
    isUpdating: false,
    isDeleting: false
  };
}

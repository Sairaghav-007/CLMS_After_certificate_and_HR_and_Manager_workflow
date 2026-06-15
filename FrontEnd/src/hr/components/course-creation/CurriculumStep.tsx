import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import { Plus, Layout } from 'lucide-react';
import { ModuleItem } from './ModuleItem';
import { motion, AnimatePresence } from 'framer-motion';

interface CurriculumStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const CurriculumStep: React.FC<CurriculumStepProps> = ({ onNext, onBack }) => {
  const { currentCourse, addModule, reorderModules } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentCourse.modules!.findIndex((m) => m.id === active.id);
      const newIndex = currentCourse.modules!.findIndex((m) => m.id === over.id);
      reorderModules(arrayMove(currentCourse.modules!, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Course Curriculum</h3>
          <p className={cn(
            "text-sm mt-1",
            isDark ? "text-surface-400" : "text-surface-500"
          )}>
            Organize your course into modules and sessions.
          </p>
        </div>
        <button
          onClick={() => addModule({ title: 'New Module' })}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Module
        </button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={currentCourse.modules?.map(m => m.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            <AnimatePresence>
              {currentCourse.modules?.map((module, index) => (
                <ModuleItem key={module.id} module={module} index={index} />
              ))}
            </AnimatePresence>

            {(!currentCourse.modules || currentCourse.modules.length === 0) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center",
                  isDark ? "bg-surface-900 border-surface-800" : "bg-surface-50 border-surface-200"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                  isDark ? "bg-surface-800" : "bg-white shadow-sm"
                )}>
                  <Layout className="w-8 h-8 text-primary-500" />
                </div>
                <h4 className="text-lg font-bold">No modules yet</h4>
                <p className={cn(
                  "text-sm max-w-xs mt-1",
                  isDark ? "text-surface-400" : "text-surface-500"
                )}>
                  Start building your course structure by adding your first module.
                </p>
                <button
                  onClick={() => addModule({ title: 'New Module' })}
                  className="mt-6 px-6 py-2 rounded-xl border border-primary-500 text-primary-500 font-bold hover:bg-primary-500 hover:text-white transition-all underline-offset-4"
                >
                  Create First Module
                </button>
              </motion.div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};


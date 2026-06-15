import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import type { Module, Session } from '@/hr/types/course';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import { 
  GripVertical, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Clock
} from 'lucide-react';
import { SessionItem } from './SessionItem';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleItemProps {
  module: Module;
  index: number;
}

export const ModuleItem: React.FC<ModuleItemProps> = ({ module, index }) => {
  const { updateModule, deleteModule, addSession, reorderSessions } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = module.sessions.findIndex((s) => s.id === active.id);
      const newIndex = module.sessions.findIndex((s) => s.id === over.id);
      reorderSessions(module.id, arrayMove(module.sessions, oldIndex, newIndex));
    }
  };

  const totalDuration = module.sessions.reduce((acc, s) => acc + s.duration, 0);
  const formattedDuration = `${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s`;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group rounded-2xl border transition-all overflow-hidden",
        isDark ? "bg-surface-900 border-surface-800" : "bg-white border-surface-200 shadow-sm",
        isDragging && "border-primary-500 ring-4 ring-primary-500/10 shadow-2xl"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center gap-4 px-4 py-4",
        isDark ? "bg-surface-900/50" : "bg-surface-50/50"
      )}>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
          <GripVertical className="w-5 h-5 text-surface-400" />
        </div>

        <div className="flex-1">
          {isEditingTitle ? (
            <input
              autoFocus
              className={cn(
                "w-full bg-transparent text-lg font-bold border-b border-primary-500 focus:outline-none",
                isDark ? "text-white" : "text-surface-900"
              )}
              value={module.title}
              onChange={(e) => updateModule(module.id, { title: e.target.value })}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Module {index + 1}
              </span>
              <h4 
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-bold cursor-text hover:text-primary-500 transition-colors"
              >
                {module.title || 'Untitled Module'}
              </h4>
            </div>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formattedDuration}
            </span>
            <span>•</span>
            <span>{module.sessions.length} sessions</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <div className="relative group/menu">
            <button className="p-2 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors text-red-500" onClick={() => deleteModule(module.id)}>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 space-y-3">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={module.sessions.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {module.sessions.map((session, sIndex) => (
                      <SessionItem 
                        key={session.id} 
                        session={session} 
                        moduleId={module.id}
                        index={sIndex} 
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button
                onClick={() => addSession(module.id, { title: 'New Session', type: 'Video' })}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed transition-all font-bold",
                  isDark 
                    ? "bg-surface-800/10 border-surface-800 hover:bg-surface-800/30 text-surface-400" 
                    : "bg-surface-50 border-surface-200 hover:bg-surface-100 text-surface-500"
                )}
              >
                <Plus className="w-5 h-5" />
                Add Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


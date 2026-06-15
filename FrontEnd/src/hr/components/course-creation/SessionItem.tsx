import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Session, SessionType } from '@/hr/types/course';
import { useCourseStore } from '@/hr/store/useCourseStore';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';
import { 
  GripVertical, 
  Trash2, 
  Video, 
  FileText, 
  Presentation, 
  Settings,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionForm } from './SessionForm';

interface SessionItemProps {
  session: Session;
  moduleId: string;
  index: number;
}

export const SessionItem: React.FC<SessionItemProps> = ({ session, moduleId, index }) => {
  const { deleteSession } = useCourseStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  const getIcon = (type: SessionType) => {
    switch (type) {
      case 'Video': return <Video className="w-4 h-4" />;
      case 'PDF': return <FileText className="w-4 h-4" />;
      case 'PPT': return <Presentation className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: SessionType) => {
    switch (type) {
      case 'Video': return 'text-blue-500 bg-blue-500/10';
      case 'PDF': return 'text-red-500 bg-red-500/10';
      case 'PPT': return 'text-orange-500 bg-orange-500/10';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="z-10">
      <div className={cn(
        "group rounded-xl border transition-all overflow-hidden",
        isDark ? "bg-surface-800 border-surface-700 hover:border-surface-600" : "bg-white border-surface-200 hover:border-surface-300 shadow-sm",
        isDragging && "ring-2 ring-primary-500 shadow-lg"
      )}>
        <div className="flex items-center gap-3 px-3 py-3">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
            <GripVertical className="w-4 h-4 text-surface-400" />
          </div>

          <div className={cn(
            "p-2 rounded-lg flex-shrink-0",
            getTypeColor(session.type)
          )}>
            {getIcon(session.type)}
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-sm truncate">{session.title || 'Untitled Session'}</h5>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">
                {session.type}
              </span>
              <span className="text-[10px] text-surface-400">•</span>
              <span className="text-[10px] text-surface-400">
                {Math.floor(session.duration / 60)}m {session.duration % 60}s
              </span>
              {(session.videoUrl || session.pdfUrl || session.pptUrl) && (
                <>
                  <span className="text-[10px] text-surface-400">•</span>
                  <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    File Linked
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isEditing ? "bg-primary-500 text-white" : "hover:bg-surface-100 dark:hover:bg-surface-700"
              )}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteSession(moduleId, session.id)}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "border-t p-4",
                isDark ? "border-surface-700 bg-surface-900/30" : "border-surface-100 bg-surface-50/50"
              )}
            >
              <SessionForm 
                session={session} 
                moduleId={moduleId} 
                onClose={() => setIsEditing(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};


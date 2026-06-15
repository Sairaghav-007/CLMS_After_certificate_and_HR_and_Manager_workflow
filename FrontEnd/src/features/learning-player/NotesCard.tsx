import { Pin, Trash2, Edit3, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils';
import type { LearningNote } from './types';

interface NotesCardProps {
  note: LearningNote;
  onSeek: (time: number) => void;
  onPin: (note: LearningNote) => void;
  onEdit: (note: LearningNote) => void;
  onDelete: (id: string) => void;
}

export function NotesCard({ 
  note, 
  onSeek, 
  onPin, 
  onEdit, 
  onDelete 
}: NotesCardProps) {
  const formatTimestamp = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <motion.div 
      layout
      transition={{ duration: 0.2 }}
      className={cn(
        "group bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/[0.07] text-left",
        note.pinned && "border-primary-500/30 bg-primary-950/10"
      )}
    >
      <div className="p-4 space-y-4">
        {/* Top Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSeek(note.timestamp)}
              className="flex items-center gap-2 px-2.5 py-1 bg-primary-600/20 text-primary-400 rounded-lg text-[10px] font-bold hover:bg-primary-600 hover:text-white transition-all cursor-pointer"
            >
              <Clock size={12} />
              {formatTimestamp(note.timestamp)}
            </button>
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest truncate max-w-[150px]">
              {note.moduleName}
            </span>
          </div>
          
          <button 
            onClick={() => onPin(note)}
            className={cn(
              "p-1.5 rounded-lg transition-colors hover:bg-white/10 cursor-pointer",
              note.pinned ? "text-primary-400" : "text-white/20 group-hover:text-white/40"
            )}
            title={note.pinned ? "Unpin note" : "Pin note"}
          >
            <Pin size={16} className={cn(note.pinned && "fill-current")} />
          </button>
        </div>

        {/* Middle Section: Note Content */}
        <div 
          className="text-sm text-white/85 leading-relaxed rich-text-content prose prose-invert prose-sm max-w-none break-words"
          dangerouslySetInnerHTML={{ __html: note.note }}
        />

        {/* Bottom Section */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="text-[10px] text-white/30 font-medium">
            Created: {formatDate(note.createdAt)}
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onEdit(note)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[10px] font-bold text-white/40 hover:text-white transition-all uppercase tracking-wider cursor-pointer"
            >
              <Edit3 size={12} />
              Edit
            </button>
            <button 
              onClick={() => onDelete(note.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-danger-500/20 text-[10px] font-bold text-white/40 hover:text-danger-400 transition-all uppercase tracking-wider cursor-pointer"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

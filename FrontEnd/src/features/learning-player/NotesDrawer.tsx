import { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Clock, 
  Layout,
  ArrowUpDown,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useNotesStore } from '@/shared/store';
import { useNotes } from './hooks/useNotes';
import { useAuthStore } from '@/shared/store';
import { NotesCard } from './NotesCard';
import type { LearningNote } from './types';

interface NotesDrawerProps {
  courseId: string;
  moduleId: string;
  resourceId: string;
  courseName: string;
  moduleName: string;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function NotesDrawer({ 
  courseId, 
  moduleId, 
  resourceId, 
  courseName, 
  moduleName, 
  currentTime, 
  onSeek 
}: NotesDrawerProps) {
  const { 
    isDrawerOpen, 
    setDrawerOpen, 
    searchQuery, 
    setSearchQuery,
    sortBy,
    setSortBy
  } = useNotesStore();

  const user = useAuthStore(state => state.user);
  const { notes, createNote, updateNote, deleteNote } = useNotes(courseId);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [noteText, setNoteText] = useState('');

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => 
      n.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.moduleName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Initial Sort: Newest vs Oldest
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortBy === 'latest' ? timeB - timeA : timeA - timeB;
    });

    // Pinned Notes Rule: Pinned always on top
    const pinned = result.filter(n => n.pinned);
    const unpinned = result.filter(n => !n.pinned);
    
    return [...pinned, ...unpinned];
  }, [notes, searchQuery, sortBy]);

  const handleSaveNote = () => {
    if (!noteText.trim()) return;

    // Convert newlines to html breaks for rendering
    const formattedNoteContent = noteText.replace(/\n/g, '<br />');
    
    if (editingId) {
      updateNote({ id: editingId, updates: { note: formattedNoteContent, courseId } });
      setEditingId(null);
    } else {
      const newNote: LearningNote = {
        id: `NOTE-${Date.now()}`,
        courseId,
        moduleId,
        resourceId,
        courseName,
        moduleName,
        timestamp: currentTime,
        note: formattedNoteContent,
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createNote(newNote);
    }

    setNoteText('');
    setIsAdding(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleEditInternal = (note: LearningNote) => {
    setEditingId(note.id);
    setIsAdding(true);
    setNoteText(note.note.replace(/<br\s*\/?>/gi, '\n'));
  };

  const formatTimestamp = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text('Course Learning Notes', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Course: ${courseName}`, 20, 35);
    doc.text(`Employee: ${user?.fullName || 'Anonymous User'}`, 20, 42);
    doc.text(`Exported On: ${new Date().toLocaleDateString('en-GB')}`, 20, 49);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 55, pageWidth - 20, 55);

    // Notes Data for AutoTable
    const tableData = filteredNotes.map((note) => [
      `Timestamp: ${formatTimestamp(note.timestamp)}\nModule: ${note.moduleName}\nCreated: ${new Date(note.createdAt).toLocaleDateString()}\nPinned: ${note.pinned ? 'Yes' : 'No'}`,
      note.note.replace(/<br\s*\/?>/gi, '\n') // strip html breaks back to newlines for PDF
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Metadata', 'Note Content']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 'auto' }
      },
      didDrawPage: () => {
        // Footer
        doc.setFontSize(8);
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 25, doc.internal.pageSize.getHeight() - 10);
      }
    });

    doc.save(`${courseName.replace(/\s+/g, '-')}-Learning-Notes.pdf`);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Drawer Container */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-900 border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface-950/50">
              <div className="text-left">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layout size={20} className="text-primary-500" />
                  Learning Notes
                </h2>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">
                  Private & Syncing Automatically
                </p>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* List Controls */}
            <div className="p-4 bg-surface-900/50 border-b border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="text"
                    placeholder="Search notes or modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary-500/50 transition-colors"
                  />
                </div>
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all uppercase tracking-wider cursor-pointer"
                  title="Export to PDF"
                >
                  <FileText size={16} />
                  PDF
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSortBy(sortBy === 'latest' ? 'oldest' : 'latest')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-white/60 hover:text-white transition-colors uppercase cursor-pointer"
                  >
                    <ArrowUpDown size={12} />
                    {sortBy === 'latest' ? 'Sort: Newest' : 'Sort: Oldest'}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showSaved && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-success-400 text-[10px] font-bold uppercase"
                    >
                      <CheckCircle2 size={12} />
                      Saved
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Notes Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-surface-950/20">
              {/* Editor Section */}
              <AnimatePresence>
                {isAdding ? (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-white/[0.03] border border-primary-500/30 rounded-2xl p-4 space-y-4 overflow-hidden text-left"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                       <div className="flex items-center gap-2 text-primary-400 uppercase tracking-widest">
                         <Clock size={12} />
                         Stamp: {formatTimestamp(currentTime)}
                       </div>
                       <button onClick={() => setIsAdding(false)} className="text-white/25 hover:text-white cursor-pointer">Cancel</button>
                    </div>
                    
                    {/* Simplified textarea editor replacing tiptap */}
                    <textarea 
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Type your learning note here..."
                      className="w-full focus:outline-none min-h-[100px] p-4 bg-white/5 rounded-xl border border-white/10 text-white/90 text-sm placeholder:text-white/20 resize-none focus:border-primary-500/40"
                    />

                    <button 
                      onClick={handleSaveNote}
                      className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-500 transition-colors cursor-pointer"
                    >
                       {editingId ? 'Update Note' : 'Add Note'}
                    </button>
                  </motion.div>
                ) : (
                  <button 
                    onClick={() => {
                      setIsAdding(true);
                      setEditingId(null);
                      setNoteText('');
                    }}
                    className="w-full py-6 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/5 transition-all group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus size={20} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Capture a learning note</span>
                    <span className="text-[10px] opacity-40">at {formatTimestamp(currentTime)}</span>
                  </button>
                )}
              </AnimatePresence>

              {/* Notes List */}
              <div className="space-y-4 pb-12">
                {filteredNotes.map((note) => (
                  <NotesCard 
                    key={note.id}
                    note={note}
                    onSeek={onSeek}
                    onPin={(n) => updateNote({ id: n.id, updates: { pinned: !n.pinned, courseId } })}
                    onEdit={handleEditInternal}
                    onDelete={(id) => deleteNote({ id, courseId })}
                  />
                ))}
                
                {filteredNotes.length === 0 && !isAdding && (
                  <div className="py-20 flex flex-col items-center justify-center text-center px-8">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Layout size={32} className="text-white/10" />
                     </div>
                     <p className="text-white/40 text-sm font-medium">No notes found for this course.</p>
                     <p className="text-white/20 text-xs mt-1">Start by capturing a thought during the video.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

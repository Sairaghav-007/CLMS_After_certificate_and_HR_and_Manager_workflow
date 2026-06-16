import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Play, FileText, Presentation, CheckCircle2, XCircle,
  BookOpen, ChevronDown, ChevronRight, Loader2, ThumbsUp, MessageSquare,
  Send, X, AlertCircle, Shield, Eye, Clock, Layers, BarChart3
} from 'lucide-react';
import { api } from '@/api/client';
import { useUIStore } from '@/shared/store';

type ReviewPriority = 'Low' | 'Medium' | 'High';

interface Section {
  id: string;
  title: string;
  materialType: string;
  materialUrl: string;
  sectionOrder: number;
  duration: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  sections: Section[];
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdBy: string;
  thumbnail: string;
  passingScore: number;
  maxAttempts: number;
  duration: number;
  department: string;
  modules: Module[];
}

export default function ManagerCourseReviewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackPriority, setFeedbackPriority] = useState<ReviewPriority>('Medium');
  const [submitting, setSubmitting] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await api.get(`/manager/course-detail/${courseId}`);
      const data = res.data;
      setCourse(data);
      // Auto-select first module/section
      if (data.modules?.length > 0) {
        const firstMod = data.modules[0];
        setActiveModule(firstMod);
        setExpandedModules(new Set([firstMod.id]));
        if (firstMod.sections?.length > 0) {
          setActiveSection(firstMod.sections[0]);
        }
      }
    } catch (e) {
      setError('Failed to load course content for review.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleApprove = async () => {
    if (!courseId) return;
    setSubmitting(true);
    try {
      await api.post(`/manager/reviews/${courseId}/approve`);
      addToast({ type: 'success', title: 'Course Approved', message: 'Course is now ready to publish.' });
      navigate('/manager/review-courses');
    } catch {
      addToast({ type: 'error', title: 'Approval Failed', message: 'Could not approve this course.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!courseId || !feedbackTitle || !feedbackComments) return;
    setSubmitting(true);
    try {
      await api.post(`/manager/reviews/${courseId}/reject`, {
        changeTitle: feedbackTitle,
        comments: feedbackComments,
        priority: feedbackPriority,
      });
      addToast({ type: 'success', title: 'Feedback Sent', message: 'HR has been notified of required changes.' });
      navigate('/manager/review-courses');
    } catch {
      addToast({ type: 'error', title: 'Failed', message: 'Could not send feedback.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const typeIcon = (type: string) => {
    if (type === 'VIDEO') return <Play className="w-3.5 h-3.5 text-blue-500" />;
    if (type === 'PDF') return <FileText className="w-3.5 h-3.5 text-red-500" />;
    if (type === 'PPT') return <Presentation className="w-3.5 h-3.5 text-orange-500" />;
    return <BookOpen className="w-3.5 h-3.5 text-surface-400" />;
  };

  // ─── Loading / Error ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-surface-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="text-surface-500 font-semibold text-sm">Loading course content for review...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-danger-500" />
        <p className="text-surface-700 font-bold">{error || 'Course not found.'}</p>
        <button onClick={() => navigate('/manager/review-courses')} className="text-primary-600 font-bold text-sm">
          ← Back to Review Queue
        </button>
      </div>
    );
  }

  // ─── Content Renderer ─────────────────────────────────────────────────────
  const renderContent = () => {
    if (!activeSection) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-surface-400 gap-4">
          <Eye className="w-14 h-14 text-surface-200" />
          <p className="font-semibold text-sm">Select a section from the sidebar to preview</p>
        </div>
      );
    }

    const type = activeSection.materialType;
    const url = activeSection.materialUrl;

    if (type === 'VIDEO') {
      return (
        <div className="flex-1 flex flex-col">
          <div className="relative bg-black aspect-video w-full flex-shrink-0">
            <video
              key={url}
              src={url}
              controls
              controlsList="nodownload"
              className="w-full h-full"
            >
              Your browser does not support video playback.
            </video>
          </div>
          <div className="p-4 border-t border-surface-200 bg-white">
            <p className="font-bold text-surface-900 text-sm">{activeSection.title}</p>
            <p className="text-[11px] text-surface-400 mt-1 flex items-center gap-1">
              <Play className="w-3 h-3" /> Video · {activeSection.duration ? Math.round(activeSection.duration / 60) : '?'} min
            </p>
          </div>
        </div>
      );
    }

    if (type === 'PDF') {
      return (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-surface-100">
            <iframe
              key={url}
              src={url}
              className="w-full h-full min-h-[60vh]"
              title={activeSection.title}
            />
          </div>
          <div className="p-4 border-t border-surface-200 bg-white">
            <p className="font-bold text-surface-900 text-sm">{activeSection.title}</p>
            <p className="text-[11px] text-surface-400 mt-1 flex items-center gap-1">
              <FileText className="w-3 h-3" /> PDF Document
            </p>
          </div>
        </div>
      );
    }

    if (type === 'PPT') {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
      return (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-surface-100">
            <iframe
              key={url}
              src={googleViewerUrl}
              className="w-full h-full min-h-[60vh]"
              title={activeSection.title}
            />
          </div>
          <div className="p-4 border-t border-surface-200 bg-white">
            <p className="font-bold text-surface-900 text-sm">{activeSection.title}</p>
            <p className="text-[11px] text-surface-400 mt-1 flex items-center gap-1">
              <Presentation className="w-3 h-3" /> PowerPoint Presentation
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-surface-400 p-8">
        <BookOpen className="w-12 h-12 text-surface-200" />
        <p className="font-semibold text-sm text-center">No preview available for this content type.</p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 font-bold text-sm underline">
            Open file externally →
          </a>
        )}
      </div>
    );
  };

  // ─── Main Layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-50">
      {/* Top Bar */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 bg-white border-b border-surface-200 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager/review-courses')}
            className="flex items-center gap-1.5 text-sm font-bold text-surface-500 hover:text-primary-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-5 w-px bg-surface-200" />
          <div>
            <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest leading-none">Manager Review</p>
            <h1 className="text-sm font-bold text-surface-900 truncate max-w-xs">{course.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-4 mr-4 text-[11px] text-surface-500 font-semibold">
            <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{course.modules.length} modules</span>
            <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" />Min {course.passingScore}% to pass</span>
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" />{course.department || 'All Depts'}</span>
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-danger-50 text-danger-600 border border-danger-200/60 text-xs font-bold hover:bg-danger-100 transition-all"
          >
            <XCircle className="w-3.5 h-3.5" />
            Request Changes
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success-600 text-white text-xs font-bold shadow-md shadow-success-500/20 hover:bg-success-700 transition-all disabled:opacity-50"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Approve Course
          </button>
        </div>
      </header>

      {/* Body: Sidebar + Player */}
      <div className="flex flex-1 overflow-hidden">
        {/* Course Outline Sidebar */}
        <aside className="w-72 flex-shrink-0 bg-white border-r border-surface-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-surface-100">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5" />
              Course Curriculum
            </p>
            <p className="text-xs text-surface-500 mt-1">
              {course.modules.reduce((acc, m) => acc + m.sections.length, 0)} sections across {course.modules.length} modules
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {course.modules.map((mod, mIdx) => (
              <div key={mod.id} className="border-b border-surface-100 last:border-0">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-lg bg-primary-600 text-white flex items-center justify-center text-[9px] font-black flex-shrink-0">
                      {mIdx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-surface-800 truncate group-hover:text-primary-600 transition-colors">
                      {mod.title}
                    </span>
                  </div>
                  {expandedModules.has(mod.id)
                    ? <ChevronDown className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                  }
                </button>
                <AnimatePresence>
                  {expandedModules.has(mod.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {mod.sections.map((sec) => (
                        <button
                          key={sec.id}
                          onClick={() => { setActiveModule(mod); setActiveSection(sec); }}
                          className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left transition-colors ${
                            activeSection?.id === sec.id
                              ? 'bg-primary-50 border-r-2 border-primary-500'
                              : 'hover:bg-surface-50'
                          }`}
                        >
                          {typeIcon(sec.materialType)}
                          <span className={`text-[11px] font-semibold truncate ${activeSection?.id === sec.id ? 'text-primary-700' : 'text-surface-600'}`}>
                            {sec.title}
                          </span>
                          {sec.duration > 0 && (
                            <span className="ml-auto text-[9px] text-surface-400 font-bold flex-shrink-0 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {Math.round(sec.duration / 60)}m
                            </span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Viewer */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-surface-50">
          {renderContent()}
        </main>
      </div>

      {/* Request Changes Modal */}
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl border border-surface-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-surface-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-danger-500" />
                  Request Changes from HR
                </h3>
                <button onClick={() => setShowFeedback(false)} className="p-2 rounded-xl text-surface-400 hover:bg-surface-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-surface-400 block mb-1.5">Issue Subject</label>
                  <input
                    type="text"
                    value={feedbackTitle}
                    onChange={(e) => setFeedbackTitle(e.target.value)}
                    placeholder="e.g. Broken video in Module 2"
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-surface-50 font-semibold focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-surface-400 block mb-1.5">Detailed Feedback</label>
                  <textarea
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="Describe what needs to be changed for HR..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm bg-surface-50 font-medium resize-none focus:ring-2 focus:ring-primary-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-surface-400 block mb-2">Priority Level</label>
                  <div className="flex gap-2">
                    {(['Low', 'Medium', 'High'] as ReviewPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFeedbackPriority(p)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          feedbackPriority === p
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
                            : 'bg-surface-50 text-surface-600 border-surface-200 hover:border-primary-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 py-3 rounded-xl bg-surface-100 text-surface-700 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendFeedback}
                  disabled={!feedbackTitle || !feedbackComments || submitting}
                  className="flex-1 py-3 rounded-xl bg-danger-600 text-white font-bold text-sm shadow-lg shadow-danger-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

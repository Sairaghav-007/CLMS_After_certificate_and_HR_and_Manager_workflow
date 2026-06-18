import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, CheckCircle2, XCircle, Clock, AlertCircle, 
  FileText, Play, FileDigit, Settings,
  ThumbsUp, MessageSquare, Send, Eye
} from 'lucide-react';
import { PageHeader, StatusBadge, Tabs, Modal, ProgressBar } from '../components/ui';
import { api } from '@/api/client';
import { useUIStore } from '@/shared/store';

type ReviewStatus = 'Submitted' | 'On Review' | 'Need Changes' | 'Ready To Publish';
type ReviewPriority = 'Low' | 'Medium' | 'High';

export default function ReviewCoursesPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReviewStatus>('Submitted');
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  
  // Feedback Form State
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackPriority, setFeedbackPriority] = useState<ReviewPriority>('Medium');

  const addToast = useUIStore((s) => s.addToast);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/manager/reviews');
      // Backend already normalizes PENDING_MANAGER_REVIEW → 'Submitted For Review'
      // and REJECTED → 'Need Changes'. Map to local ReviewStatus.
      const normalized = res.data.map((r: any) => {
        let normalizedStatus: ReviewStatus = 'Submitted';
        const st = (r.status || '').toUpperCase();
        if (st === 'PENDING_MANAGER_REVIEW' || st === 'SUBMITTED FOR REVIEW') normalizedStatus = 'Submitted';
        else if (st === 'ON_REVIEW') normalizedStatus = 'On Review';
        else if (st === 'REJECTED' || st === 'NEED CHANGES') normalizedStatus = 'Need Changes';
        else if (st === 'READY_TO_PUBLISH') normalizedStatus = 'Ready To Publish';
        return { ...r, status: normalizedStatus };
      });
      // Deduplicate by courseId (guards against StrictMode double-render)
      const seen = new Set<string>();
      const deduped = normalized.filter((r: any) => {
        if (seen.has(r.courseId)) return false;
        seen.add(r.courseId);
        return true;
      });
      setReviews(deduped);
    } catch (error) {
      console.error("Failed to load course reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();

    // SSE — refresh when HR submits a course or another manager acts
    const es = new EventSource('http://localhost:8080/api/manager/dashboard/events');
    es.addEventListener('course_review', () => {
      console.log('[SSE] Manager ReviewCoursesPage: course_review event, refreshing...');
      fetchReviews();
    });
    es.addEventListener('course_update', () => {
      console.log('[SSE] Manager ReviewCoursesPage: course_update event, refreshing...');
      fetchReviews();
    });
    es.onerror = () => {}; // silent — non-blocking

    // Polling backup
    const interval = setInterval(() => {
      fetchReviews();
    }, 15000);

    return () => {
      es.close();
      clearInterval(interval);
    };
  }, []);

  const filteredReviews = useMemo(() => 
    reviews.filter(r => r.status === activeTab),
  [reviews, activeTab]);

  const handleApprove = async (review: any) => {
    try {
      await api.post(`/manager/reviews/${review.courseId}/approve`);
      addToast({ type: 'success', title: 'Course Approved', message: `Successfully updated ${review.courseName} status.` });
      setSelectedReview(null);
      fetchReviews();
    } catch (error) {
      addToast({ type: 'error', title: 'Approval Failed', message: 'Could not approve course.' });
    }
  };

  const handleSendChanges = async () => {
    if (!selectedReview) return;
    try {
      await api.post(`/manager/reviews/${selectedReview.courseId}/reject`, {
        changeTitle: feedbackTitle,
        comments: feedbackComments,
        priority: feedbackPriority
      });
      addToast({ type: 'success', title: 'Feedback Sent', message: `Change request dispatched for ${selectedReview.courseName}.` });
      
      // Reset Form
      setSelectedReview(null);
      setFeedbackTitle('');
      setFeedbackComments('');
      fetchReviews();
    } catch (error) {
      addToast({ type: 'error', title: 'Request Failed', message: 'Could not log change requests.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 font-semibold text-surface-500">Loading Reviews...</span>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto text-left space-y-6">
      <PageHeader
        title="Review Courses"
        subtitle="Approve new curriculum content or provide feedback for refinements"
      />

      <div className="flex items-center justify-between">
        <Tabs
          tabs={['Submitted', 'On Review', 'Need Changes', 'Ready To Publish']}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as ReviewStatus)}
        />
        <div className="text-xs font-bold text-surface-500 uppercase tracking-widest bg-surface-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          Awaiting Action: {reviews.filter(r => r.status === 'Submitted' || r.status === 'On Review').length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredReviews.map((review, i) => (
            <motion.div
              key={review.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-surface-200 shadow-sm rounded-2xl p-5 hover:shadow-xl transition-shadow"
              onClick={() => setSelectedReview(review)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                  <BookOpen className="w-5 h-5" />
                </div>
                <StatusBadge status={review.status === 'Submitted' ? 'Submitted For Review' : review.status} />
              </div>
              <h3 className="text-base font-bold text-surface-900 mb-1 line-clamp-1">{review.courseName}</h3>
              <p className="text-xs text-surface-500 mb-4">Author: {review.authorName}</p>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-surface-400 tracking-wider">
                  <span>Review Progress</span>
                  <span>{review.status === 'Submitted' ? '0%' : review.status === 'On Review' ? '50%' : '100%'}</span>
                </div>
                <ProgressBar value={review.status === 'Submitted' ? 0 : review.status === 'On Review' ? 50 : 100} showLabel={false} />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-surface-500">
                    <Play className="w-3 h-3" /> {review.videos}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-surface-500">
                    <FileText className="w-3 h-3" /> {review.pdfs}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/manager/review-courses/${review.courseId}`);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 border border-primary-200/60 text-[10px] font-black uppercase tracking-wider hover:bg-primary-100 transition-all"
                >
                  <Eye className="w-3 h-3" />
                  Review Content
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-24 bg-white border-dashed border-2 border-surface-200 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-surface-700">In-box Clear</h3>
          <p className="text-sm text-surface-500">No courses in the "{activeTab}" state require your attention.</p>
        </div>
      )}

      {/* Review Dialog */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Review Curriculum Detail"
        size="lg"
      >
        {selectedReview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: BookOpen, label: 'Modules', value: selectedReview.modules },
                { icon: Clock, label: 'Sessions', value: selectedReview.sessions },
                { icon: Play, label: 'Videos', value: selectedReview.videos },
                { icon: FileText, label: 'PDFs', value: selectedReview.pdfs },
                { icon: FileDigit, label: 'PPTs', value: selectedReview.ppts },
                { icon: Settings, label: 'Passing Score', value: `${selectedReview.passingScore}%` },
                { icon: CheckCircle2, label: 'Metadata', value: selectedReview.metadata ? 'Validated' : 'Missing' },
                { icon: AlertCircle, label: 'Course ID', value: selectedReview.courseId },
              ].map(stat => (
                <div key={stat.label} className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                  <stat.icon className="w-4 h-4 text-primary-500 mb-1" />
                  <p className="text-[10px] text-surface-500 uppercase font-bold tracking-tight">{stat.label}</p>
                  <p className="text-xs font-bold text-surface-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-500" />
                Review Decision
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleApprove(selectedReview)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-success-600 text-white font-bold text-sm shadow-lg shadow-success-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {selectedReview.status === 'Submitted' ? 'Mark as Reviewing' : 'Approve for Publishing'}
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackTitle("Review Revision Needed");
                      setFeedbackComments("Please adjust visual presentation and check quiz scores mapping.");
                      addToast({ type: 'info', title: 'Form Filled', message: 'You can now customize feedback below.' });
                    }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-danger-600 text-white font-bold text-sm shadow-lg shadow-danger-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Submission
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-200 space-y-4">
              <h4 className="text-sm font-bold text-surface-900">Request Changes</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Subject of change (e.g., Update Branding)"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-50 border border-surface-200 text-xs focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
                <textarea
                  placeholder="Detailed feedback for the author..."
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  className="w-full h-32 px-4 py-3 rounded-xl bg-surface-50 border border-surface-200 text-xs focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {(['Low', 'Medium', 'High'] as ReviewPriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFeedbackPriority(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          feedbackPriority === p
                            ? 'bg-primary-500 text-white'
                            : 'bg-surface-100 text-surface-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSendChanges}
                    disabled={!feedbackTitle || !feedbackComments}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertTriangle, Clock, Search, History, CheckCircle2 } from 'lucide-react';
import { PageHeader, StatusBadge, Modal } from '../components/ui';
import { mockNudgeTemplates } from '../data/mockData';
import { useAuditStore } from '../stores';
import type { NudgeMode, NudgeChannel, NudgeTemplate } from '../types';
import { api } from '@/api/client';
import toast from 'react-hot-toast';

export default function NudgeEmployeesPage() {
  const [filterCategory, setFilterCategory] = useState('Individual');
  const [search, setSearch] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NudgeTemplate | null>(null);
  const [nudgeMode, setNudgeMode] = useState<NudgeMode>('Reminder');
  const [nudgeChannel, setNudgeChannel] = useState<NudgeChannel>('Email');
  const [customMessage, setCustomMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [viewHistory, setViewHistory] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [nudgeHistory, setNudgeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const addLog = useAuditStore(s => s.addLog);

  const fetchData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const [empRes, courseRes, historyRes] = await Promise.all([
        api.get('/manager/dashboard/activity'),
        api.get('/employee/courses'),
        api.get('/manager/nudge/history')
      ]);
      setEmployees(empRes.data);
      setCourses(courseRes.data);
      setNudgeHistory(historyRes.data);
      if (courseRes.data.length > 0) {
        setSelectedCourseId(prev => prev || String(courseRes.data[0].id));
      }
    } catch (err) {
      console.error("Failed to load nudge page data:", err);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => {
      fetchData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const term = search.toLowerCase();
      const matchSearch = !term || emp.name.toLowerCase().includes(term) || String(emp.id).toLowerCase().includes(term);
      const matchFilter = filterCategory === 'Individual' || emp.department === filterCategory;
      const isAtRiskOrOverdue = emp.status === 'Non-Compliant' || emp.status === 'At Risk';
      return matchSearch && matchFilter && isAtRiskOrOverdue;
    });
  }, [employees, search, filterCategory]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(e => String(e.id)));
    }
  };

  const handleSendNudge = async () => {
    if (selectedEmployees.length === 0 || !selectedTemplate || !selectedCourseId) {
      toast.error("Please select employees, a nudge template, and a course.");
      return;
    }

    try {
      const message = customMessage || selectedTemplate.message;
      for (const empId of selectedEmployees) {
        await api.post('/manager/nudge', {
          employeeId: parseInt(empId),
          courseId: parseInt(selectedCourseId),
          message
        });
      }

      toast.success(`Nudge alerts sent successfully to ${selectedEmployees.length} employees!`);

      addLog({ 
        action: 'Reminder Sent', 
        user: 'Sarah Mitchell', 
        details: `Sent ${nudgeMode} to ${selectedEmployees.length} employees via ${nudgeChannel}` 
      });

      // Refetch history
      const historyRes = await api.get('/manager/nudge/history');
      setNudgeHistory(historyRes.data);

      // Reset
      setSelectedEmployees([]);
      setSelectedTemplate(null);
      setCustomMessage('');
      setShowConfirmModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send nudge alerts.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 font-semibold text-surface-500">Loading Nudge Panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nudge Employees"
        subtitle="Send proactive reminders and compliance alerts to your team"
        actions={
          <button
            onClick={() => setViewHistory(!viewHistory)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-white hover:bg-surface-200 dark:hover:bg-surface-700 transition-all font-medium text-sm"
          >
            {viewHistory ? <Send className="w-4 h-4" /> : <History className="w-4 h-4" />}
            {viewHistory ? 'Send Nudges' : 'Audit Logs'}
          </button>
        }
      />

      <AnimatePresence mode="wait">
        {viewHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
              <h3 className="font-bold text-surface-900 dark:text-white">Nudge History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-800/50">
                    {['Date', 'Recipient', 'Course Name', 'Message Action'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nudgeHistory.map((nudge) => (
                    <tr key={nudge.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="px-5 py-4 text-xs text-surface-600 dark:text-surface-300">
                        {new Date(nudge.sentAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-surface-900 dark:text-white">
                        {nudge.employeeName || 'Employee'}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-surface-900 dark:text-white">
                        {nudge.courseName || 'Course'}
                      </td>
                      <td className="px-5 py-4 text-xs text-surface-500 dark:text-surface-300 truncate max-w-xs">{nudge.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="nudge"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Step 1: Select Employees */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full gradient-primary text-white text-[10px] flex items-center justify-center">1</span>
                    Select Employees ({selectedEmployees.length} Selected)
                  </h3>
                  <button 
                    onClick={selectAll}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    {selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All Filtered'}
                  </button>
                </div>

                <div className="flex gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      placeholder="Search employees at risk..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none"
                    />
                  </div>
                  <select 
                    className="px-4 py-2 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm outline-none"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="Individual">All Teams</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                  </select>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedEmployees.includes(String(emp.id))
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                          : 'bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-surface-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                        selectedEmployees.includes(String(emp.id))
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'border-surface-300 dark:border-surface-600'
                      }`}>
                        {selectedEmployees.includes(String(emp.id)) && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {emp.avatar || 'E'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-surface-900 dark:text-white">{emp.name}</p>
                        <p className="text-[10px] text-surface-500">{emp.department} • {emp.status === 'Non-Compliant' ? 3 : 1} Overdue</p>
                      </div>
                      <StatusBadge status={emp.status} />
                    </div>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <div className="text-center py-8 text-surface-500 text-sm">
                      No employees at risk found.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Configuration */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full gradient-primary text-white text-[10px] flex items-center justify-center">2</span>
                  Compose Nudge
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Course</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs focus:ring-2 focus:ring-primary-500/20 outline-none"
                    >
                      <option value="">Select a Course</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Mode</label>
                    <div className="flex gap-2">
                      {(['Reminder', 'Alert'] as NudgeMode[]).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setNudgeMode(mode)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            nudgeMode === mode
                              ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400'
                              : 'bg-surface-50 dark:bg-surface-800 border-surface-100 dark:border-surface-700 text-surface-500'
                          }`}
                        >
                          {mode === 'Alert' ? <AlertTriangle className="w-3 h-3 inline mr-1" /> : <Clock className="w-3 h-3 inline mr-1" />}
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Channel</label>
                    <div className="flex gap-2">
                      {(['Email', 'In-App Notification'] as NudgeChannel[]).map(ch => (
                        <button
                          key={ch}
                          onClick={() => setNudgeChannel(ch)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-semibold border transition-all ${
                            nudgeChannel === ch
                              ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400'
                              : 'bg-surface-50 dark:bg-surface-800 border-surface-100 dark:border-surface-700 text-surface-500'
                          }`}
                        >
                          {ch.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Template</label>
                    <div className="space-y-2">
                      {mockNudgeTemplates.filter(t => t.mode === nudgeMode).map(template => (
                        <div
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setCustomMessage(template.message);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedTemplate?.id === template.id
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                              : 'bg-surface-50 dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-surface-300'
                          }`}
                        >
                          <p className="text-xs font-bold text-surface-900 dark:text-white">{template.name}</p>
                          <p className="text-[10px] text-surface-500 line-clamp-2 mt-1">{template.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-surface-500 uppercase tracking-wider mb-1 block">Message Action</label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Customize your message..."
                      className="w-full h-24 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={selectedEmployees.length === 0 || !selectedTemplate || !selectedCourseId}
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send {selectedEmployees.length} Nudges
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Nudge Delivery"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800">
            <p className="text-sm text-primary-800 dark:text-primary-300 leading-relaxed">
              You are about to send a <strong>{nudgeMode}</strong> via <strong>{nudgeChannel}</strong> to <strong>{selectedEmployees.length} employees</strong>.
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Message Preview</p>
            <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-xs text-surface-600 dark:text-surface-300 italic">
              "{customMessage}"
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-white font-bold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSendNudge}
              className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm"
            >
              Confirm & Send
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


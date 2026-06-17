import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  BarChart3, FileText, Download, Calendar, 
  Plus, Search, Clock, Trash2, CheckCircle2, 
  ArrowRight, Filter, Settings
} from 'lucide-react';
import { PageHeader, Modal } from '../components/ui';
import { useAuditStore } from '../stores';
import { api } from '@/api/client';
import type { ReportType, ReportFrequency, ExportFormat, ScheduledReport } from '../types';
import { mockScheduledReports } from '../data/mockData';

export default function ReportsPage() {
  const [reports, setReports] = useState<ScheduledReport[]>(() => {
    const saved = localStorage.getItem('scheduled_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved reports:", e);
      }
    }
    return mockScheduledReports;
  });

  useEffect(() => {
    localStorage.setItem('scheduled_reports', JSON.stringify(reports));
  }, [reports]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const addLog = useAuditStore(s => s.addLog);

  // Fetch real employees for download purposes
  useEffect(() => {
    api.get('/manager/employees').then(res => setEmployees(res.data)).catch(() => {});
  }, []);

  // New Report State
  const [newReportName, setNewReportName] = useState('');
  const [newReportType, setNewReportType] = useState<ReportType>('Compliance Report');
  const [newFrequency, setNewFrequency] = useState<ReportFrequency>('Weekly');
  const [newFormat, setNewFormat] = useState<ExportFormat>('PDF');

  const handleDelete = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
    addLog({ action: 'Report Scheduled', user: 'Sarah Mitchell', details: `Deleted scheduled report: ${id}` });
  };

  const handleCreateReport = () => {
    const report: ScheduledReport = {
      id: `RPT-00${reports.length + 1}`,
      name: newReportName,
      type: newReportType,
      frequency: newFrequency,
      format: newFormat,
      delivery: 'Email',
      createdAt: new Date().toISOString().split('T')[0],
      nextScheduled: '2026-06-20',
    };
    setReports([report, ...reports]);
    setShowCreateModal(false);
    addLog({ action: 'Report Scheduled', user: 'Sarah Mitchell', details: `Scheduled new report: ${newReportName}` });
    
    // Reset
    setNewReportName('');
  };

  const handleExportData = (data: any[], filename: string, format: string) => {
    if (format === 'PDF') {
      const doc = new jsPDF();
      doc.text(filename, 14, 15);
      autoTable(doc, {
        startY: 20,
        head: [Object.keys(data[0])],
        body: data.map(item => Object.values(item)),
        headStyles: { fillColor: [79, 70, 229] },
      });
      doc.save(`${filename}.pdf`);
    } else if (format === 'CSV') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => `"${value}"`).join(',')
      ).join('\n');
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'Excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
  };

  const handleManualDownload = (report: ScheduledReport) => {
    addLog({ action: 'Report Downloaded', user: 'Manager', details: `Manually downloaded ${report.name} (${report.format})` });
    
    const data = employees.length > 0 
      ? employees.map((emp: any) => ({
          'Employee': emp.name,
          'Department': emp.department,
          'Status': emp.status,
          'Progress': `${emp.completedCourses}/${emp.assignedCourses}`
        }))
      : [{ 'Note': 'No employee data available yet.' }];

    handleExportData(data, report.name, report.format);
  };

  const handleQuickExport = (title: string) => {
    addLog({ action: 'Report Downloaded', user: 'Manager', details: `Quick export: ${title}` });
    
    const data = employees.length > 0
      ? employees.slice(0, 20).map((emp: any) => ({
          'Name': emp.name,
          'Department': emp.department,
          'Status': emp.status
        }))
      : [{ 'Note': 'No employee data available yet.' }];

    handleExportData(data, title, 'CSV');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports Management"
        subtitle="Generate on-demand analytics or schedule automated delivery to stakeholders"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl gradient-primary text-white text-sm font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Scheduled Report
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* On-Demand Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" /> Quick Exports
            </h3>
            <div className="space-y-2">
              {[
                { title: 'Compliance Summary', icon: CheckCircle2, color: 'text-accent-500' },
                { title: 'Team Activity Log', icon: BarChart3, color: 'text-primary-500' },
                { title: 'Employee Progress', icon: Calendar, color: 'text-warning-500' },
                { title: 'Course Completion', icon: Settings, color: 'text-surface-500' },
              ].map(item => (
                <button
                  key={item.title}
                  onClick={() => handleQuickExport(item.title)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">{item.title}</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-surface-400 group-hover:text-primary-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-primary-600 to-violet-700">
            <h3 className="text-sm font-bold text-white mb-2">Automated Insights</h3>
            <p className="text-xs text-white/80 mb-4 leading-relaxed">
              Configure your reports to be sent directly to your email every Monday at 9:00 AM.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all"
            >
              Configure Now
            </button>
          </div>
        </div>

        {/* Scheduled List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-surface-900 dark:text-white">Active Report Schedules</h3>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-surface-400" />
              <Search className="w-4 h-4 text-surface-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {reports.map((report, i) => (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-5 border border-surface-100 dark:border-surface-800 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-surface-900 dark:text-white line-clamp-1">{report.name}</h4>
                        <p className="text-[10px] text-surface-500 font-medium uppercase tracking-wider">{report.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-1.5 rounded-lg text-surface-300 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50 text-center">
                      <p className="text-[8px] text-surface-400 uppercase font-bold">Frequency</p>
                      <p className="text-[10px] font-bold text-surface-700 dark:text-surface-200">{report.frequency}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50 text-center">
                      <p className="text-[8px] text-surface-400 uppercase font-bold">Format</p>
                      <p className="text-[10px] font-bold text-surface-700 dark:text-surface-200">{report.format}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800/50 text-center">
                      <p className="text-[8px] text-surface-400 uppercase font-bold">Next Run</p>
                      <p className="text-[10px] font-bold text-surface-700 dark:text-surface-200">{report.nextScheduled}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-800">
                    <div className="flex items-center gap-2 text-[10px] text-surface-500">
                      <Clock className="w-3 h-3" /> Last run: {report.lastGenerated || 'Never'}
                    </div>
                    <button
                      onClick={() => handleManualDownload(report)}
                      className="text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      Download Now <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule Automated Report"
      >
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-surface-500 uppercase tracking-widest block mb-1.5">Report Name</label>
            <input
              type="text"
              placeholder="e.g., Weekly Compliance Summary"
              value={newReportName}
              onChange={(e) => setNewReportName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs focus:ring-2 focus:ring-primary-500/20 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-surface-500 uppercase tracking-widest block mb-1.5">Category</label>
              <select
                value={newReportType}
                onChange={(e) => setNewReportType(e.target.value as ReportType)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs outline-none"
              >
                {['Compliance Report', 'Team Report', 'Employee Report', 'Course Report'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-surface-500 uppercase tracking-widest block mb-1.5">Frequency</label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as ReportFrequency)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs outline-none"
              >
                {['Daily', 'Weekly', 'Monthly'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-surface-500 uppercase tracking-widest block mb-2">Export Format</label>
            <div className="flex gap-2">
              {(['PDF', 'CSV', 'Excel'] as ExportFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setNewFormat(fmt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    newFormat === fmt
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-surface-50 dark:bg-surface-800 border-surface-100 dark:border-surface-700 text-surface-500'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-white text-xs font-bold"
            >
              Discard
            </button>
            <button
              onClick={handleCreateReport}
              disabled={!newReportName}
              className="flex-1 py-3 rounded-xl gradient-primary text-white text-xs font-bold disabled:opacity-50"
            >
              Schedule Report
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


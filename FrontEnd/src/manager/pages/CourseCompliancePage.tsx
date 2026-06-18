import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, CheckCircle2, Send, ChevronRight, Loader2 } from 'lucide-react';
import { PageHeader, FilterBar, StatusBadge, ProgressBar, Tabs, ExportButton } from '../components/ui';
import { useAuditStore } from '../stores';
import { exportData } from '../lib/exportUtils';
import { api } from '@/api/client';
import type { ComplianceTab } from '../types';

interface ComplianceRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  courseName: string;
  status: string;
  score: number;
  dueDate: string;
}

interface ComplianceStats {
  complianceRate: number;
  pendingRate: number;
  avgPassingScore: number;
}

export default function CourseCompliancePage() {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('Overdue');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Individual');
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({ complianceRate: 0, pendingRate: 0, avgPassingScore: 0 });
  const [loading, setLoading] = useState(true);
  const addLog = useAuditStore(s => s.addLog);

  const loadData = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const [statsRes, recordsRes] = await Promise.all([
        api.get('/manager/compliance'),
        api.get('/manager/compliance/records'),
      ]);
      setStats({
        complianceRate: statsRes.data.complianceRate ?? 0,
        pendingRate: statsRes.data.pendingRate ?? 0,
        avgPassingScore: statsRes.data.avgPassingScore ?? 0,
      });
      setRecords(recordsRes.data);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const term = search.toLowerCase();
      const matchSearch = !term || record.employeeName.toLowerCase().includes(term) || record.courseName.toLowerCase().includes(term);
      const matchTab = record.status === activeTab;
      return matchSearch && matchTab;
    });
  }, [records, search, activeTab]);

  const handleExport = (fmt: string) => {
    addLog({ action: 'Report Downloaded', user: 'Manager', details: `Exported Compliance Report (${fmt})` });
    exportData(fmt, {
      filename: `compliance_${activeTab.toLowerCase()}_report`,
      title: `Course Compliance - ${activeTab} Records`,
      headers: ['Employee Name', 'Department', 'Course Name', 'Due Date', 'Status', 'Score'],
      data: filteredRecords.map(rec => [rec.employeeName, rec.department, rec.courseName, rec.dueDate, rec.status, rec.score]),
      jsonData: filteredRecords.map(rec => ({ 'Employee': rec.employeeName, 'Dept': rec.department, 'Course': rec.courseName, 'Due Date': rec.dueDate, 'Status': rec.status, 'Score': rec.score }))
    });
  };

  const handleRemind = (rec: ComplianceRecord) => {
    addLog({ action: 'Reminder Sent', user: 'Manager', details: `Reminder sent to ${rec.employeeName} for ${rec.courseName}` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500 mr-2" />
        <span className="text-sm font-semibold text-surface-500">Loading compliance data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Compliance"
        subtitle="Manage mandatory training requirements and compliance status across the organization"
        actions={<ExportButton onExport={handleExport} />}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-accent-50 dark:bg-accent-950/30 flex items-center justify-center text-accent-500 shadow-sm border border-accent-100 dark:border-accent-900/50">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.complianceRate}%</p>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Compliance Rate</p>
            <div className="w-32 mt-2">
              <ProgressBar value={stats.complianceRate} color="bg-accent-500" showLabel={false} />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger-950/30 flex items-center justify-center text-danger-500 shadow-sm border border-danger-100 dark:border-danger-900/50">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.pendingRate}%</p>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Total Pending</p>
            <div className="w-32 mt-2">
              <ProgressBar value={stats.pendingRate} color="bg-danger-500" showLabel={false} />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-500 shadow-sm border border-primary-100 dark:border-primary-900/50">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.avgPassingScore}%</p>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Avg Passing Score</p>
            <p className="text-[10px] text-accent-600 font-bold mt-1">From DB — real scores</p>
          </div>
        </div>
      </div>

      <FilterBar
        category={filterCategory}
        onCategoryChange={setFilterCategory}
        search={search}
        onSearchChange={setSearch}
        categories={[]}
      />

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs
            tabs={['Completed', 'Not Completed', 'In Progress', 'Overdue']}
            active={activeTab}
            onChange={(tab) => setActiveTab(tab as ComplianceTab)}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500 font-medium">Records Found:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-xs font-bold text-surface-900 dark:text-white">
              {filteredRecords.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50/50 dark:bg-surface-800/30">
                {['Recipient', 'Department', 'Mandatory Course', 'Due Date', 'Score', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-surface-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            {/* Key changes on tab switch prevents AnimatePresence glitch — use mode="wait" on tbody wrapper */}
            <tbody key={activeTab}>
              <AnimatePresence mode="wait">
                {filteredRecords.map((rec, i) => (
                  <motion.tr
                    key={`${rec.employeeId}-${rec.courseName}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/20"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {rec.employeeName.substring(0, 2)}
                        </div>
                        <p className="text-xs font-semibold text-surface-900 dark:text-white">{rec.employeeName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-surface-600 dark:text-surface-300">{rec.department}</td>
                    <td className="px-6 py-4 text-xs font-medium text-surface-900 dark:text-white">{rec.courseName}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-surface-600 dark:text-surface-300 font-medium">{rec.dueDate}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-surface-700 dark:text-surface-300">
                      {rec.score > 0 ? `${rec.score}%` : '—'}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredRecords.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-surface-300" />
              </div>
              <h3 className="text-base font-bold text-surface-900 dark:text-white">
                {records.length === 0 ? 'No Compliance Data Yet' : 'No Records in This Category'}
              </h3>
              <p className="text-sm text-surface-500 max-w-xs mx-auto mt-1">
                {records.length === 0
                  ? 'Compliance records will appear once employees are assigned courses.'
                  : `All mandatory courses in "${activeTab}" status have been addressed.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, CheckCircle2, Send, ChevronRight } from 'lucide-react';
import { PageHeader, FilterBar, StatusBadge, ProgressBar, Tabs, ExportButton } from '../components/ui';
import { mockComplianceRecords } from '../data/mockData';
import { useAuditStore } from '../stores';
import { exportData } from '../lib/exportUtils';
import type { ComplianceTab } from '../types';

export default function CourseCompliancePage() {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('Overdue');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Individual');
  const addLog = useAuditStore(s => s.addLog);

  const stats = {
    compliance: 88.5,
    pending: 11.5,
    avgScore: 84.8,
  };

  const filteredRecords = useMemo(() => {
    return mockComplianceRecords.filter(record => {
      const term = search.toLowerCase();
      const matchSearch = !term || record.employeeName.toLowerCase().includes(term) || record.courseName.toLowerCase().includes(term);
      const matchTab = record.status === activeTab;
      return matchSearch && matchTab;
    });
  }, [search, activeTab]);

  const handleExport = (fmt: string) => {
    addLog({ action: 'Report Downloaded', user: 'Sarah Mitchell', details: `Exported Compliance Report (${fmt})` });

    exportData(fmt, {
      filename: `compliance_${activeTab.toLowerCase()}_report`,
      title: `Course Compliance - ${activeTab} Records`,
      headers: ['Employee Name', 'Department', 'Course Name', 'Due Date', 'Status'],
      data: filteredRecords.map(rec => [
        rec.employeeName,
        rec.department,
        rec.courseName,
        rec.dueDate,
        rec.status
      ]),
      jsonData: filteredRecords.map(rec => ({
        'Employee': rec.employeeName,
        'Dept': rec.department,
        'Course': rec.courseName,
        'Due Date': rec.dueDate,
        'Status': rec.status
      }))
    });
  };

  const handleRemind = (rec: any) => {
    addLog({ action: 'Reminder Sent', user: 'Sarah Mitchell', details: `Reminder sent to ${rec.employeeName} for ${rec.courseName}` });
  };

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
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.compliance}%</p>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Compliance Rate</p>
            <div className="w-32 mt-2">
              <ProgressBar value={stats.compliance} color="bg-accent-500" showLabel={false} />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 dark:bg-danger-950/30 flex items-center justify-center text-danger-500 shadow-sm border border-danger-100 dark:border-danger-900/50">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.pending}%</p>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Total Pending</p>
            <div className="w-32 mt-2">
              <ProgressBar value={stats.pending} color="bg-danger-500" showLabel={false} />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-500 shadow-sm border border-primary-100 dark:border-primary-900/50">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.avgScore}%</p>
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">Avg Passing Score</p>
            <p className="text-[10px] text-accent-600 font-bold mt-1">+2.4% from last month</p>
          </div>
        </div>
      </div>

      <FilterBar
        category={filterCategory}
        onCategoryChange={setFilterCategory}
        search={search}
        onSearchChange={setSearch}
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
                {['Recipient', 'Department', 'Mandatory Course', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-surface-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredRecords.map((rec, i) => (
                  <motion.tr
                    key={`${rec.employeeId}-${rec.courseName}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.02 }}
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
                      {activeTab === 'Overdue' && (
                        <p className="text-[10px] text-danger-500 font-bold">14 days late</p>
                      )}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {activeTab !== 'Completed' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemind(rec)}
                            className="p-1.5 rounded-lg bg-warning-50 dark:bg-warning-900/10 text-warning-600 dark:text-warning-500 hover:bg-warning-100 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-surface-200 transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </td>
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
              <h3 className="text-base font-bold text-surface-900 dark:text-white">Perfect Compliance!</h3>
              <p className="text-sm text-surface-500 max-w-xs mx-auto">All mandatory courses in this category have been addressed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


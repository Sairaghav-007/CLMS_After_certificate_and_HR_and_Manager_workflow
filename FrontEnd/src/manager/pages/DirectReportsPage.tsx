import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Eye, Send, BookPlus, Mail, User, Calendar, Award, Clock, BarChart3, BookOpen, CheckCircle2, Link2 as Linkedin, Loader2 } from 'lucide-react';
import { PageHeader, FilterBar, StatusBadge, ProgressBar, ExportButton, Drawer } from '../components/ui';
import { useAuditStore } from '../stores';
import type { Employee } from '../types';
import { api } from '@/api/client';

export default function DirectReportsPage() {
  const [filterCategory, setFilterCategory] = useState('Individual');
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeCourses, setEmployeeCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const addLog = useAuditStore(s => s.addLog);
  const pageSize = 10;

  const [subFilterValue, setSubFilterValue] = useState('');
  const [teams, setTeams] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [allEmployeesForFilter, setAllEmployeesForFilter] = useState<Employee[]>([]);

  // Fetch groups and teams on mount
  useEffect(() => {
    api.get('/manager/teams').then(res => setTeams(res.data)).catch(() => {});
    api.get('/manager/groups').then(res => setGroups(res.data)).catch(() => {});
  }, []);

  const fetchEmployees = async (showSkeleton = true) => {
    if (showSkeleton) setIsLoading(true);
    try {
      let url = '/manager/employees';
      if (filterCategory !== 'Individual' && subFilterValue) {
        url += `?category=${filterCategory}&value=${encodeURIComponent(subFilterValue)}`;
      }
      const res = await api.get(url);
      setEmployees(res.data);
      if (!subFilterValue || filterCategory === 'Individual') {
        setAllEmployeesForFilter(res.data);
      }
    } catch (err) {
      console.error("Failed to load direct reports", err);
    } finally {
      if (showSkeleton) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(true);
  }, [filterCategory, subFilterValue]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchEmployees(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [filterCategory, subFilterValue]);

  // Reset subFilterValue when category changes
  useEffect(() => {
    setSubFilterValue('');
  }, [filterCategory]);

  const departments = useMemo(() => {
    const depts = new Set<string>();
    allEmployeesForFilter.forEach(emp => {
      if (emp.department) depts.add(emp.department);
    });
    return Array.from(depts);
  }, [allEmployeesForFilter]);

  // Update selectedEmployee reference if it changes during polling
  useEffect(() => {
    if (selectedEmployee && employees.length > 0) {
      const updated = employees.find(e => e.id === selectedEmployee.id);
      if (updated) {
        setSelectedEmployee(updated);
      }
    }
  }, [employees]);

  useEffect(() => {
    if (selectedEmployee) {
      const fetchCourses = async (showSkeleton = true) => {
        if (showSkeleton) setLoadingCourses(true);
        try {
          const res = await api.get(`/manager/employees/${selectedEmployee.id}/courses`);
          setEmployeeCourses(res.data);
        } catch (err) {
          console.error("Failed to load employee courses", err);
        } finally {
          if (showSkeleton) setLoadingCourses(false);
        }
      };

      fetchCourses(true);

      const interval = setInterval(() => {
        fetchCourses(false);
      }, 15000);

      return () => clearInterval(interval);
    } else {
      setEmployeeCourses([]);
    }
  }, [selectedEmployee?.id]);

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const term = search.toLowerCase();
      const nameMatch = emp.name ? emp.name.toLowerCase().includes(term) : false;
      const idMatch = emp.id ? emp.id.toLowerCase().includes(term) : false;
      const matchSearch = !term || nameMatch || idMatch;
      return matchSearch;
    });
  }, [employees, search]);

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleExport = (format: string) => {
    if (filtered.length === 0) return;
    const exportData = filtered.map(emp => ({
      'Employee': emp.name,
      'ID': emp.id,
      'Department': emp.department,
      'Assigned': emp.assignedCourses,
      'Completed': emp.completedCourses,
      'Status': emp.status
    }));

    if (format === 'PDF') {
      const doc = new jsPDF();
      doc.text('Direct Reports - Learning Progress', 14, 15);
      
      const head = [['Employee', 'ID', 'Department', 'Assigned', 'Completed', 'Status']];
      const body = filtered.map(emp => [
        emp.name,
        emp.id,
        emp.department,
        emp.assignedCourses,
        emp.completedCourses,
        emp.status
      ]);

      autoTable(doc, {
        startY: 20,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Primary Indigo
      });

      doc.save('direct_reports.pdf');
    } else if (format === 'CSV') {
      const headers = Object.keys(exportData[0]).join(',');
      const rows = exportData.map(row => 
        Object.values(row).map(value => `"${value}"`).join(',')
      ).join('\n');
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'direct_reports.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'Excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Direct Reports');
      XLSX.writeFile(wb, 'direct_reports.xlsx');
    }
    
    addLog({ action: 'Report Downloaded', user: 'Sarah Mitchell', details: `Exported Direct Reports (${format})` });
  };

  const handleSendReminder = async (emp: Employee) => {
    try {
      const cleanEmpId = emp.id.replace('EMP-', '');
      await api.post('/manager/nudge', {
        employeeId: Number(cleanEmpId),
        courseId: 1, // Default fallback nudge course ID
        message: `Please complete your learning path assignments as soon as possible.`
      });
      addLog({ action: 'Reminder Sent', user: 'Sarah Mitchell', details: `Sent reminder to ${emp.name}` });
    } catch (err) {
      console.error("Failed to send nudge warning to employee", err);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto text-left">
      <PageHeader
        title="Direct Reports"
        subtitle="Monitor and manage your team's learning progress"
        actions={<ExportButton onExport={handleExport} />}
      />

      <FilterBar
        category={filterCategory}
        onCategoryChange={setFilterCategory}
        search={search}
        onSearchChange={(q) => { setSearch(q); setCurrentPage(1); }}
        searchPlaceholder="Search by Employee ID or Name..."
        extra={
          filterCategory !== 'Individual' && (
            <div className="flex items-center gap-2">
              <select
                value={subFilterValue}
                onChange={(e) => { setSubFilterValue(e.target.value); setCurrentPage(1); }}
                className="h-10 px-3 rounded-btn bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs text-black focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">Select {filterCategory}...</option>
                {filterCategory === 'Team' && teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>{team.name}</option>
                ))}
                {filterCategory === 'Group' && groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
                {filterCategory === 'Department' && departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          )
        }
      />

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-card overflow-hidden bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-850">
                {['Employee', 'Department', 'Assigned', 'Completed', 'In Progress', 'Overdue', 'Avg Score', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-surface-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-surface-500 font-semibold">
                    <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2 text-primary-500" />
                    <span>Loading team members...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-surface-450 font-semibold">
                    No direct reports match the criteria.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {paginated.map((emp, i) => (
                    <motion.tr
                      key={emp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-surface-100 dark:border-surface-850 hover:bg-surface-50/55 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg gradient-primary bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {emp.avatar || 'E'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-surface-900 dark:text-white">{emp.name}</p>
                              {emp.linkedinUrl && (
                                <a 
                                  href={emp.linkedinUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-primary-500 hover:text-primary-600 transition-colors"
                                  title="LinkedIn Profile"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Linkedin size={11} />
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] text-surface-500">{emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-600 dark:text-surface-300">{emp.department}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-surface-900 dark:text-white">{emp.assignedCourses}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-accent-600 dark:text-accent-400">{emp.completedCourses}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-primary-600 dark:text-primary-400">{emp.inProgressCourses}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-danger-600 dark:text-danger-400">{emp.overdueCourses}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-surface-900 dark:text-white">{emp.averageQuizScore}%</td>
                      <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSelectedEmployee(emp)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-800">
            <p className="text-xs text-surface-500">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Employee Detail Drawer */}
      <Drawer
        isOpen={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        title="Employee Details"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-750 flex items-center justify-center text-xl font-bold shadow-lg shadow-primary-500/10">
                {selectedEmployee.avatar || 'E'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white">{selectedEmployee.name}</h3>
                <p className="text-xs text-surface-500 mb-1">{selectedEmployee.id} • {selectedEmployee.designation || 'Software Engineer'}</p>
                <StatusBadge status={selectedEmployee.status} size="md" />
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mail, label: 'Email', value: selectedEmployee.email },
                { icon: User, label: 'Department', value: selectedEmployee.department },
                { icon: Award, label: 'Designation', value: selectedEmployee.designation || 'Software Developer' },
                { icon: Calendar, label: 'Joining Date', value: selectedEmployee.joiningDate || '2026-03-01' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40">
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="w-3 h-3 text-surface-400" />
                    <span className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">{item.label}</span>
                  </div>
                  <p className="text-xs font-semibold text-surface-900 dark:text-white truncate">{item.value}</p>
                </div>
              ))}

              {/* LinkedIn URL Link display */}
              <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40 col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-primary-500" />
                  <div>
                    <span className="text-[10px] text-surface-500 uppercase tracking-wider font-medium block">LinkedIn Profile</span>
                    {selectedEmployee.linkedinUrl ? (
                      <a 
                        href={selectedEmployee.linkedinUrl}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline truncate max-w-[280px] block"
                      >
                        {selectedEmployee.linkedinUrl}
                      </a>
                    ) : (
                      <span className="text-xs text-surface-400 font-semibold">No URL provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Learning Summary */}
            <div>
              <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Learning Summary</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Assigned', value: selectedEmployee.assignedCourses, icon: BookOpen, color: 'text-primary-500' },
                  { label: 'Completed', value: selectedEmployee.completedCourses, icon: CheckCircle2, color: 'text-accent-500' },
                  { label: 'In Progress', value: selectedEmployee.inProgressCourses, icon: Clock, color: 'text-warning-500' },
                  { label: 'Certificates', value: selectedEmployee.certificatesEarned, icon: Award, color: 'text-primary-500' },
                  { label: 'Hours', value: selectedEmployee.learningHours || 0, icon: Clock, color: 'text-cyan-500' },
                  { label: 'Avg Score', value: `${selectedEmployee.averageQuizScore}%`, icon: BarChart3, color: 'text-amber-500' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40">
                    <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
                    <p className="text-lg font-bold text-surface-900 dark:text-white">{item.value}</p>
                    <p className="text-[10px] text-surface-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Progress */}
            <div>
              <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-3">Course Progress</h4>
              {loadingCourses ? (
                <div className="py-6 text-center text-xs text-surface-500 font-semibold">
                  <Loader2 className="animate-spin w-5 h-5 mx-auto mb-2 text-primary-500" />
                  <span>Loading progress records...</span>
                </div>
              ) : employeeCourses.length === 0 ? (
                <div className="py-4 text-center text-xs text-surface-450 font-semibold bg-surface-50 dark:bg-surface-800/40 rounded-xl">
                  No courses assigned to this employee.
                </div>
              ) : (
                <div className="space-y-2">
                  {employeeCourses.map(course => (
                    <div key={course.courseId} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-surface-900 dark:text-white">{course.courseName}</p>
                        <StatusBadge status={course.status} />
                      </div>
                      <ProgressBar
                        value={course.completionPercent}
                        color={course.status === 'Completed' ? 'bg-accent-500' : course.status === 'Overdue' ? 'bg-danger-500' : 'bg-primary-500'}
                        size="md"
                      />
                      <p className="text-[10px] text-surface-500 mt-1">Due: {course.dueDate}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}



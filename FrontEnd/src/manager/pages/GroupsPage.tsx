import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, MoreVertical,
  Users, BookOpen, 
  BarChart3, CheckCircle2, 
  Calendar, ShieldCheck, FileText, Trash2
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis
} from 'recharts';
import { PageHeader, StatusBadge, Modal } from '../components/ui';
import { api } from '@/api/client';
import { useUIStore } from '@/shared/store';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  const addToast = useUIStore((s) => s.addToast);

  // Wizard State
  const [newGroupId, setNewGroupId] = useState(`GRP-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupDept, setNewGroupDept] = useState('Engineering');
  const [newGroupCourses, setNewGroupCourses] = useState<any[]>([]);
  const [newGroupEmployees, setNewGroupEmployees] = useState<string[]>([]);
  const [targetAvgScore, setTargetAvgScore] = useState(80);
  const [targetPassingScore, setTargetPassingScore] = useState(70);

  // Real API data for wizard
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/manager/groups');
      setGroups(res.data);
    } catch (error) {
      console.error("Failed to load manager groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    // Fetch real courses and employees for wizard
    api.get('/employee/courses').then(res => setAvailableCourses(res.data)).catch(() => {});
    api.get('/manager/employees').then(res => setAvailableEmployees(res.data)).catch(() => {});

    const interval = setInterval(() => {
      fetchGroups();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Update selectedGroup reference if it changes during polling
  useEffect(() => {
    if (selectedGroup && groups.length > 0) {
      const updated = groups.find(g => g.id === selectedGroup.id);
      if (updated) {
        setSelectedGroup(updated);
      }
    }
  }, [groups]);

  const handleCreateGroup = async () => {
    try {
      const payload = {
        id: newGroupId,
        name: newGroupName,
        description: newGroupDesc,
        department: newGroupDept,
        courses: newGroupCourses.map(c => c.courseName),
        employees: newGroupEmployees,
        status: 'Active'
      };

      await api.post('/manager/groups', payload);
      addToast({ type: 'success', title: 'Group Created', message: `Cohort "${newGroupName}" established successfully.` });
      
      setShowWizard(false);
      resetWizard();
      fetchGroups();
    } catch (error) {
      addToast({ type: 'error', title: 'Creation Failed', message: 'Could not save learning group.' });
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setNewGroupId(`GRP-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupDept('Engineering');
    setNewGroupCourses([]);
    setNewGroupEmployees([]);
    setTargetAvgScore(80);
    setTargetPassingScore(70);
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete learning group "${name}"? This cannot be undone.`)) {
      try {
        await api.delete(`/manager/groups/${id}`);
        addToast({ type: 'success', title: 'Group Deleted', message: `Learning group "${name}" was deleted.` });
        if (selectedGroup?.id === id) {
          setSelectedGroup(null);
        }
        fetchGroups();
      } catch (error) {
        addToast({ type: 'error', title: 'Delete Failed', message: 'Could not delete learning group.' });
      }
    }
  };

  const groupComplianceData = useMemo(() => {
    if (!selectedGroup || !selectedGroup.employees || selectedGroup.employees.length === 0) return [];
    let compliant = 0;
    let inProgress = 0;
    let nonCompliant = 0;

    selectedGroup.employees.forEach((empId: string) => {
      const emp = availableEmployees.find(e => String(e.id) === String(empId));
      if (emp) {
        if (emp.status === 'Compliant') {
          if (emp.completedCourses === emp.assignedCourses) {
            compliant++;
          } else {
            inProgress++;
          }
        } else if (emp.status === 'Non-Compliant') {
          nonCompliant++;
        } else {
          inProgress++;
        }
      }
    });

    const data = [
      { name: 'Compliant', v: compliant },
      { name: 'In Progress', v: inProgress },
      { name: 'Non-Compliant', v: nonCompliant },
    ].filter(item => item.v > 0);

    return data;
  }, [selectedGroup, availableEmployees]);

  const groupScoreAvg = useMemo(() => {
    if (!selectedGroup || !selectedGroup.employees || selectedGroup.employees.length === 0) return 'N/A';
    let totalScore = 0;
    let count = 0;
    selectedGroup.employees.forEach((empId: string) => {
      const emp = availableEmployees.find(e => String(e.id) === String(empId));
      if (emp && emp.averageQuizScore !== undefined && emp.averageQuizScore > 0) {
        totalScore += emp.averageQuizScore;
        count++;
      }
    });
    return count > 0 ? `${Math.round(totalScore / count)}%` : 'N/A';
  }, [selectedGroup, availableEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 font-semibold text-surface-500">Loading Cohorts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Groups"
        subtitle="Organize team members into cohorts for specialized training tracks and collective analytics"
        actions={
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Learning Group
          </button>
        }
      />

      {/* Group Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {groups.map((group, i) => (
            <motion.div
              key={group.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-surface-200 shadow-sm rounded-2xl p-5 hover:shadow-xl transition-all group cursor-pointer"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <StatusBadge status={group.status} />
                  <button
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    className="p-1 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 transition-colors cursor-pointer"
                    title="Delete Cohort"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-base font-bold text-surface-900 mb-1">{group.name}</h3>
              <p className="text-xs text-surface-500 line-clamp-2 mb-4 h-8">{group.description}</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-surface-50">
                  <p className="text-[8px] text-surface-400 uppercase font-bold tracking-widest">Employees</p>
                  <p className="text-xs font-bold text-surface-900">{group.employees ? group.employees.length : 0}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-50">
                  <p className="text-[8px] text-surface-400 uppercase font-bold tracking-widest">Courses</p>
                  <p className="text-xs font-bold text-surface-900">{group.courses ? group.courses.length : 0}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {group.employees && group.employees.slice(0, 4).map((_: any, idx: number) => (
                    <div key={idx} className="w-6 h-6 rounded-full border-2 border-white bg-surface-200 flex items-center justify-center text-[8px] font-bold text-surface-800">
                      {(idx + 10).toString(36).toUpperCase()}
                    </div>
                  ))}
                  {group.employees && group.employees.length > 4 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-primary-500 text-white flex items-center justify-center text-[8px] font-bold">
                      +{group.employees.length - 4}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-surface-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Created {group.createdDate}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Wizard Modal */}
      <Modal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        title="Learning Group Wizard"
        size="xl"
      >
        <div className="flex gap-8">
          <div className="w-48 hidden md:block space-y-6">
            {[
              { id: 1, label: 'Information', icon: FileText },
              { id: 2, label: 'Course Assignment', icon: BookOpen },
              { id: 3, label: 'Employee Selection', icon: Users },
            ].map(step => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  wizardStep >= step.id ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-400'
                }`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <div className={`${wizardStep >= step.id ? 'text-primary-600' : 'text-surface-400'} font-bold text-xs`}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 space-y-6">
            {wizardStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5">Group ID</label>
                    <input value={newGroupId} onChange={(e) => setNewGroupId(e.target.value)} placeholder="GRP-XXXX" className="w-full px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-xs text-black outline-none focus:border-primary-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5">Group Name</label>
                    <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g., Q3 Tech Upskilling" className="w-full px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-xs text-black outline-none focus:border-primary-500 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5">Target Avg Score (%)</label>
                    <input type="number" value={targetAvgScore} onChange={(e) => setTargetAvgScore(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-xs text-black outline-none focus:border-primary-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5">Passing Score (%)</label>
                    <input type="number" value={targetPassingScore} onChange={(e) => setTargetPassingScore(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl bg-white border border-surface-200 text-xs text-black outline-none focus:border-primary-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-1.5">Description (Objectives)</label>
                  <textarea value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="Objectives of this group..." className="w-full h-24 px-4 py-3 rounded-xl bg-white border border-surface-200 text-xs text-black outline-none focus:border-primary-500 transition-colors" />
                </div>
              </motion.div>
            )}

            {wizardStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                 <div className="flex items-center justify-between mb-2">
                   <h4 className="text-sm font-bold text-black">Assign Courses</h4>
                   <span className="text-[10px] font-bold bg-primary-50 text-primary-600 px-2 py-0.5 rounded-md">{newGroupCourses.length} Selected</span>
                 </div>
                 <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {availableCourses.length === 0 ? (
                      <p className="text-xs text-surface-400 text-center py-6">Loading courses…</p>
                    ) : availableCourses.map((c: any, idx: number) => {
                      const isSelected = newGroupCourses.some(x => x.courseName === c.title);
                      return (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected ? 'bg-primary-50 border-primary-200' : 'bg-white border-surface-100 hover:border-surface-300'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setNewGroupCourses(prev => prev.filter(x => x.courseName !== c.title));
                            } else {
                              setNewGroupCourses(prev => [...prev, { courseId: String(c.id), courseName: c.title, passingScore: targetPassingScore, dueDate: c.dueDate ?? '2026-12-31', category: c.category ?? 'General', type: 'Mandatory' }]);
                            }
                          }}
                        >
                           <p className="text-xs font-bold text-black">{c.title}</p>
                           {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-500" />}
                        </div>
                      );
                    })}
                 </div>
              </motion.div>
            )}

            {wizardStep === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                 <div className="flex items-center justify-between mb-2">
                   <h4 className="text-sm font-bold text-black">Select Employees</h4>
                   <span className="text-[10px] font-bold bg-primary-50 text-primary-600 px-2 py-0.5 rounded-md">{newGroupEmployees.length} Enrolled</span>
                 </div>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {availableEmployees.length === 0 ? (
                      <p className="text-xs text-surface-400 text-center py-6">Loading employees…</p>
                    ) : availableEmployees.map((emp: any) => (
                      <div 
                        key={emp.id} 
                        onClick={() => setNewGroupEmployees(prev => prev.includes(String(emp.id)) ? prev.filter(x => x !== String(emp.id)) : [...prev, String(emp.id)])}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          newGroupEmployees.includes(String(emp.id)) ? 'bg-primary-50 border-primary-200' : 'bg-white border-surface-100 hover:border-surface-300'
                        }`}
                      >
                         <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                           newGroupEmployees.includes(String(emp.id)) ? 'bg-primary-500 border-primary-500' : 'bg-white border-surface-300'
                         }`}>
                           {newGroupEmployees.includes(String(emp.id)) && <CheckCircle2 className="w-3 h-3 text-white" />}
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="text-xs font-bold text-black truncate">{emp.name}</div>
                           <div className="text-[10px] text-surface-500">{emp.id} • {emp.department}</div>
                         </div>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            <div className="flex gap-3 pt-6 border-t border-surface-100">
               {wizardStep > 1 && (
                 <button onClick={() => setWizardStep(prev => prev - 1)} className="flex-1 py-3 rounded-xl bg-surface-100 text-surface-700 text-xs font-bold cursor-pointer">Back</button>
               )}
               {wizardStep < 3 ? (
                 <button onClick={() => setWizardStep(prev => prev + 1)} className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-xs font-bold cursor-pointer">Continue</button>
               ) : (
                 <button onClick={handleCreateGroup} className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-xs font-bold cursor-pointer">Finish</button>
               )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={!!selectedGroup} onClose={() => setSelectedGroup(null)} title={selectedGroup?.name || ''} size="xl">
        {selectedGroup && (
          <div className="space-y-8">
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Employees', value: selectedGroup.employees ? selectedGroup.employees.length : 0, icon: Users, color: 'text-primary-500' },
                  { label: 'Courses', value: selectedGroup.courses ? selectedGroup.courses.length : 0, icon: BookOpen, color: 'text-success-500' },
                  { label: 'Score Avg', value: groupScoreAvg, icon: BarChart3, color: 'text-warning-500' },
                  { label: 'Status', value: selectedGroup.status, icon: ShieldCheck, color: 'text-indigo-500' },
                ].map(stat => (
                  <div key={stat.label} className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                     <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                     <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                     <p className="text-[10px] text-surface-500 uppercase font-bold tracking-widest">{stat.label}</p>
                  </div>
                ))}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-surface-250 shadow-sm rounded-2xl p-6">
                   <h4 className="text-sm font-bold text-surface-900 mb-6">Compliance</h4>
                   <div className="h-48">
                      {groupComplianceData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-surface-400">
                          <Users className="w-8 h-8 text-surface-300 mb-2" />
                          <p className="text-xs font-semibold">No data available yet</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie data={groupComplianceData} innerRadius={50} outerRadius={70} dataKey="v">
                                <Cell fill="#22c55e" /><Cell fill="#6366f1" /><Cell fill="#ef4444" />
                             </Pie>
                             <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                   </div>
                </div>
                <div className="bg-white border border-surface-250 shadow-sm rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                   <h4 className="text-sm font-bold text-surface-900 mb-6 w-full text-left">Quiz Scores</h4>
                   <div className="h-48 flex flex-col items-center justify-center text-surface-400">
                     <BarChart3 className="w-8 h-8 text-surface-300 mb-2" />
                     <p className="text-xs font-semibold">No data available yet</p>
                     <p className="text-[10px] mt-1">Cohort-specific topic scores will display here.</p>
                   </div>
                </div>
             </div>

             {/* Enrolled Employees Section */}
             <div className="space-y-4">
                <h4 className="text-sm font-bold text-surface-900">Enrolled Employees ({selectedGroup.employees ? selectedGroup.employees.length : 0})</h4>
                <div className="border border-surface-200 rounded-2xl overflow-hidden bg-white">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="border-b border-surface-200 bg-surface-50 text-[10px] font-bold text-surface-500 uppercase tracking-wider">
                               <th className="px-4 py-3">Employee Name</th>
                               <th className="px-4 py-3">Department</th>
                               <th className="px-4 py-3">Completed/Assigned</th>
                               <th className="px-4 py-3">Avg Quiz Score</th>
                               <th className="px-4 py-3">Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-surface-100 text-xs text-surface-700">
                            {!selectedGroup.employees || selectedGroup.employees.length === 0 ? (
                               <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center text-surface-400 font-semibold">
                                     No employees enrolled in this group.
                                  </td>
                               </tr>
                            ) : (
                               selectedGroup.employees.map((empId: string) => {
                                  const emp = availableEmployees.find(e => String(e.id) === String(empId));
                                  if (!emp) {
                                     return (
                                        <tr key={empId}>
                                           <td className="px-4 py-3 font-semibold text-surface-400">Employee ID: {empId}</td>
                                           <td className="px-4 py-3">—</td>
                                           <td className="px-4 py-3">—</td>
                                           <td className="px-4 py-3">—</td>
                                           <td className="px-4 py-3">—</td>
                                        </tr>
                                     );
                                  }
                                  return (
                                     <tr key={emp.id} className="hover:bg-surface-50/50 transition-colors">
                                        <td className="px-4 py-3 font-bold text-surface-900">{emp.name}</td>
                                        <td className="px-4 py-3">{emp.department}</td>
                                        <td className="px-4 py-3 font-semibold">
                                           {emp.completedCourses} / {emp.assignedCourses}
                                        </td>
                                        <td className="px-4 py-3 font-semibold">{emp.averageQuizScore}%</td>
                                        <td className="px-4 py-3">
                                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                              emp.status === 'Compliant' ? 'bg-success-50 text-success-700 border border-success-100' :
                                              emp.status === 'At Risk' ? 'bg-warning-50 text-warning-700 border border-warning-105' :
                                              'bg-danger-50 text-danger-700 border border-danger-100'
                                           }`}>
                                              {emp.status}
                                           </span>
                                        </td>
                                     </tr>
                                  );
                               })
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>

             {/* Delete Group Action */}
             <div className="pt-4 border-t border-surface-100 flex justify-end">
                <button
                   onClick={() => handleDeleteGroup(selectedGroup.id, selectedGroup.name)}
                   className="flex items-center gap-2 px-4 py-2 bg-danger-600 hover:bg-danger-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-danger-500/10"
                >
                   <Trash2 className="w-3.5 h-3.5" /> Delete Cohort
                </button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

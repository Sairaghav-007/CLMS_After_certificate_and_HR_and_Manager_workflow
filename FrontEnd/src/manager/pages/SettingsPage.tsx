import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Bell, Shield, 
  BarChart3, Moon, Sun, Monitor, 
  LogOut,
  Link2 as Linkedin, Camera, Save, RefreshCw
} from 'lucide-react';
import { PageHeader, StatusBadge } from '../components/ui';
import { useSettingsStore, useThemeStore, useAuditStore } from '../stores';
import { mockManagerProfile } from '../data/mockData';

export default function SettingsPage() {
  const { settings, updateNotificationPref } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();
  const addLog = useAuditStore(s => s.addLog);
  const [activeTab, setActiveTab] = useState('Profile');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addLog({ action: 'Settings Updated', user: 'Sarah Mitchell', details: 'Updated user preferences' });
    }, 1000);
  };

  const menuItems = [
    { id: 'Profile', icon: User },
    { id: 'Notifications', icon: Bell },
    { id: 'Reports', icon: BarChart3 },
    { id: 'Security', icon: Shield },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto text-left space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences, notification rules, and reporting frequencies"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.id}
            </button>
          ))}
          <div className="h-px bg-surface-200 dark:bg-surface-800 my-4" />
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-danger-500 hover:bg-danger-50 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="glass-card rounded-2xl p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'Profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                        {mockManagerProfile.avatar}
                      </div>
                      <button className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white dark:bg-surface-800 text-surface-600 shadow-lg border border-surface-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-surface-900 dark:text-white">{mockManagerProfile.name}</h3>
                      <p className="text-sm text-surface-500">{mockManagerProfile.designation} • {mockManagerProfile.department}</p>
                      <div className="mt-3 flex gap-2">
                         <StatusBadge status="Active" size="md" />
                         <StatusBadge status="Primary Admin" size="md" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Full Name</label>
                       <input value={mockManagerProfile.name} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 text-xs font-bold font-medium" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Email Address</label>
                       <input value={mockManagerProfile.email} className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 text-xs font-bold font-medium" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">LinkedIn Profile (URL)</label>
                       <div className="relative">
                          <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A66C2]" />
                          <input defaultValue={mockManagerProfile.linkedin} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 text-xs font-bold font-medium" />
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'Notifications' && (
                <motion.div key="notif" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                   <div>
                      <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-1">Communication Channels</h4>
                      <p className="text-xs text-surface-500 mb-6">Choose how you want to receive alerts and notifications.</p>
                      
                      <div className="space-y-3">
                         {[
                           { id: 'email', label: 'Email Notifications', desc: 'Receive daily summaries and critical alerts via email.' },
                           { id: 'push', label: 'Browser Push Notifications', desc: 'Real-time alerts in your browser when a staff member submits a course.' },
                           { id: 'inApp', label: 'In-App Notifications', desc: 'Activity feed updates within the management portal.' }
                         ].map(pref => (
                           <div key={pref.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700">
                              <div>
                                 <p className="text-xs font-bold text-surface-900 dark:text-white">{pref.label}</p>
                                 <p className="text-[10px] text-surface-500">{pref.desc}</p>
                              </div>
                              <button 
                                onClick={() => updateNotificationPref(pref.id as any, !settings.notifications[pref.id as 'email'])}
                                className={`w-10 h-5 rounded-full transition-all relative ${settings.notifications[pref.id as 'email'] ? 'bg-primary-500' : 'bg-surface-300'}`}
                              >
                                 <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.notifications[pref.id as 'email'] ? 'left-6' : 'left-1'}`} />
                              </button>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="pt-6 border-t border-surface-200 dark:border-surface-800">
                      <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-4">Appearance Theme</h4>
                      <div className="flex gap-4">
                         {[
                           { id: 'light', icon: Sun, label: 'Light' },
                           { id: 'dark', icon: Moon, label: 'Dark' },
                           { id: 'system', icon: Monitor, label: 'System' }
                         ].map(t => (
                           <button
                             key={t.id}
                             onClick={() => setTheme(t.id as any)}
                             className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                               theme === t.id 
                                 ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-500 text-primary-600' 
                                 : 'bg-surface-50 dark:bg-surface-800 border-surface-100 text-surface-400 hover:border-surface-300'
                             }`}
                           >
                              <t.icon className="w-5 h-5" />
                              <span className="text-xs font-bold">{t.label}</span>
                           </button>
                         ))}
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'Reports' && (
                <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                    <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-4">Report Preferences</h4>
                   <div className="space-y-4">
                      <div>
                         <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest block mb-2">Automated Report Frequency</label>
                         <div className="flex gap-2">
                           {['Daily', 'Weekly'].map(freq => (
                             <button
                               key={freq}
                               className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${freq === 'Weekly' ? 'bg-primary-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-500'}`}
                             >
                               {freq}
                             </button>
                           ))}
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12 pt-8 border-t border-surface-200 dark:bg-surface-800 flex items-center justify-between">
               <button className="text-xs font-bold text-surface-400 hover:text-surface-600 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Discard Changes
               </button>
               <button
                 onClick={handleSave}
                 className="flex items-center gap-2 py-3 px-8 rounded-xl gradient-primary text-white text-sm font-bold shadow-lg shadow-primary-500/20"
               >
                 {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 {isSaving ? 'Saving...' : 'Save Settings'}
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


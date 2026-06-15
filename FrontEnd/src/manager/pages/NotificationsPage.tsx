import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCircle2, ShieldAlert, BookOpen, 
  Search, Check, MoreVertical, 
  Settings, Clock, ArrowRight
} from 'lucide-react';
import { PageHeader } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../stores';
import type { NotificationType } from '../types';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const [filter, setFilter] = useState<NotificationType | 'All'>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const matchFilter = filter === 'All' || n.type === filter;
      const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [notifications, filter, search]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'Compliance Alert': return <ShieldAlert className="w-5 h-5 text-danger-500" />;
      case 'Review Request': return <BookOpen className="w-5 h-5 text-primary-500" />;
      case 'Group Update': return <CheckCircle2 className="w-5 h-5 text-accent-500" />;
      case 'Course Reminder': return <Clock className="w-5 h-5 text-warning-500" />;
      default: return <Bell className="w-5 h-5 text-surface-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with team progress, compliance alerts, and new course submissions"
        actions={
          <div className="flex gap-2">
             <button
              onClick={markAllRead}
              className="px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-black text-xs font-bold hover:bg-surface-200 transition-all flex items-center gap-2"
            >
              <Check className="w-3.5 h-3.5" /> Mark All as Read
            </button>
            <button
               className="p-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-700 transition-all"
            >
               <Settings className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
           {(['All', 'Compliance Alert', 'Review Request', 'Course Reminder', 'Group Update'] as const).map(f => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                 filter === f 
                  ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
               }`}
             >
               {f === 'All' ? 'All' : f.split(' ')[0]}
             </button>
           ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="pl-9 pr-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 border-none text-xs w-full sm:w-64 focus:ring-2 focus:ring-primary-500/20 outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((n, i) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => markRead(n.id)}
              className={`glass-card rounded-2xl p-4 flex items-start gap-4 border cursor-pointer hover:shadow-md transition-all ${
                n.read 
                  ? 'bg-white/50 dark:bg-surface-900/30 border-transparent' 
                  : 'bg-white dark:bg-surface-800 border-primary-100 dark:border-primary-900 shadow-lg shadow-primary-500/5'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                n.read ? 'bg-surface-100 dark:bg-surface-800' : 'bg-primary-50 dark:bg-primary-950/30'
              }`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs font-bold truncate ${n.read ? 'text-surface-700 dark:text-black' : 'text-surface-900 dark:text-black'}`}>
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />
                    )}
                  </div>
                  <span className="text-[10px] text-surface-400 font-medium">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[11px] text-surface-500 dark:text-black leading-relaxed max-w-2xl">{n.message}</p>
                {n.actionUrl && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(n.id);
                      navigate(n.actionUrl!);
                    }}
                    className="text-[10px] font-bold text-primary-600 hover:text-primary-700 mt-2 flex items-center gap-1"
                  >
                    Take Action <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="p-1 px-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
                    <MoreVertical className="w-4 h-4" />
                 </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <div className="text-center py-24">
             <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-surface-300" />
             </div>
             <h3 className="text-base font-bold text-surface-900 dark:text-black">All caught up</h3>
             <p className="text-sm text-surface-500">No notifications found matches your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}


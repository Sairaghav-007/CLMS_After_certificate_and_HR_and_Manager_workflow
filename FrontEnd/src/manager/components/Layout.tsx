import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSidebarStore } from '../stores';
import { motion } from 'framer-motion';

export default function Layout() {
  const { collapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-black gradient-mesh transition-colors duration-300 flex overflow-hidden">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out" 
        style={{ marginLeft: collapsed ? 120 : 312 }}
      >
        <Navbar />
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-y-auto p-4 lg:p-8"
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
}


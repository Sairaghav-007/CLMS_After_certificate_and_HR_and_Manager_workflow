import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';

interface PlaceholderProps {
  title: string;
}

export default function Placeholder({ title }: PlaceholderProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] rounded-3xl border-2 border-dashed",
        isDark ? "border-surface-700 bg-surface-800/20" : "border-surface-200 bg-surface-50/50"
      )}
    >
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6",
        isDark ? "bg-primary-500/10" : "bg-primary-50"
      )}>
        <Construction className="w-8 h-8 text-primary-500" />
      </div>
      <h1 className={cn(
        "text-2xl font-bold mb-2",
        isDark ? "text-white" : "text-surface-900"
      )}>
        {title}
      </h1>
      <p className={cn(
        "text-center max-w-md",
        isDark ? "text-surface-400" : "text-surface-500"
      )}>
        We're working hard to bring you the {title} module. This feature will be available in the next release.
      </p>
    </motion.div>
  );
}


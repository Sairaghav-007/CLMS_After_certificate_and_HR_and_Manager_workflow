import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { useThemeStore } from '@/hr/store';
import { cn } from '@/hr/lib/utils';

interface Step {
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto px-4 overflow-x-auto pb-4 custom-scrollbar">
      {/* Connector Line */}
      <div className="absolute top-5 left-10 right-10 h-0.5 bg-surface-200 dark:bg-surface-800 -z-10" />
      <motion.div 
        className="absolute top-5 left-10 h-0.5 bg-primary-500 -z-10"
        initial={{ width: '0%' }}
        animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        transition={{ duration: 0.5 }}
      />

      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="flex flex-col items-center min-w-[120px]">
            <motion.div
              initial={false}
              animate={{
                scale: isActive ? 1.2 : 1,
                backgroundColor: isCompleted || isActive ? 'var(--color-primary-600)' : isDark ? '#1e293b' : '#ffffff',
                borderColor: isCompleted || isActive ? 'var(--color-primary-600)' : isDark ? '#334155' : '#e2e8f0',
              }}
              className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center relative z-10 transition-colors",
                !isCompleted && !isActive && "text-surface-400"
              )}
            >
              {isCompleted ? (
                <Check className="w-6 h-6 text-white" />
              ) : isActive ? (
                <span className="text-white font-bold">{index + 1}</span>
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </motion.div>
            
            <div className="mt-3 text-center">
              <p className={cn(
                "text-sm font-bold truncate max-w-[150px]",
                isActive ? "text-primary-600" : isDark ? "text-surface-300" : "text-surface-700"
              )}>
                {step.title}
              </p>
              <p className={cn(
                "text-xs truncate max-w-[150px]",
                isDark ? "text-surface-500" : "text-surface-400"
              )}>
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};


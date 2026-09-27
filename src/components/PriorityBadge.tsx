import React from 'react';
import { Priority } from '../types';
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<
    Priority,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    critical: {
      label: 'Critical',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/50',
      icon: <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
    },
    high: {
      label: 'High',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/50',
      icon: <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
    },
    medium: {
      label: 'Medium',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/50',
      icon: <ArrowUp className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    },
    low: {
      label: 'Low',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/50',
      icon: <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />,
    },
  };

  const config = configs[priority] || configs.medium;
  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 font-bold uppercase tracking-wide'
      : 'text-xs px-2.5 py-0.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} transition-colors whitespace-nowrap`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};

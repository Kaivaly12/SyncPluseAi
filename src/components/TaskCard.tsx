import React from 'react';
import { motion } from 'motion/react';
import { Task, TaskStatus } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { openGoogleCalendar } from '../utils/calendar';
import {
  Calendar,
  Clock,
  GripVertical,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
  onDragEnd,
  isDragging = false,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Calculate deadline status
  const getDeadlineInfo = () => {
    if (!task.dueDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (task.status === 'done') {
      return { label: `Completed (${task.dueDate})`, color: 'text-slate-500 dark:text-slate-400', isOverdue: false };
    }

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}d overdue`,
        color: 'text-rose-600 dark:text-rose-400 font-semibold',
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50',
        isOverdue: true,
      };
    }
    if (diffDays === 0) {
      return {
        label: 'Due Today',
        color: 'text-amber-600 dark:text-amber-400 font-semibold',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50',
        isOverdue: false,
      };
    }
    if (diffDays === 1) {
      return {
        label: 'Tomorrow',
        color: 'text-indigo-600 dark:text-indigo-400 font-medium',
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
        isOverdue: false,
      };
    }
    return {
      label: task.dueDate,
      color: 'text-slate-500 dark:text-slate-400',
      bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      isOverdue: false,
    };
  };

  const deadline = getDeadlineInfo();

  // Status progression map for mobile quick moves
  const statusList: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
  const currentIndex = statusList.indexOf(task.status);
  const prevStatus = currentIndex > 0 ? statusList[currentIndex - 1] : null;
  const nextStatus = currentIndex < statusList.length - 1 ? statusList[currentIndex + 1] : null;

  const isDone = task.status === 'done';
  const isInProgress = task.status === 'in_progress';

  return (
    <motion.div
      id={`task-card-${task.id}`}
      draggable
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={`group relative p-4 rounded-xl border transition-colors cursor-grab active:cursor-grabbing select-none ${
        isDone
          ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100'
          : isInProgress
          ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60 shadow-xs hover:shadow-md'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
      } ${isDragging ? 'opacity-30 border-indigo-500 scale-[0.98]' : ''}`}
    >
      {/* Top Bar: Drag Grip, Priority, WBS & More Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Subtle 3-dot grip indicator from design */}
          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 -ml-1">
            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
          </div>
          <PriorityBadge priority={task.priority} size="sm" />
          {task.discipline && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Layers className="w-3 h-3 text-slate-400" />
              {task.discipline}
            </span>
          )}
          {task.wbsCode && (
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {task.wbsCode}
            </span>
          )}
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            id={`task-menu-btn-${task.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Task options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div
                className="absolute right-0 top-7 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-30 text-xs text-slate-700 dark:text-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openGoogleCalendar(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-indigo-600 dark:text-indigo-400 font-medium"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Add to Google Calendar
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(task.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h3
        onClick={() => onEdit(task)}
        className={`font-semibold text-sm leading-snug cursor-pointer mb-1 transition-colors ${
          isDone
            ? 'line-through text-slate-400 dark:text-slate-500'
            : 'text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400'
        }`}
      >
        {task.title}
      </h3>

      {/* Description Preview */}
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 font-normal leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-1">
          <span>Progress</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{task.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isDone
                ? 'bg-emerald-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }}
          />
        </div>
      </div>

      {/* Bottom Footer: Deadline, Google Calendar Sync, and Mobile Next/Prev buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        {/* Deadline Badge */}
        {deadline ? (
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] ${deadline.bg} ${deadline.color}`}
            title={`Due Date: ${task.dueDate}`}
          >
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{deadline.label}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">No deadline</span>
        )}

        <div className="flex items-center gap-1">
          {/* Quick 1-click Google Calendar Link */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openGoogleCalendar(task);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Sync with Google Calendar"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          {/* Quick Column Shift for Mobile or Keyboard */}
          {prevStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, prevStatus);
              }}
              className="md:hidden p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title={`Move back to ${prevStatus.replace('_', ' ')}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {nextStatus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, nextStatus);
              }}
              className="md:hidden p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title={`Advance to ${nextStatus.replace('_', ' ')}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

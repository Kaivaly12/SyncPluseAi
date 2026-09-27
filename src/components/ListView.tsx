import React from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { PriorityBadge } from './PriorityBadge';
import { openGoogleCalendar } from '../utils/calendar';
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ListViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onSort: (field: 'dueDate' | 'priority' | 'progress' | 'title') => void;
  sortField: string;
  sortAsc: boolean;
}

const STATUS_LABELS: Record<TaskStatus, { label: string; bg: string; text: string }> = {
  todo: { label: 'To Do', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
  in_progress: { label: 'In Progress', bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300' },
  review: { label: 'In Review', bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300' },
  done: { label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300' },
};

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onSort,
  sortField,
  sortAsc,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => onSort('title')}
                  className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 font-semibold"
                >
                  Task & WBS
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3.5 px-4">Discipline</th>
              <th className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => onSort('priority')}
                  className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 font-semibold"
                >
                  Priority
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => onSort('progress')}
                  className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 font-semibold"
                >
                  Progress
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => onSort('dueDate')}
                  className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-100 font-semibold"
                >
                  Deadline
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {tasks.map((task) => {
              const statusCfg = STATUS_LABELS[task.status] || STATUS_LABELS.todo;
              const isOverdue =
                task.status !== 'done' &&
                task.dueDate &&
                task.dueDate < new Date().toISOString().split('T')[0];

              return (
                <tr
                  key={task.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Title & WBS */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-start gap-2">
                      <div>
                        <span
                          onClick={() => onEditTask(task)}
                          className={`font-semibold cursor-pointer text-sm hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 ${
                            task.status === 'done'
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.wbsCode && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            WBS: {task.wbsCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Discipline */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {task.discipline || 'General'}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <PriorityBadge priority={task.priority} size="sm" />
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border border-transparent focus:border-indigo-500 focus:outline-none cursor-pointer ${statusCfg.bg} ${statusCfg.text}`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="done">Completed</option>
                    </select>
                  </td>

                  {/* Progress */}
                  <td className="py-3.5 px-4 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            task.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {task.progress}%
                      </span>
                    </div>
                  </td>

                  {/* Deadline */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock
                        className={`w-3.5 h-3.5 ${
                          isOverdue
                            ? 'text-rose-500'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span
                        className={`font-mono ${
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {task.dueDate || 'No Date'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openGoogleCalendar(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        title="Add to Google Calendar"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Task"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No tasks matching the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

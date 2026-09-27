import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { Plus, Circle, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onReorderTasks: (reorderedTasks: { id: string; order: number; status?: TaskStatus }[]) => void;
  onOpenCreateModal: (status?: TaskStatus) => void;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  dotColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'todo',
    title: 'To Do',
    dotColor: 'bg-slate-400',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 'review',
    title: 'In Review',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'done',
    title: 'Completed',
    dotColor: 'bg-emerald-500',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onReorderTasks,
  onOpenCreateModal,
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<TaskStatus>('todo');

  // Filter tasks by column and sort by order
  const getColumnTasks = (status: TaskStatus) => {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
    setDragOverTaskId(null);
  };

  const handleDragOverColumn = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask) return;

    const sourceStatus = draggedTask.status;
    const isSameColumn = sourceStatus === targetStatus;

    const targetColumnTasks = getColumnTasks(targetStatus).filter((t) => t.id !== draggedTask.id);

    let insertIndex = targetColumnTasks.length;
    if (dragOverTaskId) {
      const foundIdx = targetColumnTasks.findIndex((t) => t.id === dragOverTaskId);
      if (foundIdx !== -1) {
        insertIndex = foundIdx;
      }
    }

    // Insert dragged task at insertIndex
    const newTargetList = [...targetColumnTasks];
    newTargetList.splice(insertIndex, 0, {
      ...draggedTask,
      status: targetStatus,
    });

    // Prepare batch update payloads
    const updates: { id: string; order: number; status?: TaskStatus }[] = [];

    newTargetList.forEach((task, index) => {
      updates.push({
        id: task.id,
        order: index,
        status: targetStatus,
      });
    });

    // If moved from another column, re-index source column tasks
    if (!isSameColumn) {
      const sourceColumnTasks = getColumnTasks(sourceStatus).filter((t) => t.id !== draggedTask.id);
      sourceColumnTasks.forEach((task, index) => {
        updates.push({
          id: task.id,
          order: index,
          status: sourceStatus,
        });
      });
    }

    onReorderTasks(updates);
    handleDragEnd();
  };

  return (
    <div className="w-full">
      {/* Mobile Column Navigation Tabs */}
      <div className="flex md:hidden items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 overflow-x-auto gap-1">
        {COLUMNS.map((col) => {
          const count = getColumnTasks(col.id).length;
          const isActive = mobileActiveTab === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileActiveTab(col.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${col.dotColor}`}></span>
              <span>{col.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive
                    ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((column) => {
          const columnTasks = getColumnTasks(column.id);
          const isMobileHidden = mobileActiveTab !== column.id;
          const isDropTarget = dragOverColumn === column.id;

          return (
            <motion.div
              layout
              key={column.id}
              id={`kanban-column-${column.id}`}
              className={`flex flex-col bg-slate-100/70 dark:bg-slate-900/40 rounded-2xl p-4 min-h-[500px] border border-slate-200/60 dark:border-slate-800/60 transition-colors ${
                isDropTarget ? 'ring-2 ring-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20' : ''
              } ${isMobileHidden ? 'hidden md:flex' : 'flex'}`}
              onDragOver={(e) => handleDragOverColumn(e, column.id)}
              onDrop={(e) => handleDropOnColumn(e, column.id)}
            >
              {/* Column Header matching Clean Minimalism design */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`}></span>
                    {column.title}
                  </h3>
                  <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {columnTasks.length}
                  </span>
                </div>

                <button
                  id={`column-add-btn-${column.id}`}
                  type="button"
                  onClick={() => onOpenCreateModal(column.id)}
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded-md"
                  title={`Add task to ${column.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks List Container */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                <AnimatePresence initial={false} mode="popLayout">
                  {columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      layoutId={task.id}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 35,
                        mass: 0.8,
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverTaskId(task.id);
                      }}
                    >
                      {dragOverTaskId === task.id && draggedTask?.id !== task.id && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, height: 0, scale: 0.95 }}
                          animate={{ opacity: 1, height: 48, scale: 1 }}
                          exit={{ opacity: 0, height: 0, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="w-full rounded-xl border-2 border-dashed border-indigo-400/80 dark:border-indigo-500/70 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 pointer-events-none select-none shadow-xs"
                        >
                          <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                            Drop to place here
                          </span>
                        </motion.div>
                      )}
                      <TaskCard
                        task={task}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onStatusChange={onStatusChange}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedTask?.id === task.id}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {columnTasks.length === 0 && (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onOpenCreateModal(column.id)}
                    className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-colors text-center"
                  >
                    <Plus className="w-5 h-5 mb-1 text-slate-300 dark:text-slate-600" />
                    <span className="text-xs font-medium">No tasks in {column.title}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Drop tasks here or click to create
                    </span>
                  </motion.div>
                )}

                {/* Clean Minimalism bottom "+ Add Task" button */}
                <button
                  type="button"
                  onClick={() => onOpenCreateModal(column.id)}
                  className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-800 text-xs font-semibold flex items-center justify-center gap-1 transition-all mt-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

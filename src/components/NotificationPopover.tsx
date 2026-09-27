import React, { useState } from 'react';
import { UserNotification, Task } from '../types';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  CheckCheck,
  ShieldCheck,
  Sparkles,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  isNotificationSupported,
  requestNotificationPermission,
  sendPushNotification,
} from '../utils/notifications';

interface NotificationPopoverProps {
  notifications: UserNotification[];
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (taskId: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  isOpen,
  onClose,
  onSelectTask,
  onMarkAllRead,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string>(() => {
    return isNotificationSupported() ? Notification.permission : 'unsupported';
  });
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermissionStatus(result);
    if (result === 'granted') {
      sendPushNotification('Task Management Alerts Active!', {
        body: 'You will now receive desktop push notifications for upcoming task deadlines.',
      });
    }
  };

  const handleSendTestNotification = () => {
    const sent = sendPushNotification('Upcoming Deadline Test', {
      body: 'Hydro-Testing Line 24-XX Crude Spool is scheduled for inspection tomorrow at 09:00.',
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const overdueCount = notifications.filter((n) => n.type === 'overdue').length;
  const dueSoonCount = notifications.filter((n) => n.type === 'due_soon').length;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        id="notification-popover-container"
        className="absolute right-0 top-12 w-96 max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-fadeIn text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Deadline Alerts & Push
            </h3>
            {notifications.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                {notifications.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification System Status Banner */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Push Notifications:
              </span>
              <span
                className={`font-mono text-[11px] font-medium uppercase px-1.5 py-0.5 rounded ${
                  permissionStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {permissionStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {permissionStatus !== 'granted' ? (
              <button
                id="enable-push-notifications-btn"
                type="button"
                onClick={handleRequestPermission}
                className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-center shadow-xs"
              >
                Enable Push Alerts
              </button>
            ) : (
              <button
                id="test-push-notification-btn"
                type="button"
                onClick={handleSendTestNotification}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 rounded-lg font-medium transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {testSent ? 'Alert Dispatched!' : 'Test Push Alert'}
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Counts */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <div>
              <span className="font-bold text-rose-700 dark:text-rose-300 text-sm">
                {overdueCount}
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                Overdue Tasks
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
            <Clock className="w-4 h-4 text-amber-500" />
            <div>
              <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                {dueSoonCount}
              </span>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                Upcoming Deadlines
              </span>
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                onSelectTask(n.taskId);
                onClose();
              }}
              className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {n.type === 'overdue' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {n.taskTitle}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                      <span>Due: {n.dueDate}</span>
                      <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {n.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              <CheckCheck className="w-8 h-8 mx-auto mb-1 text-emerald-500 opacity-60" />
              <p className="font-medium text-xs text-slate-700 dark:text-slate-300">
                All deadlines on track!
              </p>
              <p className="text-[11px]">No overdue or approaching tasks</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

import { Task, UserNotification } from '../types';

/**
 * Check if the browser supports Notification API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'default';
  }
}

/**
 * Play a pleasant subtle audio chime using Web Audio API (no external file required)
 */
export function playNotificationTone(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio error if blocked by autoplay policy
  }
}

/**
 * Show a system desktop push notification if permission is granted
 */
export function sendPushNotification(title: string, options?: NotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    playNotificationTone();
    return true;
  } catch (err) {
    console.warn('Push notification delivery failed:', err);
    return false;
  }
}

/**
 * Scan tasks to generate notifications for overdue or impending deadlines
 */
export function scanTasksForDeadlines(tasks: Task[]): UserNotification[] {
  const notifications: UserNotification[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  tasks.forEach((task) => {
    if (task.status === 'done' || !task.dueDate) return;

    if (task.dueDate < todayStr) {
      // Overdue
      notifications.push({
        id: `overdue-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'overdue',
        message: `Task is OVERDUE! Due date was ${task.dueDate}. Priority: ${task.priority.toUpperCase()}`,
        dueDate: task.dueDate,
        read: false,
        timestamp: Date.now(),
        priority: task.priority,
      });
    } else if (task.dueDate === todayStr) {
      // Due today
      notifications.push({
        id: `today-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'due_soon',
        message: `Task deadline is TODAY (${task.dueDate})! Progress: ${task.progress}%`,
        dueDate: task.dueDate,
        read: false,
        timestamp: Date.now(),
        priority: task.priority,
      });
    } else if (task.dueDate === tomorrowStr) {
      // Due tomorrow
      notifications.push({
        id: `tomorrow-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        type: 'due_soon',
        message: `Task deadline is tomorrow (${task.dueDate}). Priority: ${task.priority.toUpperCase()}`,
        dueDate: task.dueDate,
        read: false,
        timestamp: Date.now(),
        priority: task.priority,
      });
    }
  });

  return notifications;
}

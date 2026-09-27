import { Task } from '../types';

/**
 * Generate a direct Google Calendar web event URL
 * https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...
 */
export function createGoogleCalendarUrl(task: Task): string {
  const title = encodeURIComponent(`[Task] ${task.title}`);
  const descriptionText = [
    `Priority: ${task.priority.toUpperCase()}`,
    `Status: ${task.status}`,
    task.discipline ? `Discipline: ${task.discipline}` : '',
    task.wbsCode ? `WBS Code: ${task.wbsCode}` : '',
    task.progress !== undefined ? `Progress: ${task.progress}%` : '',
    '',
    task.description,
  ]
    .filter(Boolean)
    .join('\n');

  const details = encodeURIComponent(descriptionText);

  // Format date as YYYYMMDD
  let dateFormatted = '';
  if (task.dueDate) {
    const cleanDate = task.dueDate.replace(/-/g, '');
    // All-day event or 9am-10am slot
    dateFormatted = `${cleanDate}T090000Z/${cleanDate}T100000Z`;
  } else {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    dateFormatted = `${today}T090000Z/${today}T100000Z`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateFormatted}&details=${details}`;
}

/**
 * Open direct Google Calendar link in a new window or tab
 */
export function openGoogleCalendar(task: Task): void {
  const url = createGoogleCalendarUrl(task);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Generate and download an iCalendar (.ics) file containing tasks
 * Supported directly by Google Calendar Import, Apple Calendar, Outlook
 */
export function exportToICalendar(tasks: Task[], filename = 'task-deadlines.ics'): void {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Task Management App//Google Calendar Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const formatDate = (dateStr: string) => {
    return dateStr.replace(/-/g, '') + 'T090000Z';
  };

  const formatEndDate = (dateStr: string) => {
    return dateStr.replace(/-/g, '') + 'T100000Z';
  };

  tasks.forEach((task) => {
    if (!task.dueDate) return;
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const start = formatDate(task.dueDate);
    const end = formatEndDate(task.dueDate);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${task.id}@taskmanagement.app`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${escapeICal(task.title)}`);
    lines.push(
      `DESCRIPTION:${escapeICal(
        `Priority: ${task.priority.toUpperCase()} | Status: ${task.status}\n${task.description || ''}`
      )}`
    );
    lines.push(`STATUS:${task.status === 'done' ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeICal(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

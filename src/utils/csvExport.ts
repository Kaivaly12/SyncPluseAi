import { Task } from '../types';

/**
 * Escapes a field for CSV according to RFC 4180
 */
function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '""';
  const stringValue = String(field);
  // If field contains quotes, commas, or newlines, enclose in quotes and double internal quotes
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return `"${stringValue}"`;
}

/**
 * Export tasks array as a downloadable CSV file
 */
export function exportTasksToCsv(tasks: Task[], filename = 'task-management-report.csv'): void {
  const headers = [
    'Task ID',
    'WBS / Code',
    'Discipline / Category',
    'Title',
    'Description',
    'Priority',
    'Status',
    'Progress (%)',
    'Due Date',
    'Tags',
    'Created At',
    'Updated At',
  ];

  const rows = tasks.map((t) => [
    escapeCsvField(t.id),
    escapeCsvField(t.wbsCode || 'N/A'),
    escapeCsvField(t.discipline || 'General'),
    escapeCsvField(t.title),
    escapeCsvField(t.description),
    escapeCsvField(t.priority.toUpperCase()),
    escapeCsvField(t.status.replace('_', ' ').toUpperCase()),
    escapeCsvField(t.progress || 0),
    escapeCsvField(t.dueDate || ''),
    escapeCsvField((t.tags || []).join('; ')),
    escapeCsvField(t.createdAt ? new Date(t.createdAt).toISOString() : ''),
    escapeCsvField(t.updatedAt ? new Date(t.updatedAt).toISOString() : ''),
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\r\n');

  // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

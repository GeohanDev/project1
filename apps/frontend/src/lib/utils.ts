import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { SubmissionStatus } from '@reporthub/shared';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy HH:mm');
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function statusColor(status: SubmissionStatus | string): string {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-800';
    case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'OVERDUE': return 'bg-red-100 text-red-800';
    case 'REJECTED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function frequencyLabel(f: string): string {
  const map: Record<string, string> = {
    DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly', YEARLY: 'Yearly', PROJECT_COMPLETION: 'Project / Completion',
  };
  return map[f] || f;
}

export function roleLabel(r: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin', HOD: 'Head of Department', PD: 'Project Director', STAFF: 'Staff',
  };
  return map[r] || r;
}

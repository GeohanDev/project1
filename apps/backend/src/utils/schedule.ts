import {
  startOfDay, endOfDay, addDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear, format,
} from 'date-fns';
import { Frequency } from '@reporthub/shared';

export interface PeriodRange {
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
}

export function getCurrentPeriod(frequency: Frequency, cutoffDays: number, referenceDate: Date = new Date()): PeriodRange | null {
  const now = referenceDate;

  switch (frequency) {
    case 'DAILY': {
      const periodStart = startOfDay(now);
      const periodEnd = endOfDay(now);
      const dueDate = addDays(periodEnd, cutoffDays);
      return { periodStart, periodEnd, dueDate };
    }
    case 'WEEKLY': {
      const periodStart = startOfWeek(now, { weekStartsOn: 1 });
      const periodEnd = endOfWeek(now, { weekStartsOn: 1 });
      const dueDate = addDays(periodEnd, cutoffDays);
      return { periodStart, periodEnd, dueDate };
    }
    case 'MONTHLY': {
      const periodStart = startOfMonth(now);
      const periodEnd = endOfMonth(now);
      const dueDate = addDays(periodEnd, cutoffDays);
      return { periodStart, periodEnd, dueDate };
    }
    case 'QUARTERLY': {
      const periodStart = startOfQuarter(now);
      const periodEnd = endOfQuarter(now);
      const dueDate = addDays(periodEnd, cutoffDays);
      return { periodStart, periodEnd, dueDate };
    }
    case 'YEARLY': {
      const periodStart = startOfYear(now);
      const periodEnd = endOfYear(now);
      const dueDate = addDays(periodEnd, cutoffDays);
      return { periodStart, periodEnd, dueDate };
    }
    case 'PROJECT_COMPLETION':
      return null;
    default:
      return null;
  }
}

export function formatPeriodLabel(frequency: Frequency, periodStart: Date, periodEnd: Date): string {
  switch (frequency) {
    case 'DAILY':
      return format(periodStart, 'dd MMM yyyy');
    case 'WEEKLY':
      return `Week of ${format(periodStart, 'dd MMM')} - ${format(periodEnd, 'dd MMM yyyy')}`;
    case 'MONTHLY':
      return format(periodStart, 'MMMM yyyy');
    case 'QUARTERLY': {
      const q = Math.floor(periodStart.getMonth() / 3) + 1;
      return `Q${q} ${format(periodStart, 'yyyy')}`;
    }
    case 'YEARLY':
      return format(periodStart, 'yyyy');
    default:
      return `${format(periodStart, 'dd MMM yyyy')} - ${format(periodEnd, 'dd MMM yyyy')}`;
  }
}

import { cn, statusColor } from '@/lib/utils';
import { SUBMISSION_STATUSES } from '@reporthub/shared';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('badge', statusColor(status))}>
      {SUBMISSION_STATUSES[status] || status}
    </span>
  );
}

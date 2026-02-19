'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { timeAgo, cn } from '@/lib/utils';
import { Bell, CheckCheck, AlertTriangle, Clock, Info, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  REMINDER: Clock,
  OVERDUE: AlertTriangle,
  APPROVAL: CheckCircle,
  INFO: Info,
};

const TYPE_COLORS: Record<string, string> = {
  REMINDER: 'text-blue-500',
  OVERDUE: 'text-red-500',
  APPROVAL: 'text-green-500',
  INFO: 'text-gray-500',
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ notifications: Notification[]; unreadCount: number }>('/api/notifications'),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/api/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put('/api/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        action={unreadCount > 0 ? (
          <button className="btn-secondary btn-sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        ) : undefined}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Info;
            const iconColor = TYPE_COLORS[n.type] || 'text-gray-500';
            const content = (
              <div
                className={cn(
                  'card flex gap-4 cursor-pointer transition-colors hover:border-primary-200',
                  !n.isRead && 'border-l-4 border-l-primary-500 bg-primary-50/30',
                )}
                onClick={() => { if (!n.isRead) markRead.mutate(n.id); }}
              >
                <div className={cn('shrink-0 mt-0.5', iconColor)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium', !n.isRead ? 'text-gray-900' : 'text-gray-700')}>
                      {n.title}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                </div>
                {!n.isRead && (
                  <div className="shrink-0 mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  </div>
                )}
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

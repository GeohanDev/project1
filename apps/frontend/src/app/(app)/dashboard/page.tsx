'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, timeAgo } from '@/lib/utils';
import { FileText, Clock, CheckCircle, AlertTriangle, Bell, ArrowRight, CalendarCheck } from 'lucide-react';
import Link from 'next/link';

interface DashStats {
  totalReportTypes: number;
  totalMeetingTypes: number;
  pendingPeriods: number;
  overduePeriods: number;
  submittedThisMonth: number;
  approvedThisMonth: number;
  pendingApprovals: number;
  notificationCount: number;
}

interface DashData {
  stats: DashStats;
  recentSubmissions: Array<{
    id: string;
    submittedAt: string;
    status: string;
    submittedBy: { name: string };
    submissionPeriod: { reportType: { name: string; department: { name: string } } };
    approval: { status: string } | null;
  }>;
  upcomingDue: Array<{
    id: string;
    dueDate: string;
    reportType: { name: string; department: { name: string }; frequency: string };
  }>;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashData>('/api/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="p-8">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'}`}
        subtitle={new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Clock} label="Pending Submissions" value={stats?.pendingPeriods ?? 0} color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overduePeriods ?? 0} color="bg-red-100 text-red-600" />
        <StatCard icon={CheckCircle} label="Approved This Month" value={stats?.approvedThisMonth ?? 0} color="bg-green-100 text-green-600" />
        <StatCard icon={Bell} label="Pending Approvals" value={stats?.pendingApprovals ?? 0} color="bg-blue-100 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Due */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary-600" /> Due This Week
            </h2>
            <Link href="/submissions" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!data?.upcomingDue?.length ? (
            <p className="text-sm text-gray-500 py-6 text-center">Nothing due in the next 7 days</p>
          ) : (
            <div className="space-y-2">
              {data.upcomingDue.map((period) => (
                <div key={period.id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{period.reportType.name}</p>
                    <p className="text-xs text-gray-500">{period.reportType.department.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-orange-600">Due {formatDate(period.dueDate)}</p>
                    <span className="badge bg-yellow-100 text-yellow-800">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-600" /> Recent Submissions
            </h2>
            <Link href="/submissions" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!data?.recentSubmissions?.length ? (
            <p className="text-sm text-gray-500 py-6 text-center">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {data.recentSubmissions.map((sub) => (
                <Link key={sub.id} href={`/submissions/${sub.id}`}
                  className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded px-1 -mx-1">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sub.submissionPeriod.reportType.name}</p>
                    <p className="text-xs text-gray-500">by {sub.submittedBy.name} · {timeAgo(sub.submittedAt)}</p>
                  </div>
                  <StatusBadge status={sub.approval?.status || sub.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/submissions" className="card hover:border-primary-300 transition-colors flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{stats?.totalReportTypes ?? 0} Report Types</p>
            <p className="text-xs text-gray-500">Manage submissions</p>
          </div>
        </Link>
        <Link href="/meetings" className="card hover:border-primary-300 transition-colors flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{stats?.totalMeetingTypes ?? 0} Meeting Types</p>
            <p className="text-xs text-gray-500">Track meetings</p>
          </div>
        </Link>
        <Link href="/notifications" className="card hover:border-primary-300 transition-colors flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{stats?.notificationCount ?? 0} Unread</p>
            <p className="text-xs text-gray-500">Notifications</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, frequencyLabel } from '@/lib/utils';
import { ClipboardList, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface Period {
  id: string;
  dueDate: string;
  status: string;
  reportType: { name: string; frequency: string; department: { name: string } };
  submissions: Array<{
    id: string;
    submittedAt: string;
    status: string;
    submittedBy: { name: string };
    approval: { status: string } | null;
  }>;
}

const STATUS_FILTERS = ['All', 'PENDING', 'SUBMITTED', 'APPROVED', 'OVERDUE', 'REJECTED'];

export default function SubmissionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['submission-periods'],
    queryFn: () => api.get<Period[]>('/api/submissions/periods'),
  });

  const filtered = periods.filter((p) => {
    const matchSearch =
      p.reportType.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reportType.department.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8">
      <PageHeader title="Submissions" subtitle="Track report submission periods and their status" />

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search reports..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select className="input pl-9 pr-8 appearance-none" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card animate-pulse h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No submission periods"
          description="Submission periods are auto-generated daily. Check back soon." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Report</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submitted By</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((period) => {
                const latestSub = period.submissions[0];
                return (
                  <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{period.reportType.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{period.reportType.department.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{frequencyLabel(period.reportType.frequency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(period.dueDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={period.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{latestSub ? latestSub.submittedBy.name : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {latestSub ? (
                        <Link href={`/submissions/${latestSub.id}`} className="text-sm text-primary-600 hover:underline">View</Link>
                      ) : (
                        <Link href={`/submissions/submit/${period.id}`} className="btn-primary btn-sm">Submit</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

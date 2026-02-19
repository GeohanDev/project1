'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { frequencyLabel } from '@/lib/utils';
import { FileText, Search } from 'lucide-react';

interface ReportType {
  id: string;
  name: string;
  frequency: string;
  cutoffDays: number;
  toleranceDays: number;
  isActive: boolean;
  department: { name: string };
}

const FREQ_COLORS: Record<string, string> = {
  DAILY: 'bg-blue-100 text-blue-700',
  WEEKLY: 'bg-purple-100 text-purple-700',
  MONTHLY: 'bg-green-100 text-green-700',
  QUARTERLY: 'bg-orange-100 text-orange-700',
  YEARLY: 'bg-red-100 text-red-700',
  PROJECT_COMPLETION: 'bg-gray-100 text-gray-700',
};

export default function ReportsPage() {
  const [search, setSearch] = useState('');
  const [freqFilter, setFreqFilter] = useState('All');

  const { data: reportTypes = [], isLoading } = useQuery({
    queryKey: ['report-types'],
    queryFn: () => api.get<ReportType[]>('/api/report-types'),
  });

  const frequencies = ['All', ...Array.from(new Set(reportTypes.map((r) => r.frequency)))];

  const filtered = reportTypes.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.department.name.toLowerCase().includes(search.toLowerCase());
    const matchFreq = freqFilter === 'All' || r.frequency === freqFilter;
    return matchSearch && matchFreq;
  });

  const grouped = filtered.reduce<Record<string, ReportType[]>>((acc, r) => {
    const dept = r.department.name;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(r);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <PageHeader title="Report Types" subtitle="All report types across departments" />

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search reports..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[180px]" value={freqFilter}
          onChange={(e) => setFreqFilter(e.target.value)}>
          {frequencies.map((f) => (
            <option key={f} value={f}>{f === 'All' ? 'All Frequencies' : frequencyLabel(f)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-32" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No report types found" />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dept, reports]) => (
            <div key={dept} className="card">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                {dept}
                <span className="text-xs text-gray-400 font-normal">({reports.length} reports)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                      <p className="text-xs text-gray-500">Cutoff: {r.cutoffDays}d · Tolerance: {r.toleranceDays}d</p>
                    </div>
                    <span className={`badge shrink-0 ${FREQ_COLORS[r.frequency] || 'bg-gray-100 text-gray-700'}`}>
                      {frequencyLabel(r.frequency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { formatDate, frequencyLabel } from '@/lib/utils';
import { Upload, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Period {
  id: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  reportType: { name: string; frequency: string; department: { name: string } };
}

export default function SubmitPage({ params }: { params: Promise<{ periodId: string }> }) {
  const { periodId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  const { data: periods } = useQuery({
    queryKey: ['submission-periods'],
    queryFn: () => api.get<Period[]>('/api/submissions/periods'),
  });
  const period = periods?.find((p) => p.id === periodId);

  const submit = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('notes', notes);
      files.forEach((f) => fd.append('files', f));
      return api.upload(`/api/submissions/${periodId}/submit`, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submission-periods'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.push('/submissions');
    },
    onError: (e) => setError((e as Error).message),
  });

  if (!period) {
    return <div className="p-8"><p className="text-gray-500">Loading…</p></div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/submissions" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Submissions
      </Link>
      <PageHeader title="Submit Report"
        subtitle={`${period.reportType.department.name} · ${frequencyLabel(period.reportType.frequency)}`} />

      <div className="card mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">{period.reportType.name}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Period:</span> {formatDate(period.periodStart)} – {formatDate(period.periodEnd)}</div>
          <div><span className="text-gray-500">Due:</span> <span className="text-orange-600 font-medium">{formatDate(period.dueDate)}</span></div>
        </div>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attach Files <span className="text-gray-400">(up to 10, max 50MB each)</span>
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
            <Upload className="w-6 h-6 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Click to browse or drag & drop</span>
            <input type="file" multiple className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                setFiles((prev) => [...prev, ...selected].slice(0, 10));
              }} />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-3 py-1.5">
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-gray-400 text-xs">{(f.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea className="input resize-none" rows={3}
            placeholder="Any remarks for this submission..."
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button className="btn-primary" onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? 'Submitting…' : 'Submit Report'}
          </button>
          <Link href="/submissions" className="btn-secondary">Cancel</Link>
        </div>
      </div>
    </div>
  );
}

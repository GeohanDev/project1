'use client';
import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatDateTime, frequencyLabel } from '@/lib/utils';
import { ArrowLeft, Download, CheckCircle, XCircle, FileText } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Submission {
  id: string;
  status: string;
  submittedAt: string;
  notes: string | null;
  submittedBy: { id: string; name: string; email: string; role: string };
  submissionPeriod: {
    id: string;
    dueDate: string;
    periodStart: string;
    periodEnd: string;
    reportType: { name: string; frequency: string; department: { name: string } };
  };
  files: Array<{ id: string; filename: string; storedName: string; mimeType: string; size: number }>;
  approval: { status: string; comments: string | null; decidedAt: string | null; approver: { name: string } } | null;
}

export default function SubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comments, setComments] = useState('');
  const [approvalError, setApprovalError] = useState('');

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => api.get<Submission>(`/api/submissions/${id}`),
  });

  const approve = useMutation({
    mutationFn: (status: 'APPROVED' | 'REJECTED') =>
      api.post(`/api/submissions/${id}/approve`, { status, comments }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submission', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['submission-periods'] });
    },
    onError: (e) => setApprovalError((e as Error).message),
  });

  if (isLoading) return <div className="p-8"><div className="animate-pulse h-64 bg-gray-200 rounded-xl" /></div>;
  if (!submission) return <div className="p-8"><p className="text-gray-500">Submission not found</p></div>;

  const canApprove =
    (user?.role === 'HOD' || user?.role === 'PD' || user?.role === 'SUPER_ADMIN') &&
    !submission.approval &&
    submission.status === 'SUBMITTED';

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/submissions" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <PageHeader
        title="Submission Detail"
        subtitle={`${submission.submissionPeriod.reportType.department.name} · ${frequencyLabel(submission.submissionPeriod.reportType.frequency)}`}
      />

      <div className="card mb-4">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-semibold text-lg text-gray-900">{submission.submissionPeriod.reportType.name}</h2>
          <StatusBadge status={submission.approval?.status || submission.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Period: </span>{formatDate(submission.submissionPeriod.periodStart)} – {formatDate(submission.submissionPeriod.periodEnd)}</div>
          <div><span className="text-gray-500">Due: </span>{formatDate(submission.submissionPeriod.dueDate)}</div>
          <div><span className="text-gray-500">Submitted by: </span>{submission.submittedBy.name}</div>
          <div><span className="text-gray-500">Submitted at: </span>{formatDateTime(submission.submittedAt)}</div>
        </div>
        {submission.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Notes:</p>
            <p className="text-sm text-gray-700 mt-1">{submission.notes}</p>
          </div>
        )}
      </div>

      {submission.files.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Attached Files ({submission.files.length})</h3>
          <div className="space-y-2">
            {submission.files.map((f) => (
              <a key={f.id}
                href={`${API_URL}/api/submissions/files/${submission.id}/${f.storedName}`}
                download={f.filename}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate">{f.filename}</span>
                <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                <Download className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {submission.approval && (
        <div className={`card mb-4 border-l-4 ${submission.approval.status === 'APPROVED' ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center gap-2 mb-1">
            {submission.approval.status === 'APPROVED'
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : <XCircle className="w-5 h-5 text-red-600" />}
            <span className="font-medium text-gray-900">
              {submission.approval.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {submission.approval.approver.name}
            </span>
          </div>
          {submission.approval.decidedAt && (
            <p className="text-xs text-gray-500 mb-1">on {formatDateTime(submission.approval.decidedAt)}</p>
          )}
          {submission.approval.comments && (
            <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">{submission.approval.comments}</p>
          )}
        </div>
      )}

      {canApprove && (
        <div className="card">
          <h3 className="font-medium text-gray-900 mb-3">Review Submission</h3>
          <textarea className="input resize-none mb-3" rows={3}
            placeholder="Comments (optional)..." value={comments}
            onChange={(e) => setComments(e.target.value)} />
          {approvalError && <p className="text-sm text-red-600 mb-2">{approvalError}</p>}
          <div className="flex gap-3">
            <button className="btn-primary" onClick={() => approve.mutate('APPROVED')} disabled={approve.isPending}>
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button className="btn-danger" onClick={() => approve.mutate('REJECTED')} disabled={approve.isPending}>
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

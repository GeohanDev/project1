'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, frequencyLabel } from '@/lib/utils';
import { CalendarDays, Plus, Search, Upload, X, FileText, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface MeetingType {
  id: string;
  name: string;
  frequency: string;
  department: { name: string };
}

interface MeetingInstance {
  id: string;
  scheduledDate: string;
  actualDate: string | null;
  status: string;
  notes: string | null;
  meetingType: { name: string; frequency: string; department: { name: string } };
  files: Array<{ id: string; filename: string; storedName: string; mimeType: string; size: number; fileType: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function MeetingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<MeetingInstance | null>(null);
  const [newMeeting, setNewMeeting] = useState({ meetingTypeId: '', scheduledDate: '', notes: '' });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState('MINUTES');
  const [createError, setCreateError] = useState('');

  const { data: instances = [], isLoading } = useQuery({
    queryKey: ['meeting-instances'],
    queryFn: () => api.get<MeetingInstance[]>('/api/meeting-instances'),
  });

  const { data: meetingTypes = [] } = useQuery({
    queryKey: ['meeting-types'],
    queryFn: () => api.get<MeetingType[]>('/api/meeting-types'),
    enabled: showCreate,
  });

  const createInstance = useMutation({
    mutationFn: () => api.post('/api/meeting-instances', newMeeting),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-instances'] });
      setShowCreate(false);
      setNewMeeting({ meetingTypeId: '', scheduledDate: '', notes: '' });
    },
    onError: (e) => setCreateError((e as Error).message),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/api/meeting-instances/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-instances'] });
      if (selectedInstance) {
        setSelectedInstance((prev) => prev ? { ...prev, status: 'COMPLETED' } : null);
      }
    },
  });

  const uploadMeetingFiles = useMutation({
    mutationFn: (instanceId: string) => {
      const fd = new FormData();
      fd.append('fileType', fileType);
      uploadFiles.forEach((f) => fd.append('files', f));
      return api.upload(`/api/meeting-instances/${instanceId}/files`, fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-instances'] });
      setUploadFiles([]);
    },
  });

  const filtered = instances.filter((i) =>
    i.meetingType.name.toLowerCase().includes(search.toLowerCase()) ||
    i.meetingType.department.name.toLowerCase().includes(search.toLowerCase()),
  );

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'HOD' || user?.role === 'PD';

  return (
    <div className="p-8">
      <PageHeader
        title="Meetings"
        subtitle="Schedule and track meeting instances with materials"
        action={canEdit ? (
          <button className="btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Meeting
          </button>
        ) : undefined}
      />

      {/* Search */}
      <div className="relative max-w-xs mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Search meetings..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-gray-900 mb-4">Schedule Meeting</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Type</label>
                <select className="input" value={newMeeting.meetingTypeId}
                  onChange={(e) => setNewMeeting((p) => ({ ...p, meetingTypeId: e.target.value }))}>
                  <option value="">Select meeting type...</option>
                  {meetingTypes.map((mt) => (
                    <option key={mt.id} value={mt.id}>{mt.department.name} — {mt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input type="datetime-local" className="input" value={newMeeting.scheduledDate}
                  onChange={(e) => setNewMeeting((p) => ({ ...p, scheduledDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="input resize-none" rows={2} value={newMeeting.notes}
                  onChange={(e) => setNewMeeting((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <div className="flex gap-3">
                <button className="btn-primary" onClick={() => createInstance.mutate()} disabled={createInstance.isPending}>
                  {createInstance.isPending ? 'Creating…' : 'Create'}
                </button>
                <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedInstance && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">{selectedInstance.meetingType.name}</h2>
                <p className="text-sm text-gray-500">{selectedInstance.meetingType.department.name}</p>
              </div>
              <button onClick={() => setSelectedInstance(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div><span className="text-gray-500">Scheduled:</span> {formatDate(selectedInstance.scheduledDate)}</div>
              <div><span className="text-gray-500">Status:</span>{' '}
                <span className={`badge ${STATUS_COLORS[selectedInstance.status]}`}>{selectedInstance.status}</span>
              </div>
            </div>

            {selectedInstance.notes && (
              <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 mb-4">{selectedInstance.notes}</p>
            )}

            {/* Files */}
            {selectedInstance.files.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Files</p>
                <div className="space-y-1">
                  {selectedInstance.files.map((f) => (
                    <a key={f.id}
                      href={`${API_URL}/api/meeting-instances/files/${selectedInstance.id}/${f.storedName}`}
                      download={f.filename}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 truncate">{f.filename}</span>
                      <span className="text-xs text-gray-400 uppercase">{f.fileType}</span>
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Upload files */}
            {canEdit && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Upload Files</p>
                <select className="input text-sm" value={fileType} onChange={(e) => setFileType(e.target.value)}>
                  {['AGENDA', 'MATERIALS', 'MINUTES', 'ATTENDANCE', 'DOCUMENT'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-primary-600 hover:underline">
                  <Upload className="w-4 h-4" /> Choose files
                  <input type="file" multiple className="hidden"
                    onChange={(e) => setUploadFiles(Array.from(e.target.files || []))} />
                </label>
                {uploadFiles.length > 0 && (
                  <div className="space-y-1">
                    {uploadFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="flex-1 truncate">{f.name}</span>
                        <button onClick={() => setUploadFiles((p) => p.filter((_, j) => j !== i))}>
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    ))}
                    <button className="btn-primary btn-sm mt-1"
                      onClick={() => uploadMeetingFiles.mutate(selectedInstance.id)}
                      disabled={uploadMeetingFiles.isPending}>
                      {uploadMeetingFiles.isPending ? 'Uploading…' : 'Upload'}
                    </button>
                  </div>
                )}

                {selectedInstance.status === 'SCHEDULED' && (
                  <button className="btn-secondary btn-sm"
                    onClick={() => updateStatus.mutate({ id: selectedInstance.id, status: 'COMPLETED' })}>
                    Mark as Completed
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card animate-pulse h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No meetings scheduled"
          description="Schedule a meeting using the button above." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Meeting</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Scheduled</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Files</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((instance) => (
                <tr key={instance.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{instance.meetingType.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{instance.meetingType.department.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{frequencyLabel(instance.meetingType.frequency)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(instance.scheduledDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLORS[instance.status] || 'bg-gray-100 text-gray-800'}`}>
                      {instance.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{instance.files.length}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm text-primary-600 hover:underline"
                      onClick={() => setSelectedInstance(instance)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

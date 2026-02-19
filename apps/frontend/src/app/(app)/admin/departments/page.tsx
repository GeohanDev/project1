'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { frequencyLabel } from '@/lib/utils';
import { Building2, ChevronDown, ChevronRight, FileText, CalendarDays, Users } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  picName: string;
  reportTypes: Array<{ id: string; name: string; frequency: string; isActive: boolean }>;
  meetingTypes: Array<{ id: string; name: string; frequency: string }>;
  users: Array<{ id: string; name: string; role: string }>;
}

const FREQ_COLORS: Record<string, string> = {
  DAILY: 'bg-blue-100 text-blue-700',
  WEEKLY: 'bg-purple-100 text-purple-700',
  MONTHLY: 'bg-green-100 text-green-700',
  QUARTERLY: 'bg-orange-100 text-orange-700',
  YEARLY: 'bg-red-100 text-red-700',
  PROJECT_COMPLETION: 'bg-gray-100 text-gray-700',
};

export default function DepartmentsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments-detail'],
    queryFn: async () => {
      const list = await api.get<Array<{ id: string; name: string; picName: string }>>('/api/departments');
      return list;
    },
  });

  const { data: deptDetail } = useQuery({
    queryKey: ['department', expanded],
    queryFn: () => api.get<Department>(`/api/departments/${expanded}`),
    enabled: !!expanded,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Departments"
        subtitle={`${departments.length} departments across the organisation`}
      />

      <div className="space-y-2">
        {departments.map((dept) => {
          const isOpen = expanded === dept.id;
          const detail = isOpen ? deptDetail : null;

          return (
            <div key={dept.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : dept.id)}
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{dept.name}</p>
                  <p className="text-sm text-gray-500">PIC: {dept.picName}</p>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                  {!detail ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Report Types */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-3">
                          <FileText className="w-4 h-4" /> Reports ({detail.reportTypes.length})
                        </h3>
                        <div className="space-y-1.5">
                          {detail.reportTypes.map((r) => (
                            <div key={r.id} className="flex items-center gap-2">
                              <span className={`badge text-xs shrink-0 ${FREQ_COLORS[r.frequency] || 'bg-gray-100 text-gray-700'}`}>
                                {frequencyLabel(r.frequency)}
                              </span>
                              <span className="text-xs text-gray-700 truncate">{r.name}</span>
                            </div>
                          ))}
                          {detail.reportTypes.length === 0 && <p className="text-xs text-gray-400">No reports</p>}
                        </div>
                      </div>

                      {/* Meeting Types */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-3">
                          <CalendarDays className="w-4 h-4" /> Meetings ({detail.meetingTypes.length})
                        </h3>
                        <div className="space-y-1.5">
                          {detail.meetingTypes.map((m) => (
                            <div key={m.id} className="flex items-center gap-2">
                              <span className={`badge text-xs shrink-0 ${FREQ_COLORS[m.frequency] || 'bg-gray-100 text-gray-700'}`}>
                                {frequencyLabel(m.frequency)}
                              </span>
                              <span className="text-xs text-gray-700 truncate">{m.name}</span>
                            </div>
                          ))}
                          {detail.meetingTypes.length === 0 && <p className="text-xs text-gray-400">No meetings</p>}
                        </div>
                      </div>

                      {/* Users */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-3">
                          <Users className="w-4 h-4" /> Members ({detail.users.length})
                        </h3>
                        <div className="space-y-1.5">
                          {detail.users.map((u) => (
                            <div key={u.id} className="flex items-center gap-2 text-xs">
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium shrink-0">
                                {u.name[0].toUpperCase()}
                              </div>
                              <span className="text-gray-700">{u.name}</span>
                              <span className="badge bg-gray-100 text-gray-600">{u.role}</span>
                            </div>
                          ))}
                          {detail.users.length === 0 && <p className="text-xs text-gray-400">No users assigned</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

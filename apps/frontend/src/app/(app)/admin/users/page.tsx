'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { roleLabel } from '@/lib/utils';
import { Users, Plus, X, Pencil } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId: string | null;
  department: { name: string } | null;
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
}

const ROLES = ['SUPER_ADMIN', 'HOD', 'PD', 'STAFF'];

const defaultForm = { email: '', name: '', password: '', role: 'STAFF', departmentId: '' };

export default function UsersPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/api/users'),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<Department[]>('/api/departments'),
  });

  const createUser = useMutation({
    mutationFn: () => api.post('/api/users', { ...form, departmentId: form.departmentId || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowCreate(false); setForm(defaultForm); },
    onError: (e) => setError((e as Error).message),
  });

  const updateUser = useMutation({
    mutationFn: () => api.put(`/api/users/${editUser!.id}`, {
      name: form.name,
      role: form.role,
      departmentId: form.departmentId || null,
      ...(form.password ? { password: form.password } : {}),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditUser(null); setForm(defaultForm); },
    onError: (e) => setError((e as Error).message),
  });

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ email: u.email, name: u.name, password: '', role: u.role, departmentId: u.departmentId || '' });
    setError('');
  };

  const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    HOD: 'bg-purple-100 text-purple-700',
    PD: 'bg-blue-100 text-blue-700',
    STAFF: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Users"
        subtitle={`${users.length} users in the system`}
        action={
          <button className="btn-primary btn-sm" onClick={() => { setShowCreate(true); setForm(defaultForm); setError(''); }}>
            <Plus className="w-4 h-4" /> Add User
          </button>
        }
      />

      {/* Modal */}
      {(showCreate || editUser) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{editUser ? 'Edit User' : 'Create User'}</h2>
              <button onClick={() => { setShowCreate(false); setEditUser(null); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="input" value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" className="input" value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editUser && <span className="text-gray-400">(leave blank to keep)</span>}
                </label>
                <input type="password" className="input" value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="input" value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                  {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select className="input" value={form.departmentId}
                  onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}>
                  <option value="">— None —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button
                  className="btn-primary"
                  onClick={() => editUser ? updateUser.mutate() : createUser.mutate()}
                  disabled={createUser.isPending || updateUser.isPending}
                >
                  {(createUser.isPending || updateUser.isPending) ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
                </button>
                <button className="btn-secondary" onClick={() => { setShowCreate(false); setEditUser(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card animate-pulse h-14" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-semibold">
                        {u.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.department?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-secondary btn-sm" onClick={() => openEdit(u)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
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
